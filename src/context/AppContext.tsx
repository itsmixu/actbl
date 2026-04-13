import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { supabase } from '../lib/supabase';
import {
  ActionResult,
  AppUser,
  FriendRequestView,
  OutgoingFriendRequestView,
  PokeStatus,
  PokeView,
  WeeklyTask,
} from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const DAILY_REMINDER_ENABLED_STORAGE_KEY = '@actbl/reminders/enabled';
const DAILY_REMINDER_NOTIFICATION_ID_STORAGE_KEY = '@actbl/reminders/id';
const DARK_MODE_ENABLED_STORAGE_KEY = '@actbl/theme/dark-mode-enabled';
const POKE_NOTIFICATION_CATEGORY_ID = 'ACTBL_POKE_ACTIONS';
const DEFAULT_POKE_MESSAGE = 'Quick poke: you got this. Are you on your tasks?';

interface SignUpInput {
  name: string;
  email: string;
  password: string;
}

interface SignInInput {
  email: string;
  password: string;
}

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
  dailyReminderEnabled: boolean;
  darkModeEnabled: boolean;
  defaultPokeMessage: string;
  signUp: (input: SignUpInput) => Promise<ActionResult>;
  signIn: (input: SignInInput) => Promise<ActionResult>;
  signOut: () => Promise<ActionResult>;
  deleteAccount: () => Promise<ActionResult>;
  rotateFriendCode: () => Promise<ActionResult>;
  sendFriendRequestByCode: (rawCode: string) => Promise<ActionResult>;
  acceptFriendRequest: (requestId: string) => Promise<ActionResult>;
  declineFriendRequest: (requestId: string) => Promise<ActionResult>;
  sendPoke: (friendId: string, message?: string) => Promise<ActionResult>;
  respondToPoke: (pokeId: string, status: Exclude<PokeStatus, 'pending'>) => Promise<ActionResult>;
  setDailyReminderEnabled: (enabled: boolean) => Promise<ActionResult>;
  setDarkModeEnabled: (enabled: boolean) => Promise<ActionResult>;
  createTask: (title: string, accountabilityFriendId?: string) => Promise<ActionResult>;
  toggleTask: (taskId: string) => Promise<ActionResult>;
  deleteTask: (taskId: string) => Promise<ActionResult>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

interface ProfileRow {
  id: string;
  name: string;
  email: string;
  friend_code: string;
}

interface FriendRequestRow {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  responded_at: string | null;
}

interface FriendshipRow {
  id: string;
  user_low_id: string;
  user_high_id: string;
  created_at: string;
}

interface TaskRow {
  id: string;
  owner_id: string;
  title: string;
  completed: boolean;
  week_start: string;
  accountability_friend_id: string | null;
  created_at: string;
}

interface PokeRow {
  id: string;
  sender_user_id: string;
  recipient_user_id: string;
  message: string;
  status: PokeStatus;
  response_message: string | null;
  created_at: string;
  responded_at: string | null;
}

function normalizeCode(rawCode: string): string {
  return rawCode.replace(/\D/g, '').slice(0, 6);
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

function toPublicUser(profile: ProfileRow): AppUser {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    friendCode: profile.friend_code,
  };
}

function result(ok: boolean, message: string): ActionResult {
  return { ok, message };
}

function getUserPair(userAId: string, userBId: string): { lowId: string; highId: string } {
  return userAId < userBId
    ? { lowId: userAId, highId: userBId }
    : { lowId: userBId, highId: userAId };
}

async function wait(milliseconds: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function fetchProfileWithRetry(userId: string): Promise<ProfileRow | null> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, friend_code')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return data as ProfileRow;
    }

    await wait(200 * (attempt + 1));
  }

  return null;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [friends, setFriends] = useState<AppUser[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestView[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<OutgoingFriendRequestView[]>([]);
  const [incomingPokes, setIncomingPokes] = useState<PokeView[]>([]);
  const [outgoingPokes, setOutgoingPokes] = useState<PokeView[]>([]);
  const [currentWeekTasks, setCurrentWeekTasks] = useState<WeeklyTask[]>([]);
  const [dailyReminderEnabled, setDailyReminderEnabledState] = useState(false);
  const [darkModeEnabled, setDarkModeEnabledState] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const knownIncomingPokeIdsRef = useRef<Set<string>>(new Set());
  const hasLoadedIncomingPokesRef = useRef(false);

  const weekStartDate = useMemo(() => getCurrentWeekStartDateString(), []);
  const weekStartISO = useMemo(() => weekStartDateToISO(weekStartDate), [weekStartDate]);

  const clearUserData = useCallback(() => {
    setCurrentUser(null);
    setFriends([]);
    setIncomingRequests([]);
    setOutgoingRequests([]);
    setIncomingPokes([]);
    setOutgoingPokes([]);
    setCurrentWeekTasks([]);
    knownIncomingPokeIdsRef.current = new Set();
    hasLoadedIncomingPokesRef.current = false;
  }, []);

  const ensureNotificationsPermission = useCallback(async (): Promise<boolean> => {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
      return true;
    }

    const request = await Notifications.requestPermissionsAsync();
    return Boolean(
      request.granted || request.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL,
    );
  }, []);

  const scheduleDailyReminder = useCallback(async (): Promise<string | null> => {
    const hasPermission = await ensureNotificationsPermission();
    if (!hasPermission) {
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'ACTBL Daily Check-In',
        body: 'Keep your streak going. Make progress on your weekly tasks today.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 19,
        minute: 0,
      },
    });

    return notificationId;
  }, [ensureNotificationsPermission]);

  const syncDailyReminderSchedule = useCallback(
    async (enabled: boolean): Promise<ActionResult> => {
      const existingId = await AsyncStorage.getItem(DAILY_REMINDER_NOTIFICATION_ID_STORAGE_KEY);

      if (!enabled) {
        if (existingId) {
          await Notifications.cancelScheduledNotificationAsync(existingId);
        }
        await AsyncStorage.removeItem(DAILY_REMINDER_NOTIFICATION_ID_STORAGE_KEY);
        await AsyncStorage.setItem(DAILY_REMINDER_ENABLED_STORAGE_KEY, 'false');
        return result(true, 'Daily reminder disabled.');
      }

      const reminderId = await scheduleDailyReminder();
      if (!reminderId) {
        return result(false, 'Notification permission is required for daily reminders.');
      }

      if (existingId) {
        await Notifications.cancelScheduledNotificationAsync(existingId);
      }

      await AsyncStorage.setItem(DAILY_REMINDER_NOTIFICATION_ID_STORAGE_KEY, reminderId);
      await AsyncStorage.setItem(DAILY_REMINDER_ENABLED_STORAGE_KEY, 'true');
      return result(true, 'Daily reminder enabled.');
    },
    [scheduleDailyReminder],
  );

  const refreshData = useCallback(
    async (explicitUserId?: string): Promise<ActionResult> => {
      const targetUserId = explicitUserId ?? currentUserId;
      if (!targetUserId) {
        clearUserData();
        return result(false, 'No authenticated user.');
      }

      try {
        const profile = await fetchProfileWithRetry(targetUserId);

        if (!profile) {
          clearUserData();
          return result(false, 'Profile not ready yet.');
        }

        const [friendRequestResponse, friendshipResponse, taskResponse, pokeResponse] = await Promise.all([
          supabase
            .from('friend_requests')
            .select('id, from_user_id, to_user_id, status, created_at, responded_at')
            .or(`from_user_id.eq.${targetUserId},to_user_id.eq.${targetUserId}`)
            .order('created_at', { ascending: false }),
          supabase
            .from('friendships')
            .select('id, user_low_id, user_high_id, created_at')
            .or(`user_low_id.eq.${targetUserId},user_high_id.eq.${targetUserId}`)
            .order('created_at', { ascending: false }),
          supabase
            .from('tasks')
            .select('id, owner_id, title, completed, week_start, accountability_friend_id, created_at')
            .eq('owner_id', targetUserId)
            .eq('week_start', weekStartDate)
            .order('created_at', { ascending: false }),
          supabase
            .from('pokes')
            .select(
              'id, sender_user_id, recipient_user_id, message, status, response_message, created_at, responded_at',
            )
            .or(`sender_user_id.eq.${targetUserId},recipient_user_id.eq.${targetUserId}`)
            .order('created_at', { ascending: false }),
        ]);

        if (friendRequestResponse.error) {
          throw friendRequestResponse.error;
        }
        if (friendshipResponse.error) {
          throw friendshipResponse.error;
        }
        if (taskResponse.error) {
          throw taskResponse.error;
        }
        if (pokeResponse.error) {
          throw pokeResponse.error;
        }

        const friendRequests = (friendRequestResponse.data ?? []) as FriendRequestRow[];
        const friendships = (friendshipResponse.data ?? []) as FriendshipRow[];
        const tasks = (taskResponse.data ?? []) as TaskRow[];
        const pokes = (pokeResponse.data ?? []) as PokeRow[];

        const profileIds = new Set<string>([targetUserId]);

        for (const request of friendRequests) {
          profileIds.add(request.from_user_id);
          profileIds.add(request.to_user_id);
        }

        const friendIds = new Set<string>();
        for (const friendship of friendships) {
          const friendId =
            friendship.user_low_id === targetUserId
              ? friendship.user_high_id
              : friendship.user_low_id;
          profileIds.add(friendId);
          friendIds.add(friendId);
        }

        for (const task of tasks) {
          if (task.accountability_friend_id) {
            profileIds.add(task.accountability_friend_id);
          }
        }

        for (const poke of pokes) {
          profileIds.add(poke.sender_user_id);
          profileIds.add(poke.recipient_user_id);
        }

        const allProfileIds = Array.from(profileIds);
        const profileLookup = new Map<string, ProfileRow>();
        profileLookup.set(profile.id, profile);

        if (allProfileIds.length > 0) {
          const { data: profileRows, error: profileRowsError } = await supabase
            .from('profiles')
            .select('id, name, email, friend_code')
            .in('id', allProfileIds);

          if (profileRowsError) {
            throw profileRowsError;
          }

          for (const profileRow of (profileRows ?? []) as ProfileRow[]) {
            profileLookup.set(profileRow.id, profileRow);
          }
        }

        const nextFriends = Array.from(friendIds)
          .map((friendId) => profileLookup.get(friendId))
          .filter((candidate): candidate is ProfileRow => Boolean(candidate))
          .map((candidate) => toPublicUser(candidate))
          .sort((a, b) => a.name.localeCompare(b.name));

        const nextIncoming = friendRequests
          .filter((request) => request.status === 'pending' && request.to_user_id === targetUserId)
          .map((request) => {
            const fromProfile = profileLookup.get(request.from_user_id);
            return {
              id: request.id,
              fromName: fromProfile?.name ?? 'Unknown user',
              fromEmail: fromProfile?.email ?? 'unknown@example.com',
              createdAt: request.created_at,
            };
          });

        const nextOutgoing = friendRequests
          .filter((request) => request.status === 'pending' && request.from_user_id === targetUserId)
          .map((request) => {
            const toProfile = profileLookup.get(request.to_user_id);
            return {
              id: request.id,
              toName: toProfile?.name ?? 'Unknown user',
              toEmail: toProfile?.email ?? 'unknown@example.com',
              createdAt: request.created_at,
            };
          });

        const nextTasks: WeeklyTask[] = tasks.map((task) => ({
          id: task.id,
          ownerId: task.owner_id,
          title: task.title,
          completed: task.completed,
          weekStartISO: weekStartDateToISO(task.week_start),
          accountabilityFriendId: task.accountability_friend_id ?? undefined,
          createdAt: task.created_at,
        }));

        const nextIncomingPokes: PokeView[] = pokes
          .filter((poke) => poke.recipient_user_id === targetUserId)
          .map((poke) => {
            const fromProfile = profileLookup.get(poke.sender_user_id);
            const toProfile = profileLookup.get(poke.recipient_user_id);
            return {
              id: poke.id,
              fromUserId: poke.sender_user_id,
              fromName: fromProfile?.name ?? 'Unknown user',
              toUserId: poke.recipient_user_id,
              toName: toProfile?.name ?? 'You',
              message: poke.message,
              status: poke.status,
              createdAt: poke.created_at,
              respondedAt: poke.responded_at,
            };
          })
          .sort((a, b) => {
            const aPriority = a.status === 'pending' ? 0 : 1;
            const bPriority = b.status === 'pending' ? 0 : 1;
            if (aPriority !== bPriority) {
              return aPriority - bPriority;
            }
            return b.createdAt.localeCompare(a.createdAt);
          });

        const nextOutgoingPokes: PokeView[] = pokes
          .filter((poke) => poke.sender_user_id === targetUserId)
          .map((poke) => {
            const fromProfile = profileLookup.get(poke.sender_user_id);
            const toProfile = profileLookup.get(poke.recipient_user_id);
            return {
              id: poke.id,
              fromUserId: poke.sender_user_id,
              fromName: fromProfile?.name ?? 'You',
              toUserId: poke.recipient_user_id,
              toName: toProfile?.name ?? 'Unknown user',
              message: poke.message,
              status: poke.status,
              createdAt: poke.created_at,
              respondedAt: poke.responded_at,
            };
          })
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

        const pendingIncomingPokes = nextIncomingPokes.filter((poke) => poke.status === 'pending');

        if (!hasLoadedIncomingPokesRef.current) {
          hasLoadedIncomingPokesRef.current = true;
          knownIncomingPokeIdsRef.current = new Set(pendingIncomingPokes.map((poke) => poke.id));
        } else {
          const hasNotificationPermission = await ensureNotificationsPermission();

          for (const poke of pendingIncomingPokes) {
            if (knownIncomingPokeIdsRef.current.has(poke.id)) {
              continue;
            }

            knownIncomingPokeIdsRef.current.add(poke.id);

            if (hasNotificationPermission) {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: `Poke from ${poke.fromName}`,
                  body: poke.message,
                  data: { pokeId: poke.id },
                  categoryIdentifier: POKE_NOTIFICATION_CATEGORY_ID,
                },
                trigger: null,
              });
            }
          }

          const pendingIdSet = new Set(pendingIncomingPokes.map((poke) => poke.id));
          for (const knownId of Array.from(knownIncomingPokeIdsRef.current)) {
            if (!pendingIdSet.has(knownId)) {
              knownIncomingPokeIdsRef.current.delete(knownId);
            }
          }
        }

        setCurrentUser(toPublicUser(profile));
        setFriends(nextFriends);
        setIncomingRequests(nextIncoming);
        setOutgoingRequests(nextOutgoing);
        setIncomingPokes(nextIncomingPokes);
        setOutgoingPokes(nextOutgoingPokes);
        setCurrentWeekTasks(nextTasks);

        return result(true, 'Data refreshed.');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to refresh data.';
        return result(false, message);
      }
    },
    [clearUserData, currentUserId, ensureNotificationsPermission, weekStartDate],
  );

  const respondToPoke = useCallback(
    async (pokeId: string, status: Exclude<PokeStatus, 'pending'>): Promise<ActionResult> => {
      if (!currentUserId) {
        return result(false, 'Sign in first.');
      }

      const { error } = await supabase
        .from('pokes')
        .update({ status, responded_at: new Date().toISOString(), response_message: null })
        .eq('id', pokeId)
        .eq('recipient_user_id', currentUserId)
        .eq('status', 'pending');

      if (error) {
        return result(false, error.message);
      }

      await refreshData(currentUserId);
      if (status === 'on_it') {
        return result(true, 'Marked as on it.');
      }
      return result(true, 'Marked as later.');
    },
    [currentUserId, refreshData],
  );

  useEffect(() => {
    let mounted = true;

    async function hydrateAuth() {
      const { data } = await supabase.auth.getSession();
      const reminderEnabled = (await AsyncStorage.getItem(DAILY_REMINDER_ENABLED_STORAGE_KEY)) === 'true';
      const darkModeEnabledStored = (await AsyncStorage.getItem(DARK_MODE_ENABLED_STORAGE_KEY)) === 'true';

      setDailyReminderEnabledState(reminderEnabled);
      setDarkModeEnabledState(darkModeEnabledStored);

      if (reminderEnabled) {
        const existingReminderId = await AsyncStorage.getItem(
          DAILY_REMINDER_NOTIFICATION_ID_STORAGE_KEY,
        );
        if (!existingReminderId) {
          const reminderId = await scheduleDailyReminder();
          if (reminderId) {
            await AsyncStorage.setItem(DAILY_REMINDER_NOTIFICATION_ID_STORAGE_KEY, reminderId);
          }
        }
      }

      if (!mounted) {
        return;
      }

      setCurrentUserId(data.session?.user.id ?? null);
      setIsHydrated(true);
    }

    void hydrateAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user.id ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [scheduleDailyReminder]);

  useEffect(() => {
    void Notifications.setNotificationCategoryAsync(POKE_NOTIFICATION_CATEGORY_ID, [
      {
        identifier: 'POKE_ON_IT',
        buttonTitle: "I'm on it",
      },
      {
        identifier: 'POKE_LATER',
        buttonTitle: 'Later',
      },
    ]);

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      if (!currentUserId) {
        return;
      }

      const actionId = response.actionIdentifier;
      if (actionId !== 'POKE_ON_IT' && actionId !== 'POKE_LATER') {
        return;
      }

      const pokeIdRaw = response.notification.request.content.data?.pokeId;
      if (!pokeIdRaw || typeof pokeIdRaw !== 'string') {
        return;
      }

      const nextStatus: Exclude<PokeStatus, 'pending'> = actionId === 'POKE_ON_IT' ? 'on_it' : 'later';
      void respondToPoke(pokeIdRaw, nextStatus);
    });

    return () => {
      subscription.remove();
    };
  }, [currentUserId, respondToPoke]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!currentUserId) {
      clearUserData();
      return;
    }

    void refreshData(currentUserId);

    const channel = supabase
      .channel(`actbl-realtime-${currentUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        void refreshData(currentUserId);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, () => {
        void refreshData(currentUserId);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
        void refreshData(currentUserId);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        void refreshData(currentUserId);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pokes' }, () => {
        void refreshData(currentUserId);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [clearUserData, currentUserId, isHydrated, refreshData]);

  async function signUp(input: SignUpInput): Promise<ActionResult> {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const password = input.password.trim();

    if (!name || !email || !password) {
      return result(false, 'Please fill in name, email, and password.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      return result(false, error.message);
    }

    const sessionUserId = data.session?.user?.id;
    if (!sessionUserId) {
      return result(true, 'Account created. Check your email, then sign in.');
    }

    setCurrentUserId(sessionUserId);
    const refreshResult = await refreshData(sessionUserId);
    if (!refreshResult.ok) {
      return result(true, 'Account created. Profile will appear in a moment.');
    }

    return result(true, 'Account created and signed in.');
  }

  async function signIn(input: SignInInput): Promise<ActionResult> {
    const email = input.email.trim().toLowerCase();
    const password = input.password.trim();

    if (!email || !password) {
      return result(false, 'Please provide email and password.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return result(false, error.message);
    }

    const nextUserId = data.user.id;
    setCurrentUserId(nextUserId);
    await refreshData(nextUserId);

    return result(true, 'Signed in.');
  }

  async function signOut(): Promise<ActionResult> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return result(false, error.message);
    }

    setCurrentUserId(null);
    clearUserData();
    return result(true, 'Signed out.');
  }

  async function deleteAccount(): Promise<ActionResult> {
    if (!currentUserId) {
      return result(false, 'Sign in first.');
    }

    await syncDailyReminderSchedule(false);

    const { error } = await supabase.rpc('delete_my_account');
    if (error) {
      const missingFunction = /delete_my_account/i.test(error.message)
        && /does not exist|not find/i.test(error.message);
      if (missingFunction) {
        return result(false, 'Delete account is not enabled yet. Run the latest Supabase migration first.');
      }
      return result(false, error.message);
    }

    await supabase.auth.signOut();
    setCurrentUserId(null);
    setDailyReminderEnabledState(false);
    clearUserData();

    return result(true, 'Your account has been deleted.');
  }

  async function rotateFriendCode(): Promise<ActionResult> {
    if (!currentUserId) {
      return result(false, 'Sign in to rotate your code.');
    }

    const { error } = await supabase.rpc('rotate_my_friend_code');

    if (error) {
      return result(false, error.message);
    }

    await refreshData(currentUserId);

    return result(true, 'Friend code rotated.');
  }

  async function sendFriendRequestByCode(rawCode: string): Promise<ActionResult> {
    if (!currentUserId) {
      return result(false, 'Sign in first.');
    }

    const normalized = normalizeCode(rawCode);
    if (normalized.length !== 6) {
      return result(false, 'Friend codes must be 6 digits.');
    }

    const { data: targetProfile, error: targetError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('friend_code', normalized)
      .maybeSingle();

    if (targetError) {
      return result(false, targetError.message);
    }

    if (!targetProfile) {
      return result(false, 'No user found with that code.');
    }

    if (targetProfile.id === currentUserId) {
      return result(false, 'That is your own code.');
    }

    const { lowId, highId } = getUserPair(currentUserId, targetProfile.id);

    const { data: existingFriendship, error: friendshipError } = await supabase
      .from('friendships')
      .select('id')
      .eq('user_low_id', lowId)
      .eq('user_high_id', highId)
      .maybeSingle();

    if (friendshipError) {
      return result(false, friendshipError.message);
    }

    if (existingFriendship) {
      return result(false, 'You are already linked as friends.');
    }

    const duplicateFilter = [
      `and(from_user_id.eq.${currentUserId},to_user_id.eq.${targetProfile.id})`,
      `and(from_user_id.eq.${targetProfile.id},to_user_id.eq.${currentUserId})`,
    ].join(',');

    const { data: duplicateRequest, error: duplicateError } = await supabase
      .from('friend_requests')
      .select('id')
      .eq('status', 'pending')
      .or(duplicateFilter)
      .maybeSingle();

    if (duplicateError) {
      return result(false, duplicateError.message);
    }

    if (duplicateRequest) {
      return result(false, 'A pending request already exists between you.');
    }

    const { error: insertError } = await supabase.from('friend_requests').insert({
      from_user_id: currentUserId,
      to_user_id: targetProfile.id,
      status: 'pending',
    });

    if (insertError) {
      return result(false, insertError.message);
    }

    await refreshData(currentUserId);

    return result(true, `Request sent to ${targetProfile.name}.`);
  }

  async function acceptFriendRequest(requestId: string): Promise<ActionResult> {
    if (!currentUserId) {
      return result(false, 'Sign in first.');
    }

    const { data: request, error: requestError } = await supabase
      .from('friend_requests')
      .select('id, from_user_id, to_user_id, status')
      .eq('id', requestId)
      .maybeSingle();

    if (requestError) {
      return result(false, requestError.message);
    }

    if (!request || request.status !== 'pending' || request.to_user_id !== currentUserId) {
      return result(false, 'Request is no longer available.');
    }

    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('to_user_id', currentUserId)
      .eq('status', 'pending');

    if (updateError) {
      return result(false, updateError.message);
    }

    const { lowId, highId } = getUserPair(request.from_user_id, request.to_user_id);
    const { error: upsertError } = await supabase.from('friendships').upsert(
      {
        user_low_id: lowId,
        user_high_id: highId,
      },
      {
        onConflict: 'user_low_id,user_high_id',
        ignoreDuplicates: true,
      },
    );

    if (upsertError) {
      return result(false, upsertError.message);
    }

    await refreshData(currentUserId);

    return result(true, 'Friend request accepted.');
  }

  async function declineFriendRequest(requestId: string): Promise<ActionResult> {
    if (!currentUserId) {
      return result(false, 'Sign in first.');
    }

    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'declined', responded_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('to_user_id', currentUserId)
      .eq('status', 'pending');

    if (error) {
      return result(false, error.message);
    }

    await refreshData(currentUserId);

    return result(true, 'Friend request declined.');
  }

  async function sendPoke(friendId: string, message?: string): Promise<ActionResult> {
    if (!currentUserId) {
      return result(false, 'Sign in first.');
    }

    if (!friends.some((friend) => friend.id === friendId)) {
      return result(false, 'You can only poke linked friends.');
    }

    const cleanMessage = message?.trim() ? message.trim() : DEFAULT_POKE_MESSAGE;

    const { error } = await supabase.from('pokes').insert({
      sender_user_id: currentUserId,
      recipient_user_id: friendId,
      message: cleanMessage,
      status: 'pending',
    });

    if (error) {
      return result(false, error.message);
    }

    await refreshData(currentUserId);
    return result(true, 'Poke sent.');
  }

  async function setDailyReminderEnabled(enabled: boolean): Promise<ActionResult> {
    const previous = dailyReminderEnabled;
    setDailyReminderEnabledState(enabled);

    const syncResult = await syncDailyReminderSchedule(enabled);
    if (!syncResult.ok) {
      setDailyReminderEnabledState(previous);
    }

    return syncResult;
  }

  async function setDarkModeEnabled(enabled: boolean): Promise<ActionResult> {
    setDarkModeEnabledState(enabled);
    await AsyncStorage.setItem(DARK_MODE_ENABLED_STORAGE_KEY, enabled ? 'true' : 'false');
    return result(true, enabled ? 'Dark mode enabled.' : 'Dark mode disabled.');
  }

  async function createTask(title: string, accountabilityFriendId?: string): Promise<ActionResult> {
    if (!currentUserId) {
      return result(false, 'Sign in first.');
    }

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      return result(false, 'Task title cannot be empty.');
    }

    const isValidFriend = accountabilityFriendId
      ? friends.some((friend) => friend.id === accountabilityFriendId)
      : false;

    const { error } = await supabase.from('tasks').insert({
      owner_id: currentUserId,
      title: cleanTitle,
      completed: false,
      week_start: weekStartDate,
      accountability_friend_id: isValidFriend ? accountabilityFriendId : null,
    });

    if (error) {
      return result(false, error.message);
    }

    await refreshData(currentUserId);

    return result(true, 'Task added for this week.');
  }

  async function toggleTask(taskId: string): Promise<ActionResult> {
    if (!currentUserId) {
      return result(false, 'Sign in first.');
    }

    const targetTask = currentWeekTasks.find((task) => task.id === taskId);
    if (!targetTask) {
      return result(false, 'Task not found.');
    }

    const { error } = await supabase
      .from('tasks')
      .update({ completed: !targetTask.completed })
      .eq('id', taskId)
      .eq('owner_id', currentUserId);

    if (error) {
      return result(false, error.message);
    }

    await refreshData(currentUserId);

    return result(true, 'Task updated.');
  }

  async function deleteTask(taskId: string): Promise<ActionResult> {
    if (!currentUserId) {
      return result(false, 'Sign in first.');
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('owner_id', currentUserId);

    if (error) {
      return result(false, error.message);
    }

    await refreshData(currentUserId);

    return result(true, 'Task deleted.');
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
    dailyReminderEnabled,
    darkModeEnabled,
    defaultPokeMessage: DEFAULT_POKE_MESSAGE,
    signUp,
    signIn,
    signOut,
    deleteAccount,
    rotateFriendCode,
    sendFriendRequestByCode,
    acceptFriendRequest,
    declineFriendRequest,
    sendPoke,
    respondToPoke,
    setDailyReminderEnabled,
    setDarkModeEnabled,
    createTask,
    toggleTask,
    deleteTask,
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
