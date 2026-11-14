export type TabParamList = {
  Alarm: undefined;
  Sleep: undefined;
  Morning: undefined;
  Report: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  AlarmEdit: { id?: string } | undefined;
  AlarmRinging: { id?: string } | undefined;
  MathMission: { alarmId?: string } | undefined;
  ShakeMission: { alarmId?: string } | undefined;
};
