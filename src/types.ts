export type FriendRequestStatus = 'pending' | 'accepted' | 'declined';
export type PokeStatus = 'pending' | 'on_it' | 'later';

export interface ActionResult {
  ok: boolean;
  message: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendRequestStatus;
  createdAt: string;
  respondedAt?: string | null;
}

export interface Friendship {
  id: string;
  userLowId: string;
  userHighId: string;
  createdAt: string;
}

export interface WeeklyTask {
  id: string;
  ownerId: string;
  title: string;
  completed: boolean;
  weekStartISO: string;
  accountabilityFriendId?: string;
  createdAt: string;
}

export interface WeeklyCheckIn {
  id: string;
  ownerId: string;
  weekStartISO: string;
  completedTaskIds: string[];
  missedTaskIds: string[];
  missedReason?: string | null;
  nextWeekFocus?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyCheckInView extends WeeklyCheckIn {
  ownerName: string;
}

export interface FriendRequestView {
  id: string;
  fromName: string;
  fromEmail: string;
  createdAt: string;
}

export interface OutgoingFriendRequestView {
  id: string;
  toName: string;
  toEmail: string;
  createdAt: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  friendCode: string;
}

export interface PokeView {
  id: string;
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  message: string;
  status: PokeStatus;
  createdAt: string;
  respondedAt?: string | null;
}
