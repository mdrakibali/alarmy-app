# MASTER TESTING MATRIX — ALBA (`Alba`)

**Status:** Testing Framework & Verification Protocol  
**Verification Methodologies:**
- `AUTO-TS`: TypeScript Static Analysis (`npm run typecheck`)
- `AUTO-JEST`: Jest Unit & Integration Test Suite (`npm test`)
- `AUTO-BUNDLE`: Metro Android Bundle Compilation
- `AUTO-LINT`: ESLint Static Analysis (`npm run lint`)
- `STATIC-CODE`: Meticulous Static Code Review
- `MANUAL-DEV`: Manual Verification Protocol on Physical Hardware

---

## 1. COMPREHENSIVE TEST REGISTER

| Test ID | Category | Target Component | Description & Expected Outcome | Method | Verification Status |
|---|---|---|---|---|---|
| **TST-01** | Snooze | `SnoozeCountdownScreen` & Native | Dismissing snooze stops audio, cancels snooze notification, and DOES NOT delete repeating alarms from SQLite. | `AUTO-JEST` & `STATIC-CODE` | Pending Phase 1 |
| **TST-02** | Snooze | `SnoozeCountdownScreen` & Native | Dismissing snooze on a one-time alarm toggles `enabled = false` in SQLite and MMKV without deleting the record. | `AUTO-JEST` & `STATIC-CODE` | Pending Phase 1 |
| **TST-03** | Persistence | `AlarmModel.kt` & SQLite | Serializing alarm with all mission targets (`stepTarget`, `squatTarget`, `shakeTarget`, `photoReferencePath`, `barcodeValue`, `wallpaper`) persists to SQLite and survives `BootReceiver` restore. | `AUTO-JEST` & `STATIC-CODE` | Pending Phase 1 |
| **TST-04** | Hydration | `alarmStore.ts` & `AlarmModule.kt` | When MMKV is cleared, `syncFromNative` queries SQLite and reconstructs all alarms in MMKV without loss of properties. | `AUTO-JEST` & `STATIC-CODE` | Pending Phase 1 |
| **TST-05** | Intent Routing | `MainActivity.kt` & `App.tsx` | Cold-starting app from snooze notification caches intent in native and routes directly to `SnoozeCountdownScreen`. | `STATIC-CODE` | Pending Phase 1 |
| **TST-06** | WakeLock | `AlarmReceiver.kt` | Multiple concurrent alarms acquire distinct wake locks without releasing each other prematurely. | `STATIC-CODE` | Pending Phase 1 |
| **TST-07** | Validation | `AlarmEditScreen.tsx` | Saving an alarm with Photo mission is blocked if no reference photo has been registered. | `AUTO-JEST` & `STATIC-CODE` | Pending Phase 2 |
| **TST-08** | Validation | `AlarmEditScreen.tsx` | Saving an alarm with Barcode mission is blocked if no barcode has been registered. | `AUTO-JEST` & `STATIC-CODE` | Pending Phase 2 |
| **TST-09** | Configuration | `AlarmEditScreen.tsx` | Math mission question count (1, 2, 3, 5) and difficulty (Easy, Normal, Hard) are configurable and saved. | `AUTO-JEST` & `STATIC-CODE` | Pending Phase 2 |
| **TST-10** | Configuration | `AlarmEditScreen.tsx` | Memory mission pair count (3, 4, 6) is configurable and saved. | `AUTO-JEST` & `STATIC-CODE` | Pending Phase 2 |
| **TST-11** | UX Protection | `AlarmEditScreen.tsx` | Tapping back arrow or hardware back on a dirty alarm edit triggers discard confirmation alert. | `STATIC-CODE` | Pending Phase 2 |
| **TST-12** | Camera/Vision | `BarcodeMissionScreen.tsx` | Barcode scanning triggers real CameraX MLKit in `CameraMissionActivity.kt` and validates against registered barcode. | `STATIC-CODE` | Pending Phase 3 |
| **TST-13** | Camera/Vision | `PhotoMissionScreen.tsx` | Photo capture compares live frame with registered reference using `PhotoMatcher.kt` and provides similarity score. | `STATIC-CODE` | Pending Phase 3 |
| **TST-14** | Camera/Vision | `SquatMissionScreen.tsx` | Pose detection tracks squat state transitions (Standing $\rightarrow$ Descending $\rightarrow$ Squatting $\rightarrow$ Ascending $\rightarrow$ Standing). Developer bypass button removed. | `STATIC-CODE` | Pending Phase 3 |
| **TST-15** | Sensor | `StepMissionScreen.tsx` | Step counter listens to hardware step detector. Activity recognition permission checked. | `STATIC-CODE` | Pending Phase 4 |
| **TST-16** | Sensor | `ShakeMissionScreen.tsx` | Accelerometer shake detection debounces rapid noise and counts valid shakes. | `AUTO-JEST` & `STATIC-CODE` | Pending Phase 4 |
| **TST-17** | Mission Progress | `activeMissionStore.ts` | Sub-step progress (e.g. 15/30 shakes, 2/5 math questions) is persisted and restored upon app reopen. | `AUTO-JEST` & `STATIC-CODE` | Pending Phase 5 |
| **TST-18** | Multi-Mission | `missionNavigation.ts` | Chained missions advance sequentially (e.g. Math $\rightarrow$ Squat $\rightarrow$ Barcode). Prevents skipping or premature dismissal. | `AUTO-JEST` & `STATIC-CODE` | Pending Phase 5 |
| **TST-19** | Permissions | `PermissionScreen.tsx` | Preflight onboarding checks and explains Camera and Physical Activity permissions. | `STATIC-CODE` | Pending Phase 6 |
| **TST-20** | Scheduling | `nextOccurrence.ts` | Repeating alarms with arbitrary day combinations (e.g. Mon, Wed, Fri) calculate correct next epoch without skipping. | `AUTO-JEST` | Pending Phase 7 |
| **TST-21** | Navigation | `ReportScreen.tsx` | Renders on-screen Back button when pushed onto navigation stack from Morning tab. | `STATIC-CODE` | Pending Phase 8 |
| **TST-22** | Sleep Audio | `SleepScreen.tsx` & Native | Sleep music plays background audio, responds to volume controls, and shuts off when timer expires. | `STATIC-CODE` | Pending Phase 9 |
| **TST-23** | Compilation | Full Repository | `npm run typecheck` passes with 0 errors. | `AUTO-TS` | Pending Phase 11 |
| **TST-24** | Bundle | Full Repository | Metro bundle builds without error for Android. | `AUTO-BUNDLE` | Pending Phase 11 |

