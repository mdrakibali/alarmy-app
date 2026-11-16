import React, { useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '@/components/ui/Screen';
import { useReportStore } from '@/storage/reportStore';
import { useAppInsets } from '@/utils/safeArea';

export function ReportScreen() {
  const insets = useAppInsets();
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack();

  const logs = useReportStore(s => s.logs);
  const getWeeklyConsistency = useReportStore(s => s.getWeeklyConsistency);
  const getSuccessRate = useReportStore(s => s.getSuccessRate);
  const getAverageWakeupTime = useReportStore(s => s.getAverageWakeupTime);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const weeklyData = useMemo(() => getWeeklyConsistency(), [getWeeklyConsistency, logs]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const successRate = useMemo(() => getSuccessRate(), [getSuccessRate, logs]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const avgWakeTime = useMemo(() => getAverageWakeupTime(), [getAverageWakeupTime, logs]);

  const onTimeCount = logs.filter(l => l.onTime).length;

  return (
    <Screen padded={false}>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="px-5"
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingBottom: 120 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        {canGoBack && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="self-start py-1 px-3 mb-3 rounded-full bg-slate-100 flex-row items-center"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text className="text-slate-700 font-bold text-xs">‹ Back</Text>
          </TouchableOpacity>
        )}
        <Text className="text-3xl font-black text-navy tracking-tight">Report</Text>
        <Text className="text-sm text-subtext mt-1">
          Your weekly wake-up and consistency analysis
        </Text>

        {/* Success Rate Card */}
        <View className="bg-white rounded-3xl p-6 mt-5 border border-slate-100 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[11px] font-black uppercase tracking-wider text-subtext">
                WAKE-UP SUCCESS RATE
              </Text>
              <Text className="text-4xl font-black text-navy mt-1">
                {successRate}% 🚀
              </Text>
            </View>
            <View className="h-14 w-14 rounded-full bg-ice border border-primary/20 items-center justify-center">
              <Text className="text-2xl">🏆</Text>
            </View>
          </View>
          <Text className="text-xs text-subtext mt-3">
            You successfully woke up on time {onTimeCount} of your last {logs.length} alarms!
          </Text>
        </View>

        {/* Weekly Bar Chart (Computed dynamically from real logs) */}
        <View className="bg-white rounded-3xl p-6 mt-4 border border-slate-100 shadow-sm">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-base font-black text-navy">
              Weekly Consistency (7 Days)
            </Text>
            <View className="flex-row items-center">
              <View className="h-2 w-2 rounded-full bg-primary mr-1.5" />
              <Text className="text-[11px] text-subtext font-bold mr-3">On Time</Text>
              <View className="h-2 w-2 rounded-full bg-rose-400 mr-1.5" />
              <Text className="text-[11px] text-subtext font-bold">Late</Text>
            </View>
          </View>

          <View className="h-40 flex-row items-end justify-between px-2 pb-2">
            {weeklyData.map((d, index) => (
              <View key={`${d.day}-${index}`} className="items-center flex-1">
                <View className="h-28 w-4 justify-end rounded-full bg-slate-100 overflow-hidden mb-2">
                  <View
                    className={`w-full rounded-full ${
                      d.onTime ? 'bg-primary' : 'bg-rose-400'
                    }`}
                    style={{ height: d.height as any }}
                  />
                </View>
                <Text className="text-xs font-bold text-subtext">
                  {d.day}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Dynamic Insights Card */}
        <View className="bg-white rounded-3xl p-5 mt-4 border border-slate-100 shadow-sm">
          <Text className="text-xs font-black uppercase tracking-wider text-primary mb-1">
            KEY INSIGHT
          </Text>
          <Text className="text-sm font-bold text-navy">
            Average wake-up time: {avgWakeTime}
          </Text>
          <Text className="text-xs text-subtext mt-1 leading-relaxed">
            Completing physical missions (Shake, Squat, Photo) reduces morning sleep inertia by 84%.
          </Text>
        </View>

        {/* Recent Wake-Up History List */}
        <View className="mt-5">
          <Text className="text-base font-black text-navy mb-3 px-1">
            Recent Alarm History
          </Text>
          {logs.slice(-4).reverse().map(l => (
            <View
              key={l.id}
              className="bg-white rounded-2xl p-4 mb-2.5 border border-slate-100 flex-row items-center justify-between shadow-xs"
            >
              <View className="flex-row items-center flex-1 pr-3">
                <View className="h-10 w-10 rounded-xl bg-ice items-center justify-center mr-3">
                  <Text className="text-lg">⏰</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-navy" numberOfLines={1}>
                    {l.label}
                  </Text>
                  <Text className="text-xs text-subtext mt-0.5">
                    Woke at {l.dismissedTime} • {l.snoozeCount > 0 ? `${l.snoozeCount} snoozes` : 'No snooze'}
                  </Text>
                </View>
              </View>
              <View
                className={`px-2.5 py-1 rounded-full ${
                  l.onTime ? 'bg-ice' : 'bg-rose-50'
                }`}
              >
                <Text
                  className={`text-[11px] font-black ${
                    l.onTime ? 'text-primary' : 'text-rose-500'
                  }`}
                >
                  {l.onTime ? 'On Time ✓' : 'Delayed'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
