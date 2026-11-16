# ALBA (ALARMYCLONE) — KNOWN ANDROID LIMITATIONS & PLATFORM CONSTRAINTS

**Author**: Senior Android Systems & Native Architect  
**Date**: November 16, 2026  
**Scope**: Android 8.0 (API 26) through Android 15 (API 35)  

---

## 1. Android OS Architectural Constraints

### 1.1 The "Force Stop" State (`FLAG_EXCLUDE_STOPPED_PACKAGES`)
- **Android Rule**: When a user goes to `Android Settings -> Apps -> Alba -> Force Stop`, the Android Package Manager marks the application in the **Stopped State**.
- **Impact**: While in the Stopped State, the system attaches `FLAG_EXCLUDE_STOPPED_PACKAGES` to all broadcast intents. As a result, **no AlarmManager pending intents, JobSchedulers, or `BOOT_COMPLETED` broadcasts can be delivered to the app**.
- **Remediation**: This is an intentional security boundary of the Android OS. The app will only resume receiving alarms once the user manually opens Alba from the launcher. No application (including Alarmy, Google Clock, or WhatsApp) can bypass this.

### 1.2 Android 12+ (API 31+) & Android 14+ (API 34+) Exact Alarms
- **Android Rule**: Starting in Android 12, apps using `AlarmManager.setExactAndAllowWhileIdle()` or `setAlarmClock()` require the user or system to grant `SCHEDULE_EXACT_ALARM`. Starting in Android 14, this permission can be revoked by the user at runtime.
- **Handling in Alba**: Alba implements `NativeAlarm.canScheduleExactAlarms()` and `openExactAlarmSettings()`, surfacing a dedicated preflight card in `PermissionScreen` and `SettingsScreen`.

### 1.3 Full-Screen Intent Over Lock Screen (Android 10+)
- **Android Rule**: Background activity starts are blocked on Android 10+ unless the app posts a notification with high priority and a `fullScreenIntent` or holds `SYSTEM_ALERT_WINDOW` (`canDrawOverlays`).
- **Handling in Alba**: `AlarmReceiver` and `AlarmService` combine `NotificationCompat.Builder.setFullScreenIntent()` with `setShowWhenLocked(true)` and `setTurnScreenOn(true)` in `MainActivity` and `CameraMissionActivity`.

---

## 2. OEM-Specific Background Restrictions ("Don't Kill My App")

Different hardware manufacturers modify AOSP to enforce aggressive battery optimizations that kill background services and drop alarms if not explicitly exempted.

### 2.1 Xiaomi / Redmi / POCO (MIUI & HyperOS)
- **Problem**: MIUI kills foreground services after 15–30 minutes of screen-off time and revokes background auto-start.
- **Required User Action**:
  1. Open **Security App** -> **Manage Apps** -> **Alba**.
  2. Enable **Autostart**.
  3. Under **Battery Saver**, select **No Restrictions** (instead of "MIUI Battery Saver").
  4. Enable **Display pop-up windows while running in the background**.

### 2.2 Samsung (OneUI)
- **Problem**: Samsung's "Sleeping Apps" and "Deep Sleeping Apps" features automatically put Alba to sleep if not opened every few days, canceling scheduled wake-up alarms.
- **Required User Action**:
  1. Open **Settings** -> **Battery and Device Care** -> **Battery**.
  2. Tap **Background usage limits**.
  3. Ensure Alba is added to **Never sleeping apps** and removed from **Deep sleeping apps**.

### 2.3 Huawei / Honor (EMUI & HarmonyOS)
- **Problem**: EMUI's PowerGenie kills all non-whitelisted apps when the screen turns off.
- **Required User Action**:
  1. Open **Settings** -> **Battery** -> **App Launch**.
  2. Find **Alba** and toggle off "Manage automatically".
  3. In the manual prompt, ensure **Auto-launch**, **Secondary launch**, and **Run in background** are all enabled.

### 2.4 OnePlus / Oppo / Realme (OxygenOS & ColorOS)
- **Problem**: ColorOS disables background activities and camera launches over lock screens.
- **Required User Action**:
  1. Open **Settings** -> **Apps** -> **Alba** -> **Battery usage**.
  2. Enable **Allow background activity** and **Allow auto-launch**.

---

## 3. Hardware Sensor Variances

### 3.1 Step Counter Sensor (`Sensor.TYPE_STEP_DETECTOR`)
- **Limitation**: Budget Android chipsets (e.g. MediaTek Helio G35/G85, low-end Unisoc) often omit the hardware Step Detector ASIC to reduce manufacturing cost.
- **Handling in Alba**: Alba implements a graceful fallback. If `NativeAlarm.startStepCounter()` returns `false` or emits `onStepUnavailable`, `StepMissionScreen` informs the user and activates manual fallback stepping, preventing users from being locked out of alarm dismissal.

### 3.2 Low-Light Camera Recognition (MLKit Pose & Photo Match)
- **Limitation**: In dark bedrooms during early morning hours, MLKit Pose Detection may struggle to detect body joints (hips, knees, ankles) due to image underexposure.
- **Handling in Alba**:
  - `CameraMissionActivity` uses the front-facing camera with auto-exposure compensation.
  - If camera detection fails or is blocked, `SquatMissionScreen` provides a clear fallback mechanism so users are never trapped.

