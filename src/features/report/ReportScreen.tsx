import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { useAppInsets } from '@/utils/safeArea';

const DAYS = [
  { day: 'Mon', onTime: true, height: '80%' },
  { day: 'Tue', onTime: true, height: '90%' },
  { day: 'Wed', onTime: false, height: '40%' },
  { day: 'Thu', onTime: true, height: '85%' },
  { day: 'Fri', onTime: true, height: '100%' },
  { day: 'Sat', onTime: true, height: '70%' },
  { day: 'Sun', onTime: true, height: '75%' },
];

export function ReportScreen() {
  const insets = useAppInsets();

  return (
    <Screen padded={false}>
      <ScrollView
        className="flex-1 bg-[#F5F6F8]"
        contentContainerClassName="px-5"
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingBottom: 120 + insets.bottom,
        }}
      >
        <Text className="text-3xl font-extrabold text-slate-900">Report</Text>
        <Text className="text-sm text-slate-500 mt-1">
          Your weekly wake-up and consistency analysis
        </Text>

        {/* Success Rate Card */}
        <View className="bg-white rounded-3xl p-6 mt-5 border border-slate-100 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
                WAKE-UP SUCCESS RATE
              </Text>
              <Text className="text-4xl font-black text-slate-900 mt-1">
                92% 🚀
              </Text>
            </View>
            <View className="h-14 w-14 rounded-full bg-[#E0F2FE] items-center justify-center">
              <Text className="text-2xl">🏆</Text>
            </View>
          </View>
          <Text className="text-xs text-slate-500 mt-3">
            You woke up on time 6 out of 7 days this week!
          </Text>
        </View>

        {/* Weekly Bar Chart */}
        <View className="bg-white rounded-3xl p-6 mt-4 border border-slate-100 shadow-sm">
          <Text className="text-base font-bold text-slate-900 mb-6">
            Weekly Wake-up Consistency
          </Text>

          <View className="h-40 flex-row items-end justify-between px-2 pb-2">
            {DAYS.map(d => (
              <View key={d.day} className="items-center flex-1">
                <View className="h-28 w-4 justify-end rounded-full bg-slate-100 overflow-hidden mb-2">
                  <View
                    className={`w-full rounded-full ${
                      d.onTime ? 'bg-[#38BDF8]' : 'bg-rose-400'
                    }`}
                    style={{ height: d.height as any }}
                  />
                </View>
                <Text className="text-xs font-semibold text-slate-500">
                  {d.day}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Insights */}
        <View className="bg-white rounded-3xl p-5 mt-4 border border-slate-100 shadow-sm">
          <Text className="text-xs font-bold uppercase tracking-wider text-[#FF385C] mb-1">
            KEY INSIGHT
          </Text>
          <Text className="text-sm font-semibold text-slate-800">
            Average wake-up time: 7:15 AM
          </Text>
          <Text className="text-xs text-slate-500 mt-1">
            Using the Math Mission helped reduce snooze duration by 84%.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

