import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActionResult,
  AppUser,
  FriendRequestView,
  OutgoingFriendRequestView,
  PokeStatus,
  PokeView,
  WeeklyTask,
  WeeklyCheckIn,
  WeeklyCheckInView,
} from '../types';
import { useAuth } from './AuthContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const STORAGE = {
  profile: '@actbl/local/profile',
  tasks: '@actbl/local/tasks',
  checkIns: '@actbl/local/check-ins',
  friends: '@actbl/local/friends',
  outgoingRequests: '@actbl/local/outgoing-requests',
  incomingRequests: '@actbl/local/incoming-requests',
  pokes: '@actbl/local/pokes',
  reminderEnabled: '@actbl/reminders/enabled',
  reminderId: '@actbl/reminders/id',
  reminderTime: '@actbl/reminders/time',
  darkMode: '@actbl/theme/dark-mode-enabled',
};

const DEFAULT_REMINDER_HOUR = 19;
const DEFAULT_REMINDER_MINUTE = 0;

const POKE_NOTIFICATION_CATEGORY_ID = 'ACTBL_POKE_ACTIONS';
const DEFAULT_POKE_MESSAGE = 'Quick poke: you got this. Are you on your tasks?';

interface AppContextValue {
  isHydrated: boolean;
  currentUser: AppUser | null;
  myQrPayload: string;
  weekStartISO: string;
  friends: AppUser[];
  incomingRequests: FriendRequestView[];
  outgoingRequests: OutgoingFriendRequestView[];
  incomingPokes: PokeView[];
  outgoingPokes: PokeView[];
  currentWeekTasks: WeeklyTask[];
  currentWeekCheckIns: WeeklyCheckInView[];
  myWeeklyCheckIn: WeeklyCheckIn | null;
  dailyReminderEnabled: boolean;
  dailyReminderHour: number;
  dailyReminderMinute: number;
  darkModeEnabled: boolean;
  defaultPokeMessage: string;
  rotateFriendCode: () => Promise<ActionResult>;
  sendFriendRequestByCode: (rawCode: string) => Promise<ActionResult>;
  acceptFriendRequest: (requestId: string) => Promise<ActionResult>;
  declineFriendRequest: (requestId: string) => Promise<ActionResult>;
  sendPoke: (friendId: string, message?: string) => Promise<ActionResult>;
  respondToPoke: (pokeId: string, status: Exclude<PokeStatus, 'pending'>) => Promise<ActionResult>;
  setDailyReminderEnabled: (enabled: boolean) => Promise<ActionResult>;
  setDailyReminderTime: (hour: number, minute: number) => Promise<ActionResult>;
  setDarkModeEnabled: (enabled: boolean) => Promise<ActionResult>;
  createTask: (title: string, accountabilityFriendId?: string) => Promise<ActionResult>;
  toggleTask: (taskId: string) => Promise<ActionResult>;
  deleteTask: (taskId: string) => Promise<ActionResult>;
  submitWeeklyCheckIn: (input: {
    completedTaskIds: string[];
    missedTaskIds: string[];
    missedReason?: string;
    nextWeekFocus?: string;
  }) => Promise<ActionResult>;
  resetLocalData: () => Promise<ActionResult>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function result(ok: boolean, message: string): ActionResult {
  return { ok, message };
}

function generateLocalId(): string {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function generateFriendCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getCurrentWeekStartDateString(now = new Date()): string {
  const date = new Date(now);
  const weekday = date.getDay();
  const distanceFromMonday = (weekday + 6) % 7;
  date.setDate(date.getDate() - distanceFromMonday);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

function weekStartDateToISO(weekStartDate: string): string {
  return `${weekStartDate}T00:00:00.000Z`;
}

function normalizeCode(rawCode: string): string {
  return rawCode.replace(/\D/g, '').slice(0, 6);
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  const rounded = Math.round(value);
  if (rounded < min) return min;
  if (rounded > max) return max;
  return rounded;
}

function formatReminderTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function parseReminderTime(raw: string | null): {
  hour: number;
  minute: number;
} {
  if (!raw) {
    return { hour: DEFAULT_REMINDER_HOUR, minute: DEFAULT_REMINDER_MINUTE };
  }
  const match = raw.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) {
    return { hour: DEFAULT_REMINDER_HOUR, minute: DEFAULT_REMINDER_MINUTE };
  }
  return {
    hour: clampInt(Number(match[1]), 0, 23),
    minute: clampInt(Number(match[2]), 0, 59),
  };
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  // The signed-in identity now comes from Supabase via AuthContext.
  // We expose it through AppContext as `currentUser` so existing screens
  // keep working unchanged while the data layer migrates over.
  const { user, profile: authProfile } = useAuth();
  const currentUser: AppUser | null = useMemo(() => {
    if (!authProfile || !user) return null;
    return {
      id: authProfile.id,
      name: authProfile.name || 'You',
      email: user.email ?? '',
      friendCode: authProfile.friendCode,
    };
  }, [authProfile, user]);

  const [friends, setFriends] = useState<AppUser[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestView[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<OutgoingFriendRequestView[]>([]);
  const [incomingPokes, setIncomingPokes] = useState<PokeView[]>([]);
  const [outgoingPokes, setOutgoingPokes] = useState<PokeView[]>([]);
  const [currentWeekTasks, setCurrentWeekTasks] = useState<WeeklyTask[]>([]);
  const [currentWeekCheckIns, setCurrentWeekCheckIns] = useState<WeeklyCheckInView[]>([]);
  const [myWeeklyCheckIn, setMyWeeklyCheckIn] = useState<WeeklyCheckIn | null>(null);
  const [dailyReminderEnabled, setDailyReminderEnabledState] = useState(false);
  const [dailyReminderHour, setDailyReminderHourState] = useState(
    DEFAULT_REMINDER_HOUR,
  );
  const [dailyReminderMinute, setDailyReminderMinuteState] = useState(
    DEFAULT_REMINDER_MINUTE,
  );
  const [darkModeEnabled, setDarkModeEnabledState] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const weekStartDate = useMemo(() => getCurrentWeekStartDateString(), []);
  const weekStartISO = useMemo(() => weekStartDateToISO(weekStartDate), [weekStartDate]);

  const ensureNotificationsPermission = useCallback(async (): Promise<boolean> => {
    const settings = await Notifications.getPermissionsAsync();
    if (
      settings.granted ||
      settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    ) {
      return true;
    }
    const request = await Notifications.requestPermissionsAsync();
    return Boolean(
      request.granted ||
        request.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL,
    );
  }, []);

  const scheduleDailyReminder = useCallback(
    async (hour: number, minute: number): Promise<string | null> => {
      const ok = await ensureNotificationsPermission();
      if (!ok) {
        return null;
      }
      return Notifications.scheduleNotificationAsync({
        content: {
          title: 'ACTBL Daily Check-In',
          body: 'Keep your streak going. Make progress on your weekly tasks today.',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
    },
    [ensureNotificationsPermission],
  );

  const refreshLocalData = useCallback(async () => {
    const allTasks = await readJson<WeeklyTask[]>(STORAGE.tasks, []);
    const weekTasks = allTasks
      .filter((task) => task.weekStartISO === weekStartISO)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    setCurrentWeekTasks(weekTasks);

    const allCheckIns = await readJson<WeeklyCheckIn[]>(STORAGE.checkIns, []);
    const myCheckIn = allCheckIns.find((c) => c.weekStartISO === weekStartISO) ?? null;
    setMyWeeklyCheckIn(myCheckIn);
    setCurrentWeekCheckIns(
      myCheckIn ? [{ ...myCheckIn, ownerName: 'You' }] : [],
    );

    const friendList = await readJson<AppUser[]>(STORAGE.friends, []);
    setFriends(friendList);

    const incoming = await readJson<FriendRequestView[]>(STORAGE.incomingRequests, []);
    setIncomingRequests(incoming);
    const outgoing = await readJson<OutgoingFriendRequestView[]>(STORAGE.outgoingRequests, []);
    setOutgoingRequests(outgoing);

    const allPokes = await readJson<PokeView[]>(STORAGE.pokes, []);
    const profile = await readJson<AppUser | null>(STORAGE.profile, null);
    const myId = profile?.id ?? '';
    setIncomingPokes(
      allPokes
        .filter((poke) => poke.toUserId === myId)
        .sort((a, b) => {
          const ap = a.status === 'pending' ? 0 : 1;
          const bp = b.status === 'pending' ? 0 : 1;
          if (ap !== bp) return ap - bp;
          return b.createdAt.localeCompare(a.createdAt);
        }),
    );
    setOutgoingPokes(
      allPokes
        .filter((poke) => poke.fromUserId === myId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  }, [weekStartISO]);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      const reminderEnabled =
        (await AsyncStorage.getItem(STORAGE.reminderEnabled)) === 'true';
      const reminderTimeRaw = await AsyncStorage.getItem(STORAGE.reminderTime);
      const { hour: storedHour, minute: storedMinute } =
        parseReminderTime(reminderTimeRaw);
      const dark = (await AsyncStorage.getItem(STORAGE.darkMode)) === 'true';

      if (reminderEnabled) {
        const existing = await AsyncStorage.getItem(STORAGE.reminderId);
        if (!existing) {
          const id = await scheduleDailyReminder(storedHour, storedMinute);
          if (id) {
            await AsyncStorage.setItem(STORAGE.reminderId, id);
          }
        }
      }

      if (!mounted) {
        return;
      }

      setDailyReminderEnabledState(reminderEnabled);
      setDailyReminderHourState(storedHour);
      setDailyReminderMinuteState(storedMinute);
      setDarkModeEnabledState(dark);
      setIsHydrated(true);
    }

    void hydrate();

    return () => {
      mounted = false;
    };
  }, [scheduleDailyReminder]);

  useEffect(() => {
    if (!isHydrated || !currentUser) {
      return;
    }
    void refreshLocalData();
  }, [isHydrated, currentUser, refreshLocalData]);

  useEffect(() => {
    void Notifications.setNotificationCategoryAsync(POKE_NOTIFICATION_CATEGORY_ID, [
      { identifier: 'POKE_ON_IT', buttonTitle: "I'm on it" },
      { identifier: 'POKE_LATER', buttonTitle: 'Later' },
    ]);
  }, []);

  async function syncDailyReminder(
    enabled: boolean,
    hour: number,
    minute: number,
  ): Promise<ActionResult> {
    const existing = await AsyncStorage.getItem(STORAGE.reminderId);
    if (!enabled) {
      if (existing) {
        await Notifications.cancelScheduledNotificationAsync(existing);
      }
      await AsyncStorage.removeItem(STORAGE.reminderId);
      await AsyncStorage.setItem(STORAGE.reminderEnabled, 'false');
      return result(true, 'Daily reminder disabled.');
    }
    const id = await scheduleDailyReminder(hour, minute);
    if (!id) {
      return result(false, 'Notification permission is required for daily reminders.');
    }
    if (existing) {
      await Notifications.cancelScheduledNotificationAsync(existing);
    }
    await AsyncStorage.setItem(STORAGE.reminderId, id);
    await AsyncStorage.setItem(STORAGE.reminderEnabled, 'true');
    return result(true, 'Daily reminder enabled.');
  }

  async function setDailyReminderEnabled(enabled: boolean): Promise<ActionResult> {
    const previous = dailyReminderEnabled;
    setDailyReminderEnabledState(enabled);
    const r = await syncDailyReminder(
      enabled,
      dailyReminderHour,
      dailyReminderMinute,
    );
    if (!r.ok) {
      setDailyReminderEnabledState(previous);
    }
    return r;
  }

  async function setDailyReminderTime(
    hour: number,
    minute: number,
  ): Promise<ActionResult> {
    const clampedHour = clampInt(hour, 0, 23);
    const clampedMinute = clampInt(minute, 0, 59);
    setDailyReminderHourState(clampedHour);
    setDailyReminderMinuteState(clampedMinute);
    await AsyncStorage.setItem(
      STORAGE.reminderTime,
      formatReminderTime(clampedHour, clampedMinute),
    );
    if (dailyReminderEnabled) {
      const r = await syncDailyReminder(true, clampedHour, clampedMinute);
      if (!r.ok) {
        return r;
      }
      return result(true, 'Reminder time updated.');
    }
    return result(true, 'Reminder time saved.');
  }

  async function setDarkModeEnabled(enabled: boolean): Promise<ActionResult> {
    setDarkModeEnabledState(enabled);
    await AsyncStorage.setItem(STORAGE.darkMode, enabled ? 'true' : 'false');
    return result(true, enabled ? 'Dark mode enabled.' : 'Dark mode disabled.');
  }

  async function createTask(
    title: string,
    accountabilityFriendId?: string,
  ): Promise<ActionResult> {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      return result(false, 'Task title cannot be empty.');
    }

    const isValidFriend = accountabilityFriendId
      ? friends.some((friend) => friend.id === accountabilityFriendId)
      : false;

    const newTask: WeeklyTask = {
      id: generateLocalId(),
      ownerId: currentUser?.id ?? 'local',
      title: cleanTitle,
      completed: false,
      weekStartISO,
      accountabilityFriendId: isValidFriend ? accountabilityFriendId : undefined,
      createdAt: new Date().toISOString(),
    };

    const allTasks = await readJson<WeeklyTask[]>(STORAGE.tasks, []);
    await writeJson(STORAGE.tasks, [newTask, ...allTasks]);
    await refreshLocalData();
    return result(true, 'Task added for this week.');
  }

  async function toggleTask(taskId: string): Promise<ActionResult> {
    const allTasks = await readJson<WeeklyTask[]>(STORAGE.tasks, []);
    const target = allTasks.find((task) => task.id === taskId);
    if (!target) {
      return result(false, 'Task not found.');
    }
    const next = allTasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task,
    );
    await writeJson(STORAGE.tasks, next);
    await refreshLocalData();
    return result(true, 'Task updated.');
  }

  async function deleteTask(taskId: string): Promise<ActionResult> {
    const allTasks = await readJson<WeeklyTask[]>(STORAGE.tasks, []);
    await writeJson(
      STORAGE.tasks,
      allTasks.filter((task) => task.id !== taskId),
    );
    await refreshLocalData();
    return result(true, 'Task deleted.');
  }

  async function submitWeeklyCheckIn(input: {
    completedTaskIds: string[];
    missedTaskIds: string[];
    missedReason?: string;
    nextWeekFocus?: string;
  }): Promise<ActionResult> {
    const completedIds = Array.from(new Set(input.completedTaskIds.filter(Boolean)));
    const missedIds = Array.from(new Set(input.missedTaskIds.filter(Boolean)));

    const allCheckIns = await readJson<WeeklyCheckIn[]>(STORAGE.checkIns, []);
    const existing = allCheckIns.find((c) => c.weekStartISO === weekStartISO);
    const now = new Date().toISOString();
    const nextCheckIn: WeeklyCheckIn = {
      id: existing?.id ?? generateLocalId(),
      ownerId: currentUser?.id ?? 'local',
      weekStartISO,
      completedTaskIds: completedIds,
      missedTaskIds: missedIds,
      missedReason: input.missedReason?.trim() || null,
      nextWeekFocus: input.nextWeekFocus?.trim() || null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    const others = allCheckIns.filter((c) => c.weekStartISO !== weekStartISO);
    await writeJson(STORAGE.checkIns, [...others, nextCheckIn]);
    await refreshLocalData();
    return result(true, 'Weekly check-in saved.');
  }

  async function rotateFriendCode(): Promise<ActionResult> {
    // The friend code now lives on the Supabase profile and rotates via
    // server-side logic (not yet wired). Keep this as a no-op for now so
    // existing UI doesn't break.
    return result(false, 'Rotating the friend code is not supported yet.');
  }

  async function sendFriendRequestByCode(rawCode: string): Promise<ActionResult> {
    const code = normalizeCode(rawCode);
    if (code.length !== 6) {
      return result(false, 'Friend codes must be 6 digits.');
    }
    if (currentUser && code === currentUser.friendCode) {
      return result(false, 'That is your own code.');
    }
    const friendList = await readJson<AppUser[]>(STORAGE.friends, []);
    if (friendList.some((friend) => friend.friendCode === code)) {
      return result(false, 'You are already linked as friends.');
    }
    const newFriend: AppUser = {
      id: `local-friend-${code}-${Date.now().toString(36)}`,
      name: `Friend ${code}`,
      email: `${code}@local`,
      friendCode: code,
    };
    await writeJson(STORAGE.friends, [...friendList, newFriend]);
    await refreshLocalData();
    return result(true, `Linked with ${newFriend.name}.`);
  }

  async function acceptFriendRequest(requestId: string): Promise<ActionResult> {
    const incoming = await readJson<FriendRequestView[]>(STORAGE.incomingRequests, []);
    const target = incoming.find((req) => req.id === requestId);
    if (!target) {
      return result(false, 'Request is no longer available.');
    }
    const friendList = await readJson<AppUser[]>(STORAGE.friends, []);
    const newFriend: AppUser = {
      id: `local-friend-${requestId}`,
      name: target.fromName,
      email: target.fromEmail,
      friendCode: '------',
    };
    await writeJson(STORAGE.friends, [...friendList, newFriend]);
    await writeJson(
      STORAGE.incomingRequests,
      incoming.filter((req) => req.id !== requestId),
    );
    await refreshLocalData();
    return result(true, 'Friend request accepted.');
  }

  async function declineFriendRequest(requestId: string): Promise<ActionResult> {
    const incoming = await readJson<FriendRequestView[]>(STORAGE.incomingRequests, []);
    await writeJson(
      STORAGE.incomingRequests,
      incoming.filter((req) => req.id !== requestId),
    );
    await refreshLocalData();
    return result(true, 'Friend request declined.');
  }

  async function sendPoke(friendId: string, message?: string): Promise<ActionResult> {
    if (!currentUser) {
      return result(false, 'Profile not ready.');
    }
    const friend = friends.find((f) => f.id === friendId);
    if (!friend) {
      return result(false, 'You can only poke linked friends.');
    }
    const cleanMessage = message?.trim() ? message.trim() : DEFAULT_POKE_MESSAGE;
    const newPoke: PokeView = {
      id: generateLocalId(),
      fromUserId: currentUser.id,
      fromName: currentUser.name,
      toUserId: friendId,
      toName: friend.name,
      message: cleanMessage,
      status: 'pending',
      createdAt: new Date().toISOString(),
      respondedAt: null,
    };
    const allPokes = await readJson<PokeView[]>(STORAGE.pokes, []);
    await writeJson(STORAGE.pokes, [newPoke, ...allPokes]);
    await refreshLocalData();
    return result(true, 'Poke sent.');
  }

  async function resetLocalData(): Promise<ActionResult> {
    // Cancel any scheduled daily reminder so it doesn't keep firing for stale data.
    const reminderId = await AsyncStorage.getItem(STORAGE.reminderId);
    if (reminderId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(reminderId);
      } catch {
        // ignore — notification may already be gone
      }
    }

    // Clear local prototype data + reminder bookkeeping.
    // Dark mode preference is intentionally preserved.
    await AsyncStorage.multiRemove([
      STORAGE.profile,
      STORAGE.tasks,
      STORAGE.checkIns,
      STORAGE.friends,
      STORAGE.outgoingRequests,
      STORAGE.incomingRequests,
      STORAGE.pokes,
      STORAGE.reminderEnabled,
      STORAGE.reminderId,
      STORAGE.reminderTime,
    ]);

    // Reset in-memory state. The signed-in identity (currentUser) is now
    // sourced from AuthContext, so we don't touch it here.
    setFriends([]);
    setIncomingRequests([]);
    setOutgoingRequests([]);
    setIncomingPokes([]);
    setOutgoingPokes([]);
    setCurrentWeekTasks([]);
    setCurrentWeekCheckIns([]);
    setMyWeeklyCheckIn(null);
    setDailyReminderEnabledState(false);
    setDailyReminderHourState(DEFAULT_REMINDER_HOUR);
    setDailyReminderMinuteState(DEFAULT_REMINDER_MINUTE);

    return result(true, 'Local data cleared.');
  }

  async function respondToPoke(
    pokeId: string,
    status: Exclude<PokeStatus, 'pending'>,
  ): Promise<ActionResult> {
    const allPokes = await readJson<PokeView[]>(STORAGE.pokes, []);
    const next = allPokes.map((poke) =>
      poke.id === pokeId
        ? { ...poke, status, respondedAt: new Date().toISOString() }
        : poke,
    );
    await writeJson(STORAGE.pokes, next);
    await refreshLocalData();
    return result(true, status === 'on_it' ? 'Marked as on it.' : 'Marked as later.');
  }

  const value: AppContextValue = {
    isHydrated,
    currentUser,
    myQrPayload: currentUser ? `ACTBL:${currentUser.friendCode}` : '',
    weekStartISO,
    friends,
    incomingRequests,
    outgoingRequests,
    incomingPokes,
    outgoingPokes,
    currentWeekTasks,
    currentWeekCheckIns,
    myWeeklyCheckIn,
    dailyReminderEnabled,
    dailyReminderHour,
    dailyReminderMinute,
    darkModeEnabled,
    defaultPokeMessage: DEFAULT_POKE_MESSAGE,
    rotateFriendCode,
    sendFriendRequestByCode,
    acceptFriendRequest,
    declineFriendRequest,
    sendPoke,
    respondToPoke,
    setDailyReminderEnabled,
    setDailyReminderTime,
    setDarkModeEnabled,
    createTask,
    toggleTask,
    deleteTask,
    submitWeeklyCheckIn,
    resetLocalData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error('useAppContext must be used inside AppProvider.');
  }
  return value;
}
