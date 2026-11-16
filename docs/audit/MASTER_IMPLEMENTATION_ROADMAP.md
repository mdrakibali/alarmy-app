# MASTER IMPLEMENTATION ROADMAP — ALBA (`AlarmyClone`)

**Status:** Autonomous Execution in Progress  
**Phases Covered:** Phase 1 through Phase 12

---

## EXECUTION SCHEDULE & WORK PACKAGES

### 🟢 Phase 1: Alarm Reliability & Persistence
- **Package 1.1:** Add `NativeAlarm.dismissSnooze(alarmId)` in Kotlin and React Native.
- **Package 1.2:** Update `SnoozeCountdownScreen.tsx` to call `dismissSnooze()` instead of destructive `cancelAlarm()`.
- **Package 1.3:** Expand native `AlarmModel.kt` with all mission target fields (`photoReferencePath`, `barcodeValue`, `stepTarget`, `squatTarget`, `shakeTarget`, `wallpaper`, `mathCount`, `mathDifficulty`, `memoryPairs`, `typingPhrase`, `photoMatchThreshold`).
- **Package 1.4:** Expand `scheduleAlarm()` and `listAlarms()` in `AlarmModule.kt` to serialize/deserialize all fields.
- **Package 1.5:** Update `syncFromNative()` in `alarmStore.ts` to hydrate MMKV directly from SQLite when MMKV is empty.
- **Package 1.6:** Implement initial intent caching in `MainActivity.kt` and `getInitialSnoozeIntent()` in `AlarmModule.kt` / `App.tsx`.
- **Package 1.7:** Concurrency-safe WakeLock management in `AlarmReceiver.kt`.

### 🟢 Phase 2: Alarm Creation, Editing & Configuration
- **Package 2.1:** Add Math configuration modal (question count: 1, 2, 3, 5; difficulty: Easy, Normal, Hard).
- **Package 2.2:** Add Memory configuration modal (pair count: 3, 4, 6).
- **Package 2.3:** Add Typing configuration modal (phrase picker / difficulty).
- **Package 2.4:** Photo reference registration flow with mandatory photo check before saving.
- **Package 2.5:** Barcode registration flow with real camera scanner.
- **Package 2.6:** Unsaved changes detection and discard confirmation dialog on back press.

### 🟢 Phase 3: Camera, Photo & Barcode Missions
- **Package 3.1:** Connect `BarcodeMissionScreen.tsx` to native `CameraMissionActivity.kt` (`mode: 'barcode'`) using real Google MLKit scanning.
- **Package 3.2:** Connect barcode registration in `AlarmEditScreen.tsx` to real native camera scanner.
- **Package 3.3:** Photo mission comparison stability and fallback guidance if reference photo is missing.
- **Package 3.4:** Remove production test bypass buttons (`⚡ +1 Squat (Test)`) from production camera overlays.
- **Package 3.5:** Improve squat framing guides in `CameraMissionActivity.kt`.

### 🟢 Phase 4: Sensor Missions
- **Package 4.1:** Verify `StepMissionScreen.tsx` Activity Recognition permission and hardware step counting.
- **Package 4.2:** Remove test bypass button (`⚡ +1 Step (Quick Test)`) from normal production flow (keep sensor failure fallback graceful).
- **Package 4.3:** Shake mission threshold optimization and sensor debounce.

### 🟢 Phase 5: Mission Engine & Fine-Grained Progress Recovery
- **Package 5.1:** Expand `activeMissionStore.ts` with sub-step progress persistence (`currentSubProgress`).
- **Package 5.2:** Persist step count, shake count, squat count, and solved math problems across app interruptions.
- **Package 5.3:** Validate multi-mission chained progression (no duplicate advancement, no skipped missions).

### 🟢 Phase 6: Permissions & Onboarding
- **Package 6.1:** Add Camera and Activity Recognition preflight explanation and request options in `PermissionScreen.tsx`.
- **Package 6.2:** Preflight permission check in `AlarmEditScreen.tsx` when adding Camera or Step missions.

### 🟢 Phase 7: Alarm Ringing, Snooze & Lifecycle Polish
- **Package 7.1:** Validate next occurrence calculation for repeating alarms across all 7 days.
- **Package 7.2:** Validate one-time alarm disabled transition upon dismissal.
- **Package 7.3:** Verify foreground service stop, audio silence, and notification dismissal.

### 🟢 Phase 8: Navigation & UI/UX Bug Fixes
- **Package 8.1:** Add on-screen Back button to `ReportScreen.tsx` when navigated from `MorningScreen.tsx`.
- **Package 8.2:** Fix Barcode mission manual input to provide clear user feedback.
- **Package 8.3:** Verify all buttons, modals, and screen transitions.

### 🟢 Phase 9: Sleep & Relax Ambient Audio
- **Package 9.1:** Verify background playback, categories, volume, and sleep timer in `SleepScreen.tsx`.
- **Package 9.2:** Ensure no audio conflict with alarm playback.

### 🟢 Phase 10: Performance, Security & Cleanups
- **Package 10.1:** Clean up unused imports, dead references, and test bypasses.
- **Package 10.2:** Verify memory management, event listener cleanups, and sensor unsubscribes.

### 🟢 Phase 11: Complete Automated QA
- **Package 11.1:** TypeScript compiler validation (`tsc --noEmit`).
- **Package 11.2:** Jest unit tests expansion and execution.
- **Package 11.3:** ESLint check.
- **Package 11.4:** Metro bundle verification.

### 🟢 Phase 12: Final Release Documentation & Verification Report
- **Package 12.1:** Create `docs/audit/FINAL_IMPLEMENTATION_REPORT.md`.
- **Package 12.2:** Create `docs/audit/FINAL_BUG_REPORT.md`.
- **Package 12.3:** Create `docs/audit/MANUAL_TESTING_CHECKLIST.md`.
- **Package 12.4:** Create `docs/audit/KNOWN_ANDROID_LIMITATIONS.md`.
- **Package 12.5:** Create `docs/audit/REMAINING_ISSUES.md`.
