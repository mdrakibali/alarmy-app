import { useActiveMissionStore } from '../src/storage/activeMissionStore';

describe('Active Mission Session & Sub-Progress Persistence', () => {
  beforeEach(() => {
    useActiveMissionStore.getState().clearSession();
  });

  afterEach(() => {
    useActiveMissionStore.getState().clearSession();
  });

  it('starts a new active mission session and initial state is valid', () => {
    useActiveMissionStore.getState().startSession('alarm-123', ['math', 'shake', 'squat'], 0);

    const session = useActiveMissionStore.getState().getActiveSession('alarm-123');
    expect(session).not.toBeNull();
    expect(session?.isInProgress).toBe(true);
    expect(session?.alarmId).toBe('alarm-123');
    expect(session?.currentIndex).toBe(0);
    expect(session?.currentMissionKey).toBe('math');
    expect(session?.totalCount).toBe(3);
    expect(session?.completedMissions).toEqual([]);
    expect(session?.subProgress).toBe(0);
  });

  it('persists and updates sub-step progress during a mission', () => {
    useActiveMissionStore.getState().startSession('alarm-123', ['shake', 'squat'], 0);

    // User shakes phone 12 times out of 30
    useActiveMissionStore.getState().updateSubProgress(12);

    expect(useActiveMissionStore.getState().getSubProgress()).toBe(12);
    const session = useActiveMissionStore.getState().getActiveSession('alarm-123');
    expect(session?.subProgress).toBe(12);
  });

  it('records completed mission, advances to next mission, and resets sub-progress', () => {
    useActiveMissionStore.getState().startSession('alarm-123', ['math', 'shake'], 0);
    useActiveMissionStore.getState().updateSubProgress(2);

    // Math mission completes
    const nextIdx = useActiveMissionStore.getState().recordMissionCompleted('alarm-123', 0, 'math');
    expect(nextIdx).toBe(1);

    const session = useActiveMissionStore.getState().getActiveSession('alarm-123');
    expect(session?.currentIndex).toBe(1);
    expect(session?.currentMissionKey).toBe('shake');
    expect(session?.completedMissions).toEqual(['math']);
    expect(session?.subProgress).toBe(0); // Sub progress reset for new mission
  });

  it('resumes existing session when startSession is called again for the same alarmId', () => {
    useActiveMissionStore.getState().startSession('alarm-123', ['math', 'shake'], 0);
    useActiveMissionStore.getState().recordMissionCompleted('alarm-123', 0, 'math');
    useActiveMissionStore.getState().updateSubProgress(15);

    // App cold start or notification re-entry calling startSession
    useActiveMissionStore.getState().startSession('alarm-123', ['math', 'shake'], 0);

    const session = useActiveMissionStore.getState().getActiveSession('alarm-123');
    expect(session?.currentIndex).toBe(1);
    expect(session?.currentMissionKey).toBe('shake');
    expect(session?.subProgress).toBe(15); // Preserved progress!
  });

  it('clears session when all chained missions are completed', () => {
    useActiveMissionStore.getState().startSession('alarm-123', ['math'], 0);
    useActiveMissionStore.getState().recordMissionCompleted('alarm-123', 0, 'math');
    useActiveMissionStore.getState().clearSession();

    const session = useActiveMissionStore.getState().getActiveSession('alarm-123');
    expect(session).toBeNull();
  });
});
