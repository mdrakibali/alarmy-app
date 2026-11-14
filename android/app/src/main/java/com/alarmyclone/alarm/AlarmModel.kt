package com.alarmyclone.alarm

import org.json.JSONArray
import org.json.JSONObject

data class AlarmModel(
    val id: String,
    val hour: Int,
    val minute: Int,
    val label: String = "Alarm",
    val soundId: String = "default",
    val volume: Float = 1.0f,
    val vibrate: Boolean = true,
    val repeatDays: List<Int> = emptyList(),
    val snoozeEnabled: Boolean = true,
    val snoozeIntervalMin: Int = 5,
    val snoozeMaxCount: Int = 3,
    val missions: List<String> = emptyList(),
    val enabled: Boolean = true,
    var triggerTimeMs: Long = 0L,
    val gentleWakeup: Boolean = true
) {
    fun toJsonObject(): JSONObject {
        val obj = JSONObject()
        obj.put("id", id)
        obj.put("hour", hour)
        obj.put("minute", minute)
        obj.put("label", label)
        obj.put("soundId", soundId)
        obj.put("volume", volume.toDouble())
        obj.put("vibrate", vibrate)
        obj.put("snoozeEnabled", snoozeEnabled)
        obj.put("snoozeIntervalMin", snoozeIntervalMin)
        obj.put("snoozeMaxCount", snoozeMaxCount)
        obj.put("enabled", enabled)
        obj.put("triggerTimeMs", triggerTimeMs)
        obj.put("gentleWakeup", gentleWakeup)

        val daysArray = JSONArray()
        repeatDays.forEach { daysArray.put(it) }
        obj.put("repeatDays", daysArray)

        val missionsArray = JSONArray()
        missions.forEach { missionsArray.put(it) }
        obj.put("missions", missionsArray)

        return obj
    }

    companion object {
        fun fromJsonObject(obj: JSONObject): AlarmModel {
            val repeatDaysList = mutableListOf<Int>()
            obj.optJSONArray("repeatDays")?.let { arr ->
                for (i in 0 until arr.length()) {
                    repeatDaysList.add(arr.getInt(i))
                }
            }

            val missionsList = mutableListOf<String>()
            obj.optJSONArray("missions")?.let { arr ->
                for (i in 0 until arr.length()) {
                    missionsList.add(arr.getString(i))
                }
            }

            return AlarmModel(
                id = obj.getString("id"),
                hour = obj.getInt("hour"),
                minute = obj.getInt("minute"),
                label = obj.optString("label", "Alarm"),
                soundId = obj.optString("soundId", "default"),
                volume = obj.optDouble("volume", 1.0).toFloat(),
                vibrate = obj.optBoolean("vibrate", true),
                repeatDays = repeatDaysList,
                snoozeEnabled = obj.optBoolean("snoozeEnabled", true),
                snoozeIntervalMin = obj.optInt("snoozeIntervalMin", 5),
                snoozeMaxCount = obj.optInt("snoozeMaxCount", 3),
                missions = missionsList,
                enabled = obj.optBoolean("enabled", true),
                triggerTimeMs = obj.optLong("triggerTimeMs", 0L),
                gentleWakeup = obj.optBoolean("gentleWakeup", true)
            )
        }
    }
}

