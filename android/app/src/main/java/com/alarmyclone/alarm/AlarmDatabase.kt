package com.alarmyclone.alarm

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

/**
 * Single native source of truth for scheduled alarms.
 * SQLite is used directly so boot receivers can read alarms without the JS runtime.
 */
class AlarmDatabase private constructor(context: Context) :
    SQLiteOpenHelper(context.applicationContext, "alba_alarms.db", null, 1) {

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE alarms (
              id TEXT PRIMARY KEY NOT NULL,
              payload TEXT NOT NULL,
              request_code INTEGER NOT NULL,
              enabled INTEGER NOT NULL
            )
            """.trimIndent()
        )
        db.execSQL(
            """
            CREATE TABLE meta (
              key TEXT PRIMARY KEY NOT NULL,
              value INTEGER NOT NULL
            )
            """.trimIndent()
        )
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) = Unit

    companion object {
        @Volatile
        private var instance: AlarmDatabase? = null

        fun get(context: Context): AlarmDatabase {
            return instance ?: synchronized(this) {
                instance ?: AlarmDatabase(context).also { instance = it }
            }
        }
    }
}
