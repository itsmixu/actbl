# actbl

A simple accountability app for weekly tasks, friend check-ins, and consistent follow-through.

## Stack

![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)

[![Powered by Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)

## What This App Does

- Create an account and sign in.
- Link friends using a code or QR invite.
- Add weekly accountability tasks.
- Send and respond to friend pokes.
- Receive optional daily reminder notifications.

## Project Status

This is an active draft project.

- UI and feature set are still evolving.
- README content is intentionally simple and easy to edit.

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env` file with your Supabase values:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

### 3. Run the app

```bash
npm run android
```

This starts Expo without forcing an emulator, so you can open it on your phone.

If you do want the emulator:

```bash
npm run android:emulator
```

## Database Migrations

Current SQL migrations live in `supabase/migrations/`.

Run them in your Supabase SQL editor in order.

## Notes

- Delete account requires the latest delete-account migration.
- Notification and poke flows rely on Supabase schema + policies.

## License

TBD
# ACTBL MVP Base

A minimal React Native (Expo) base for an accountability app:
- Account creation and login
- Friend linking via 6-digit code or QR code
- Approval-based friend requests
- Manual weekly tasks with optional accountability friend

## Tech
- React Native + Expo + TypeScript
- React Navigation
- Supabase client support (optional)
- Local demo fallback mode via AsyncStorage

## Run
1. Install dependencies:
   npm install
2. Optional: configure Supabase keys:
   cp .env.example .env
   Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
3. Start app:
   npm run start
4. Launch iOS/Android from Expo CLI.

## Notes
- If Supabase env vars are missing, the app runs in local demo mode and stores data on-device.
- Friend-linking in this base is local data logic for rapid MVP iteration; move to backend tables and RLS for production.
