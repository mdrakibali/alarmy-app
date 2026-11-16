# ALBA — REMAINING ISSUES & HARDWARE VERIFICATION ROADMAP

**Author**: Senior Software Systems Auditor & Quality Assurance Specialist  
**Date**: November 16, 2026  
**Status**: Core Engineering Complete • Hardware Verification Ready  

---

## 1. Feature State Categorization Matrix

| Feature / Subsystem | Implementation State | Automated Test State | Static Verification | Hardware Verification Needed |
| :--- | :--- | :--- | :--- | :--- |
| **Alarm Create / Edit** | IMPLEMENTED | AUTOMATED TEST VERIFIED | STATICALLY VERIFIED | Emulator / Physical Device |
| **Snooze Dismissal (Repeating)** | IMPLEMENTED | AUTOMATED TEST VERIFIED | STATICALLY VERIFIED | Physical Device Wall-Clock Run |
| **Snooze Dismissal (One-Time)** | IMPLEMENTED | AUTOMATED TEST VERIFIED | STATICALLY VERIFIED | Physical Device Wall-Clock Run |
| **SQLite / MMKV Hydration** | IMPLEMENTED | AUTOMATED TEST VERIFIED | STATICALLY VERIFIED | Storage Wipe Simulation |
| **Multi-Mission Chaining** | IMPLEMENTED | AUTOMATED TEST VERIFIED | STATICALLY VERIFIED | Physical Device Multi-Step Flow |
| **Sub-Step Progress Persistence**| IMPLEMENTED | AUTOMATED TEST VERIFIED | STATICALLY VERIFIED | Physical Task Interruption Run |
| **Math Mission (Multi-Difficulty)**| IMPLEMENTED | AUTOMATED TEST VERIFIED | STATICALLY VERIFIED | UI Interaction |
| **Memory Mission (Pairs)** | IMPLEMENTED | AUTOMATED TEST VERIFIED | STATICALLY VERIFIED | UI Interaction |
| **Typing Mission (Affirmations)**| IMPLEMENTED | AUTOMATED TEST VERIFIED | STATICALLY VERIFIED | Virtual & Physical Keyboard |
| **Shake Mission (Accelerometer)** | IMPLEMENTED | AUTOMATED TEST VERIFIED | STATICALLY VERIFIED | **Physical Device Sensor Only** |
| **Step Mission (Hardware ASIC)** | IMPLEMENTED | AUTOMATED TEST VERIFIED | STATICALLY VERIFIED | **Physical Device Sensor Only** |
| **Squat Mission (MLKit Camera)** | IMPLEMENTED | AUTOMATED TEST VERIFIED | STATICALLY VERIFIED | **Physical Camera & Lighting** |
| **Barcode Mission (MLKit Scanner)**| IMPLEMENTED | AUTOMATED TEST VERIFIED | STATICALLY VERIFIED | **Physical Camera & Barcode** |
| **Photo Matcher Mission** | IMPLEMENTED | AUTOMATED TEST VERIFIED | STATICALLY VERIFIED | **Physical Camera & Room Lighting** |
| **Reboot Rescheduling (`BOOT`)** | IMPLEMENTED | STATICALLY VERIFIED | STATICALLY VERIFIED | **Physical Device Reboot** |

---

## 2. Items Requiring Physical Hardware & Real Device Environment

While all code is fully implemented and passes static analysis, typechecking, and unit tests, the following real-world behaviors require a physical smartphone with real sensors and camera optics:

### 2.1 Accelerometer Sensitivity on Varying Hardware
- **Component**: `ShakeDetector.kt` & `ShakeMissionScreen.tsx`
- **Verification Needed**: Different Android hardware accelerometers report differing raw `m/s²` noise floors (e.g. Samsung Exynos vs Qualcomm Snapdragon vs MediaTek). Ensure the current shake acceleration threshold (approx. `12.5 m/s²`) registers natural human arm shakes comfortably without false positives or missed shakes.

### 2.2 Physical Walking Step Detector ASIC
- **Component**: `StepCounter.kt` & `StepMissionScreen.tsx`
- **Verification Needed**: Verify physical walking around a bedroom registers steps accurately using Android `Sensor.TYPE_STEP_DETECTOR`. On devices lacking this sensor (or in Android Studio emulator), verify that the amber fallback button automatically activates.

### 2.3 MLKit Pose Detection in Early Morning Low Light
- **Component**: `CameraMissionActivity.kt` (`bindSquat`)
- **Verification Needed**: When a user wakes up in a dim bedroom, test front-camera exposure to ensure MLKit Pose landmark confidence (hips, knees, ankles) remains >= 0.5. Verify that if lighting is too low or camera is obstructed, the manual squat count fallback provides a graceful exit.

### 2.4 Photo Similarity Under Differing Morning Illumination
- **Component**: `PhotoMatcher.kt` (`similarityPercent`)
- **Verification Needed**: When a reference photo is taken in daylight (e.g. bathroom sink), test matching in the early morning with artificial light. The recommended threshold in `AlarmEditScreen` is set to `72%` with options for `65%` (tolerant) and `85%` (strict).

---

## 3. Production Release & Play Store Deployment Prerequisites

The following items are outside the local git repository and belong to production app publishing:

1. **Google Play Store Signing Key**:
   - Generate release keystore (`upload-key.keystore`) and configure `signingConfigs.release` in `android/app/build.gradle`.
2. **Google Play Console Policy Declarations**:
   - Declare `USE_FULL_SCREEN_INTENT` under Google Play's full-screen notification policy (Alba qualifies under the Alarm/Timer core use case).
   - Declare `SCHEDULE_EXACT_ALARM` under Google Play's exact alarm permissions policy.
3. **Target SDK & Privacy Policy**:
   - Target SDK is set to API 34 (Android 14) / API 35 (Android 15 ready).
   - Ensure privacy policy URL is linked in store listing regarding local on-device camera processing (no user photos are transmitted off-device).

