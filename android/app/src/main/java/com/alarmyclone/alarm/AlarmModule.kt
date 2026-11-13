package com.alarmyclone.alarm

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class AlarmModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "AlarmModule"
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun scheduleAlarm(alarmMap: ReadableMap, promise: Promise) {
        try {
            val id = alarmMap.getString("id") ?: run {
                promise.reject("INVALID_ALARM", "Missing alarm id")
                return
            }
            val hour = alarmMap.getInt("hour")
            val minute = alarmMap.getInt("minute")
            val label = if (alarmMap.hasKey("label")) alarmMap.getString("label") ?: "Alarm" else "Alarm"
            val soundId = if (alarmMap.hasKey("soundId")) alarmMap.getString("soundId") ?: "default" else "default"
            val volume = if (alarmMap.hasKey("volume")) alarmMap.getDouble("volume").toFloat() else 1.0f
            val vibrate = if (alarmMap.hasKey("vibrate")) alarmMap.getBoolean("vibrate") else true
            val enabled = if (alarmMap.hasKey("enabled")) alarmMap.getBoolean("enabled") else true

            val repeatDaysList = mutableListOf<Int>()
            if (alarmMap.hasKey("repeatDays")) {
                val arr = alarmMap.getArray("repeatDays")
                if (arr != null) {
                    for (i in 0 until arr.size()) {
                        repeatDaysList.add(arr.getInt(i))
                    }
                }
            }

            var snoozeEnabled = true
            var snoozeIntervalMin = 5
            var snoozeMaxCount = 3
            if (alarmMap.hasKey("snooze")) {
                val snoozeMap = alarmMap.getMap("snooze")
                if (snoozeMap != null) {
                    snoozeEnabled = snoozeMap.getBoolean("enabled")
                    snoozeIntervalMin = snoozeMap.getInt("intervalMin")
                    snoozeMaxCount = snoozeMap.getInt("maxCount")
                }
            }

            val missionsList = mutableListOf<String>()
            if (alarmMap.hasKey("missions")) {
                val arr = alarmMap.getArray("missions")
                if (arr != null) {
                    for (i in 0 until arr.size()) {
                        missionsList.add(arr.getString(i))
                    }
                }
            }

            val model = AlarmModel(
                id = id,
                hour = hour,
                minute = minute,
                label = label,
                soundId = soundId,
                volume = volume,
                vibrate = vibrate,
                repeatDays = repeatDaysList,
                snoozeEnabled = snoozeEnabled,
                snoozeIntervalMin = snoozeIntervalMin,
                snoozeMaxCount = snoozeMaxCount,
                missions = missionsList,
                enabled = enabled
            )

            if (enabled) {
                AlarmScheduler.schedule(reactContext, model)
            } else {
                AlarmScheduler.cancel(reactContext, id)
            }

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SCHEDULE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun cancelAlarm(alarmId: String, promise: Promise) {
        try {
            AlarmScheduler.cancel(reactContext, alarmId)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CANCEL_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopAlarm(promise: Promise) {
        try {
            AlarmService.stop(reactContext)
            sendEvent("onAlarmDismissed", null)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun snoozeAlarm(alarmId: String, intervalMin: Int, promise: Promise) {
        try {
            val alarm = AlarmStorage.getAlarm(reactContext, alarmId)
            val delayMs = intervalMin * 60 * 1000L
            val snoozeTriggerTime = System.currentTimeMillis() + delayMs

            alarm?.let {
                val snoozed = it.copy(triggerTimeMs = snoozeTriggerTime)
                AlarmScheduler.schedule(reactContext, snoozed)
            }

            AlarmService.stop(reactContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SNOOZE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getCurrentlyRingingAlarm(promise: Promise) {
        if (!AlarmService.isRinging) {
            promise.resolve(null)
            return
        }

        val id = AlarmService.currentAlarmId
        if (id == null) {
            promise.resolve(null)
            return
        }

        val alarm = AlarmStorage.getAlarm(reactContext, id)
        val map = Arguments.createMap().apply {
            putString("id", id)
            putString("label", alarm?.label ?: "Alarm")
            putBoolean("snoozeEnabled", alarm?.snoozeEnabled ?: true)
            putInt("snoozeIntervalMin", alarm?.snoozeIntervalMin ?: 5)
            val missionsArr = Arguments.createArray()
            alarm?.missions?.forEach { missionsArr.pushString(it) }
            putArray("missions", missionsArr)
        }
        promise.resolve(map)
    }

    @ReactMethod
    fun canScheduleExactAlarms(promise: Promise) {
        promise.resolve(AlarmScheduler.canScheduleExactAlarms(reactContext))
    }

    @ReactMethod
    fun openExactAlarmSettings() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                data = Uri.parse("package:${reactContext.packageName}")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            reactContext.startActivity(intent)
        }
    }

    @ReactMethod
    fun isIgnoringBatteryOptimizations(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val powerManager = reactContext.getSystemService(Context.POWER_SERVICE) as? PowerManager
            val isIgnoring = powerManager?.isIgnoringBatteryOptimizations(reactContext.packageName) ?: true
            promise.resolve(isIgnoring)
        } else {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun requestIgnoreBatteryOptimizations() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:${reactContext.packageName}")
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                reactContext.startActivity(intent)
            } catch (e: Exception) {
                // Fallback to battery optimization settings
                val fallbackIntent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                reactContext.startActivity(fallbackIntent)
            }
        }
    }

    private fun sendEvent(eventName: String, params: Any?) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
}
