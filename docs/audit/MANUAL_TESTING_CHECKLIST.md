# ALBA (ALARMYCLONE) — MANUAL TESTING CHECKLIST & QA TEST SCRIPT

**Author**: Senior Mobile QA Automation Engineer  
**Date**: November 16, 2026  
**Target Devices**: Physical Android Device (API 29–35) & Android Virtual Device (AVD)  

---

## 1. Preflight Environment Setup

- [ ] Android OS Version: Android 10 (API 29) to Android 15 (API 35).
- [ ] Device connected via USB (`adb devices`) or running in Android Studio emulator.
- [ ] Battery Optimization disabled for Alba:
  ```bash
  adb shell dumpsys deviceidle whitelist +com.alarmyclone
  ```
- [ ] Notification and Exact Alarm permissions granted:
  ```bash
  adb shell pm grant com.alarmyclone android.permission.POST_NOTIFICATIONS
  adb shell pm grant com.alarmyclone android.permission.CAMERA
  adb shell pm grant com.alarmyclone android.permission.ACTIVITY_RECOGNITION
  ```

---

## 2. Test Case 1: Alarm Creation, Mission Setup & Unsaved Changes Guard

### Objective:
Verify that all mission configurations and targets persist properly and unsaved changes cannot be accidentally discarded.

1. **Launch App**: Open Alba on home screen.
2. **Add New Alarm**: Tap the `+` button on the bottom bar.
3. **Configure Missions**:
   - Tap `Wake-up mission (0/5)`.
   - Add **Math Mission** (select 3 problems, Hard difficulty).
   - Add **Shake Mission** (select 10 shakes).
   - Add **QR / Barcode Mission**:
     - Tap `Open Camera Scanner` and scan a physical barcode (e.g. book or bottle), or type a manual code `12345678`.
     - Verify green confirmation: `✓ Registered code: 12345678`.
   - Add **Photo Mission**:
     - Tap `Take Reference Photo`.
     - Capture a clear shot of your desk/keyboard.
     - Verify green confirmation: `✓ Registered: reference_....jpg`.
4. **Test Discard Guard**:
   - Press Android Hardware Back button.
   - **Expected Result**: A modal appears stating: *"Discard changes? You have unsaved changes. Are you sure you want to discard them and go back?"*
   - Tap `Keep Editing`. Edit screen remains open with all draft changes intact.
5. **Save Alarm**:
   - Set time 2 minutes ahead of current time.
   - Select repeat: Monday through Friday.
   - Tap `Save`.
   - **Expected Result**: Toast shows *"Alarm Scheduled! ⏰"*, alarm appears in list with correct badges.

---

## 3. Test Case 2: Ringing, Full-Screen Overlay & Snooze Dismissal Safety

### Objective:
Verify that snooze dismissal on a repeating alarm never deletes the alarm from the schedule.

1. **Lock Screen**: Lock the phone screen and wait for the alarm time.
2. **Overlay Verification**:
   - **Expected Result**: Phone wakes up, full-screen alarm ringing screen appears over lock screen with background media and audio playing.
3. **Trigger Snooze**:
   - Tap `Snooze` (5 minutes).
   - Phone stops ringing; persistent notification appears: *"Alba is snoozing (Next: XX:XX)"*.
4. **Cold Start via Notification**:
   - Swipe Alba away from Android Recent Apps (kill process).
   - Pull down notification drawer and tap the snooze notification.
   - **Expected Result**: App cold-starts directly into `SnoozeCountdownScreen` showing live countdown timer.
5. **Dismiss Snooze**:
   - Tap `Dismiss Snooze`.
   - **Expected Result**: Snooze notification is dismissed. Alarm remains **ENABLED** in the alarm list with next scheduled occurrence for the next active repeating day.
   - Query SQLite to confirm record is preserved:
     ```bash
     adb shell "run-as com.alarmyclone sqlite3 databases/alarms.db 'SELECT id, enabled, repeatDays FROM alarms;'"
     ```

---

## 4. Test Case 3: Chained Multi-Mission Sequence & Progress Recovery

### Objective:
Verify that multi-mission sequences progress sequentially and retain sub-progress across app interruptions.

1. **Trigger Alarm**: Set an alarm with chained missions: [Math, Shake].
2. **Mission 1 (Math)**:
   - Solve problem 1 of 3.
   - Solve problem 2 of 3.
   - Force close the app (`adb shell am force-stop com.alarmyclone`).
3. **Progress Resumption**:
   - Alarm service automatically restores / user taps ringing notification.
   - **Expected Result**: App opens Math Mission with progress restored to Problem 3 of 3 (not problem 1).
4. **Solve Final Math Problem**:
   - Correct answer automatically transitions to **Mission 2 (Shake)**.
5. **Mission 2 (Shake)**:
   - Shake the phone 6 times out of 10.
   - Lock screen and unlock.
   - Shakes left shows 4 (6 shakes preserved in `useActiveMissionStore`).
   - Shake 4 more times until counter reaches 0.
6. **Completion**:
   - Mission Complete modal appears: *"Awake and Energized! ⚡"*.
   - Tap `Start My Day`.
   - Alarm stops permanently, wake-up is recorded in `ReportScreen`.

---

## 5. Test Case 4: Hardware Sensors & MLKit Camera Scanning

### Objective:
Verify that real hardware sensors and MLKit detectors function without mock stubs.

1. **Step Mission**:
   - Hold physical phone and walk 5 paces.
   - Step counter increments from 0 to 5 via native Android StepDetector/Accelerometer.
2. **Barcode Mission**:
   - Point camera at the registered barcode.
   - CameraMissionActivity detects barcode via MLKit BarcodeScanning, auto-submits, and dismisses alarm.
3. **Photo Mission**:
   - Point camera at registered desk/sink.
   - PhotoMatcher computes histogram/feature similarity score.
   - If score >= 72%, alarm dismisses with success.

---

## 6. Test Case 5: System Reboot Recovery (`BOOT_COMPLETED`)

### Objective:
Verify alarms reschedule across full device reboot.

1. Have 2 repeating alarms enabled in Alba.
2. Reboot the device:
   ```bash
   adb reboot
   ```
3. After device boots, inspect logcat:
   ```bash
   adb logcat -s BootReceiver AlarmScheduler
   ```
4. **Expected Result**:
   `BootReceiver: Rescheduled 2 active alarms after boot.`
5. Confirm via AlarmManager dumpsys:
   ```bash
   adb shell dumpsys alarm | grep com.alarmyclone
   ```

