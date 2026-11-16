# ALBA (ALARMYCLONE) — FINAL BUG RESOLUTION REPORT

**Author**: Software Quality Assurance & Systems Engineering Team  
**Date**: November 16, 2026  
**Status**: All Critical & Functional Bugs Resolved  

---

## Bug Matrix Summary

| Bug ID | Severity | Category | Description | Status | Verification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-01** | CRITICAL | Persistence | Mission configuration fields dropped across RN & Kotlin serialization | **RESOLVED** | Automated Test + Code Review |
| **BUG-02** | HIGH | Validation | Photo mission permitted saving alarm without reference photo | **RESOLVED** | Code Review + UI Guard |
| **BUG-03** | CRITICAL | Functional | Barcode mission used mock/stubbed camera scanner component | **RESOLVED** | Code Review + Native MLKit Integration |
| **BUG-04** | MEDIUM | Background | Sleep sound player race conditions during quick pause/play | **RESOLVED** | Code Review |
| **BUG-05** | CRITICAL | Core Alarm | Snooze dismissal permanently deleted repeating alarms from SQLite | **RESOLVED** | Automated Test (`snoozeAndPersistence.test.ts`) |
| **BUG-06** | HIGH | Storage | MMKV cache clear caused permanent loss of native SQLite alarms | **RESOLVED** | Automated Test (`snoozeAndPersistence.test.ts`) |
| **BUG-07** | HIGH | Permissions | Physical Activity permission missing from onboarding preflight | **RESOLVED** | Code Review (`PermissionScreen.tsx`) |
| **BUG-08** | MEDIUM | Integrity | Production camera overlay contained `+1 Squat (Test)` cheat button | **RESOLVED** | Code Review (`CameraMissionActivity.kt`) |
| **BUG-09** | HIGH | Power/Service | Single static `WakeLock` caused race conditions with overlapping alarms | **RESOLVED** | Code Review (`AlarmReceiver.kt`) |
| **BUG-10** | HIGH | Mission Engine| Multi-mission sequences reset to step 0 on notification re-entry | **RESOLVED** | Automated Test (`activeMissionPersistence.test.ts`) |
| **BUG-11** | HIGH | Navigation | Cold-start snooze notification tap dropped intent before JS mounted | **RESOLVED** | Code Review (`MainActivity.kt` & `AlarmModule.kt`) |
| **BUG-12** | MEDIUM | UX/Data Loss | Backing out of AlarmEditScreen discarded edits without confirmation | **RESOLVED** | Code Review (`AlarmEditScreen.tsx`) |
| **BUG-13** | LOW | Navigation | ReportScreen lacked on-screen back button when opened from MorningScreen | **RESOLVED** | Code Review (`ReportScreen.tsx`) |

---

## Detailed Bug Findings & Resolutions

### BUG-01: Mission Configuration Persistence Loss
- **Symptoms**: When an alarm with specific targets (e.g. 5 math problems, Hard difficulty, 8 memory pairs, 20 steps, 5 squats, 30 shakes) was saved, the alarm triggered with hardcoded defaults.
- **Root Cause**: `AlarmModel.kt` lacked JSON serialization and deserialization for mission-specific fields, and `AlarmModule.kt` did not serialize them when writing to SQLite.
- **Resolution**:
  - Added `photoReferencePath`, `photoMatchThreshold`, `barcodeValue`, `stepTarget`, `squatTarget`, `shakeTarget`, `wallpaper`, `mathCount`, `mathDifficulty`, `memoryPairs`, and `typingPhrase` to `AlarmModel.kt` `toJsonObject()` and `fromJsonObject()`.
  - Updated `AlarmModule.kt` `scheduleAlarm()` and `listAlarms()` to serialize/deserialize all parameters.
  - Added unit test in `__tests__/missionConfiguration.test.ts`.

### BUG-02: Photo Mission Allowed Saving Without Reference
- **Symptoms**: Users could select Photo mission and save an alarm without registering a photo, causing the ringing screen to either crash or trap the user with an unmatchable photo.
- **Root Cause**: `save()` in `AlarmEditScreen.tsx` lacked validation for required mission references.
- **Resolution**:
  - Added pre-save validation guard blocking alarm save if `missions.includes('photo')` and `!photoReferencePath`.
  - Added emergency fallback button in `PhotoMissionScreen.tsx` to handle corrupt or deleted files safely.

### BUG-03: Barcode Mission Relied on Mock Scanner
- **Symptoms**: Barcode mission rendered a mock component `<CodeScanner>` that did not connect to physical camera hardware.
- **Root Cause**: `vision-camera` had been uninstalled or stubbed, and `BarcodeMissionScreen` was never hooked up to the working MLKit barcode engine inside `CameraMissionActivity.kt`.
- **Resolution**:
  - Replaced `<CodeScanner>` with `NativeAlarm.openCameraMission({ mode: 'barcode' })`, which opens `CameraMissionActivity` and detects physical barcodes via Google ML Kit `BarcodeScanning.getClient()`.
  - Added manual barcode entry and validation matching against `registeredCode`.

### BUG-05: Snooze Dismissal Permanently Deleted Repeating Alarms
- **Symptoms**: When an alarm rang, user tapped Snooze, and subsequently tapped "Dismiss Snooze", the alarm was permanently purged from the database, disappearing forever.
- **Root Cause**: Both `SnoozeCountdownScreen` and `AlarmActionReceiver` called `AlarmScheduler.cancel()`, which executed `DELETE FROM alarms WHERE id = ?`.
- **Resolution**:
  - Implemented `AlarmScheduler.dismissSnooze()` in Kotlin:
    - For repeating alarms: calculates next active day and schedules standard `AlarmManager.setAlarmClock()`, canceling the snooze alarm notification while leaving repeating alarm intact.
    - For one-time alarms: marks `enabled = false` in SQLite without deleting the record.
  - Implemented `NativeAlarm.dismissSnooze()` and `useAlarmStore.dismissSnooze(id)`.
  - Verified with automated test in `__tests__/snoozeAndPersistence.test.ts`.

### BUG-06: MMKV / SQLite Desynchronization
- **Symptoms**: If MMKV was cleared (e.g. storage cleanup, app update, cache reset), all saved alarms disappeared from the React Native UI even though SQLite still contained them.
- **Root Cause**: `useAlarmStore` only read from MMKV on startup and never queried native SQLite.
- **Resolution**:
  - Enhanced `syncFromNative()` in `alarmStore.ts` to call `NativeAlarm.listAlarms()` and populate MMKV whenever MMKV is empty.
  - Verified with automated test in `__tests__/snoozeAndPersistence.test.ts`.

### BUG-07: Missing Physical Activity Permission Preflight
- **Symptoms**: Step mission failed on Android 10+ (API 29+) because `ACTIVITY_RECOGNITION` permission was never requested during onboarding.
- **Root Cause**: `PermissionScreen.tsx` only requested exact alarms, notifications, battery optimization, and overlay.
- **Resolution**:
  - Added Camera Access and Physical Activity permission checks and request cards in `PermissionScreen.tsx`.

### BUG-08: Cheat Test Buttons in Production Camera Overlays
- **Symptoms**: User could skip morning squats by tapping `⚡ +1 Squat (Test)` directly inside the camera overlay.
- **Root Cause**: Development debug button was left in `CameraMissionActivity.kt`.
- **Resolution**:
  - Removed `testButton` from `CameraMissionActivity.kt` `bindSquat()`.
  - Removed fake simulator test buttons from `ShakeMissionScreen.tsx`, `StepMissionScreen.tsx`, and `SquatMissionScreen.tsx`.

### BUG-09: Single Static WakeLock Race Condition
- **Symptoms**: If multiple alarms rang close together or snooze triggered during an active alarm, releasing the single static `wakeLock` released the wake lock for both alarms, allowing the CPU to sleep.
- **Root Cause**: `AlarmReceiver.kt` held a single nullable static `WakeLock` instance.
- **Resolution**:
  - Replaced with thread-safe `ConcurrentHashMap<String, PowerManager.WakeLock>` keyed by `alarmId`.
  - Each alarm acquires and manages its own reference-counted wake lock with a 10-minute maximum timeout.

### BUG-10: Chained Mission Progress Lost on Interruption
- **Symptoms**: If an alarm configured with 3 missions ([Math, Shake, Squat]) finished mission 1 and the user minimized or tapped the notification banner, the sequence reset back to Math.
- **Root Cause**: Mission index was passed strictly via in-memory React Navigation route params without persistent disk tracking.
- **Resolution**:
  - Implemented `useActiveMissionStore` in `activeMissionStore.ts` backed by MMKV.
  - Automatically records completed missions, preserves current mission index, and saves intra-mission sub-progress (e.g. squats done, shakes done).
  - Verified with automated test suite in `__tests__/activeMissionPersistence.test.ts`.

### BUG-11: Cold-Start Snooze Intent Dropped
- **Symptoms**: When tapping the "Alba is Snoozing" notification while the app was killed, the app opened to the home screen instead of the SnoozeCountdownScreen.
- **Root Cause**: React Native bridge was not yet registered when Android's `onCreate()` / `onNewIntent()` fired.
- **Resolution**:
  - Cached `pendingSnoozeAlarmId` and `pendingSnoozeIntervalMin` in `MainActivity.kt`.
  - Added `NativeAlarm.getInitialSnoozeIntent()` consumed upon React Native mount in `App.tsx`.

### BUG-12: Unsaved Alarm Edits Discarded Without Warning
- **Symptoms**: Users spent time configuring an alarm and accidentally swiped or hit the back button; all edits were lost without warning.
- **Root Cause**: `AlarmEditScreen.tsx` lacked dirty state tracking and hardware back intercept.
- **Resolution**:
  - Added `isDirty` memo comparing current draft against initial state.
  - Added `CustomConfirmModal` prompting "Discard changes?" on hardware back or top "✕" press.

### BUG-13: ReportScreen Missing Back Button
- **Symptoms**: When opened from MorningScreen via "View Weekly Report", the user had no on-screen button to return.
- **Root Cause**: `ReportScreen.tsx` assumed it was only ever rendered in bottom tabs.
- **Resolution**:
  - Added `canGoBack && <TouchableOpacity onPress={goBack}>` at the top of `ReportScreen.tsx`.
