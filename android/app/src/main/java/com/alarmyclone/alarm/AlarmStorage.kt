package com.alarmyclone.alarm

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

object AlarmStorage {
    private const val PREF_NAME = "alarmy_native_alarms"
    private const val KEY_ALARMS = "alarms_json"

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
    }

    @Synchronized
    fun getAllAlarms(context: Context): List<AlarmModel> {
        val jsonStr = getPrefs(context).getString(KEY_ALARMS, null) ?: return emptyList()
        val list = mutableListOf<AlarmModel>()
        try {
            val arr = JSONArray(jsonStr)
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                list.add(AlarmModel.fromJsonObject(obj))
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return list
    }

    @Synchronized
    fun getAlarm(context: Context, id: String): AlarmModel? {
        return getAllAlarms(context).find { it.id == id }
    }

    @Synchronized
    fun saveAlarm(context: Context, alarm: AlarmModel) {
        val current = getAllAlarms(context).toMutableList()
        val index = current.indexOfFirst { it.id == alarm.id }
        if (index != -1) {
            current[index] = alarm
        } else {
            current.add(alarm)
        }
        saveAll(context, current)
    }

    @Synchronized
    fun removeAlarm(context: Context, id: String) {
        val current = getAllAlarms(context).toMutableList()
        current.removeAll { it.id == id }
        saveAll(context, current)
    }

    @Synchronized
    private fun saveAll(context: Context, alarms: List<AlarmModel>) {
        val arr = JSONArray()
        alarms.forEach { arr.put(it.toJsonObject()) }
        getPrefs(context).edit().putString(KEY_ALARMS, arr.toString()).apply()
    }
}
