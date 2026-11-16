# FINAL BASELINE AUDIT — ALBA (`AlarmyClone`)

**Audit Date:** November 16, 2026  
**Auditor:** Senior React Native Architect, Senior Android/Kotlin Engineer  
**Target Package:** `com.alarmyclone` / App: `Alba`  
**Baseline State:** TypeScript clean (0 errors), Jest test suite passing (26/26 passed), Metro bundle successful.

---

## 1. COMPREHENSIVE ARCHITECTURAL ASSESSMENT

### 1.1 Presentation Layer (React Native 0.88.1 / React 19.3.0)
- **Navigation:** React Navigation 7 native-stack and bottom-tabs.
- **State Management:** Zustand 5.1.0 backed by MMKV (`react-native-mmkv` 4.3.2) for fast synchronous KV persistence.
- **Style System:** NativeWind v4 (Tailwind CSS) with custom theme support in `themeStore.ts`.

### 1.2 Android Native Layer (Kotlin, Android SDK 34)
- **Alarm Scheduling:** Uses `AlarmManager.setAlarmClock()`, which bypasses Android deep Doze mode and App Standby Buckets.
- **Foreground Service:** `AlarmService.kt` runs as `mediaPlayback` with `MediaPlayer` routed to `AudioAttributes.USAGE_ALARM` with crescendo volume ramping.
- **WakeLock Management:** `AlarmReceiver.kt` acquires a partial wake lock with a 3-minute timeout.
- **Persistence:** Direct SQLite helper `AlarmDatabase.kt` storing JSON payloads in `alba_alarms.db`.
- **Boot Recovery:** `BootReceiver.kt` reschedules enabled alarms on `BOOT_COMPLETED`, `MY_PACKAGE_REPLACED`, `TIME_SET`, `TIMEZONE_CHANGED`.
- **Camera & Vision:** Google MLKit Barcode Scanning & Pose Detection in `CameraMissionActivity.kt`. Perceptual hash image similarity in `PhotoMatcher.kt`.
- **Sensors:** Hardware step counting in `StepCounter.kt` and accelerometer shake detection in `ShakeDetector.kt`.
- **Ambient Sleep Audio:** `SleepMusicManager.kt` playing bundled raw MP3s in background with auto-off sleep timer.

---

## 2. VERIFIED DEFECT REGISTER & BASELINE DEFICIENCIES

| Defect ID | Severity | Component | Root Cause & Evidence | Proposed Resolution |
|---|---|---|---|---|
| **DEF-01** | **CRITICAL** | Snooze Dismissal | `SnoozeCountdownScreen.tsx:79` calls `NativeAlarm.cancelAlarm(alarmId)`, which invokes `AlarmStorage.removeAlarm()`, permanently deleting repeating alarms from SQLite. | Add `NativeAlarm.dismissSnooze(alarmId)`: resets snooze and reschedules next occurrence for repeating alarms; toggles `enabled = false` for one-time alarms without deletion. |
| **DEF-02** | **CRITICAL** | Native Persistence | `AlarmModule.kt:107-124` & `AlarmModel.kt` drop mission configuration targets (`stepTarget`, `squatTarget`, `shakeTarget`, `photoReferencePath`, `barcodeValue`, `wallpaper`, etc.). SQLite loses these fields on reboot. | Expand `AlarmModel.kt` to serialize all mission targets into the SQLite JSON payload; update `scheduleAlarm` in `AlarmModule.kt`. |
| **DEF-03** | **CRITICAL** | Photo Mission Trapping | `AlarmEditScreen.tsx:434` allows saving Photo mission without reference photo. `PhotoMissionScreen.tsx:95` rejects captures if reference is missing, trapping user during alarm. | Enforce mandatory reference photo capture in `AlarmEditScreen.tsx` before allowing save. In `PhotoMissionScreen.tsx`, provide fallback guidance instead of locking. |
| **DEF-04** | **CRITICAL** | Barcode Scanner Disconnect | `BarcodeMissionScreen.tsx:167-177` embeds mock component `CameraScanner.tsx` (laser animation + test button) instead of calling `CameraMissionActivity.kt` native MLKit scanner. | Wire `BarcodeMissionScreen.tsx` and `AlarmEditScreen.tsx` to `NativeAlarm.openCameraMission({ mode: 'barcode' })` using real CameraX MLKit. |
| **DEF-05** | **HIGH** | Storage Hydration Deficit | `alarmStore.ts:122-137` only maps over existing `s.alarms`. If MMKV is wiped, SQLite contains alarms but UI shows empty list because `listAlarms()` only returned 5 properties. | Expand `listAlarms()` in `AlarmModule.kt` to return full alarm models, and update `syncFromNative()` in `alarmStore.ts` to hydrate MMKV directly from SQLite when empty. |
| **DEF-06** | **HIGH** | Cold-Start Snooze Intent Loss | `MainActivity.kt:51-63` fires `sendEvent("onOpenSnooze")` in `onCreate()` before React Native JS engine has mounted `App.tsx`. The event is dropped. | Cache initial snooze intent in `MainActivity.companion` and expose `NativeAlarm.getInitialSnoozeIntent()` for `App.tsx` to query upon mount. |
| **DEF-07** | **HIGH** | Mission Setup Gaps | `AlarmEditScreen.tsx` has no configuration for Math problem count/difficulty, Memory pairs, or Typing phrases. | Implement dedicated sub-configuration modals in `AlarmEditScreen.tsx` for Math, Memory, and Typing missions. |
| **DEF-08** | **HIGH** | Unsaved Changes in Edit | `AlarmEditScreen.tsx:496` exits immediately on back press without checking if user modified time, label, sound, or missions. | Implement dirty state tracking and prompt "Discard Unsaved Changes?" confirmation dialog. |
| **DEF-09** | **MEDIUM** | WakeLock Concurrency | `AlarmReceiver.kt:16` holds a single static `wakeLock` variable. Overwritten if multiple alarms fire concurrently. | Use synchronized token map or unique wake locks per alarm trigger. |
| **DEF-10** | **MEDIUM** | Squat Framing & Bypass | `CameraMissionActivity.kt:206` has a `⚡ +1 Squat (Test)` button baked into production view and lacks full-body distance feedback. | Remove developer test bypass buttons from production views; improve pose landmarker framing feedback. |
| **DEF-11** | **MEDIUM** | Sub-step Progress Loss | `ShakeMissionScreen.tsx`, `StepMissionScreen.tsx`, etc., store progress in component `useState`. Interruption resets progress to 0. | Persist sub-step progress in `activeMissionStore.ts` so interrupted missions resume at exact step count. |
| **DEF-12** | **MEDIUM** | Missing Back on Report | `ReportScreen.tsx` lacks an on-screen back button when opened from `MorningScreen.tsx:37`. | Add an on-screen back navigation arrow to `ReportScreen.tsx`. |
| **DEF-13** | **MEDIUM** | Preflight Permissions | `PermissionScreen.tsx` during onboarding does not request `CAMERA` or `ACTIVITY_RECOGNITION`, surprising users during active alarm. | Add clear explanations and preflight permission requests in onboarding and alarm edit. |

---

## 3. VERIFIED CORRECTED FINDINGS (NON-ISSUES)
1. **SleepScreen Fake Snore Detection:**  
   Code verification confirmed `SleepScreen.tsx` does NOT advertise snore detection and contains no fake snore code. It is an honest, working ambient audio player backed by `SleepMusicManager.kt`.
2. **Missing Target Selectors for Sensor Missions:**  
   `AlarmEditScreen.tsx:1093-1160` already contains inline selectors for `stepTarget`, `squatTarget`, and `shakeTarget`. These are functional in JS but were lost in native SQLite serialization.

---

## 4. BASELINE TEST STATUS
- `tsc --noEmit`: 0 errors
- `jest`: 26 passed, 6 suites
- `metro bundle`: exit code 0
