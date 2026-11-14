package com.alarmyclone.alarm

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase

object AlarmStorage {
    private const val PREF_NAME = "alarmy_native_alarms"
    private const val KEY_ALARMS = "alarms_json"

    private fun db(context: Context): SQLiteDatabase {
        val database = AlarmDatabase.get(context)
        migrateFromPrefs(context, database.writableDatabase)
        return database.writableDatabase
    }

    @Synchronized
    private fun migrateFromPrefs(context: Context, database: SQLiteDatabase) {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        val json = prefs.getString(KEY_ALARMS, null) ?: return
        if (count(database) > 0) {
            prefs.edit().remove(KEY_ALARMS).apply()
            return
        }
        try {
            val arr = org.json.JSONArray(json)
            for (i in 0 until arr.length()) {
                val model = AlarmModel.fromJsonObject(arr.getJSONObject(i))
                val withCode = if (model.requestCode == 0) {
                    model.copy(requestCode = nextRequestCode(database))
                } else {
                    model
                }
                insert(database, withCode)
            }
        } catch (_: Exception) {
        }
        prefs.edit().remove(KEY_ALARMS).apply()
    }

    @Synchronized
    fun getAllAlarms(context: Context): List<AlarmModel> {
        val database = db(context)
        val list = mutableListOf<AlarmModel>()
        database.query("alarms", arrayOf("payload"), null, null, null, null, "request_code ASC").use { cursor ->
            while (cursor.moveToNext()) {
                list.add(AlarmModel.fromJsonObject(org.json.JSONObject(cursor.getString(0))))
            }
        }
        return list
    }

    @Synchronized
    fun getAlarm(context: Context, id: String): AlarmModel? {
        return getAllAlarms(context).find { it.id == id }
    }

    @Synchronized
    fun saveAlarm(context: Context, alarm: AlarmModel): AlarmModel {
        val database = db(context)
        val existing = queryOne(database, alarm.id)
        val code = when {
            alarm.requestCode != 0 -> alarm.requestCode
            existing != null && existing.requestCode != 0 -> existing.requestCode
            else -> nextRequestCode(database)
        }
        val stored = alarm.copy(requestCode = code)
        insert(database, stored)
        return stored
    }

    @Synchronized
    fun removeAlarm(context: Context, id: String) {
        db(context).delete("alarms", "id = ?", arrayOf(id))
    }

    private fun queryOne(database: SQLiteDatabase, id: String): AlarmModel? {
        database.query("alarms", arrayOf("payload"), "id = ?", arrayOf(id), null, null, null).use { cursor ->
            if (!cursor.moveToFirst()) return null
            return AlarmModel.fromJsonObject(org.json.JSONObject(cursor.getString(0)))
        }
    }

    private fun insert(database: SQLiteDatabase, alarm: AlarmModel) {
        val values = ContentValues().apply {
            put("id", alarm.id)
            put("payload", alarm.toJsonObject().toString())
            put("request_code", alarm.requestCode)
            put("enabled", if (alarm.enabled) 1 else 0)
        }
        database.insertWithOnConflict("alarms", null, values, SQLiteDatabase.CONFLICT_REPLACE)
    }

    private fun count(database: SQLiteDatabase): Int {
        database.rawQuery("SELECT COUNT(*) FROM alarms", null).use { cursor ->
            cursor.moveToFirst()
            return cursor.getInt(0)
        }
    }

    private fun nextRequestCode(database: SQLiteDatabase): Int {
        database.beginTransaction()
        try {
            var current = 1000
            database.query("meta", arrayOf("value"), "key = ?", arrayOf("next_request_code"), null, null, null).use { cursor ->
                if (cursor.moveToFirst()) {
                    current = cursor.getInt(0)
                }
            }
            val values = ContentValues().apply {
                put("key", "next_request_code")
                put("value", current + 1)
            }
            database.insertWithOnConflict("meta", null, values, SQLiteDatabase.CONFLICT_REPLACE)
            database.setTransactionSuccessful()
            return current
        } finally {
            database.endTransaction()
        }
    }
}
