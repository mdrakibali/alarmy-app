package com.alarmyclone

import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactApplication
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  companion object {
    @Volatile
    var pendingSnoozeAlarmId: String? = null
    @Volatile
    var pendingSnoozeIntervalMin: Int = 5
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    turnScreenOnAndShowWhenLocked()
    disableShakeDevMenu()
    handleIntent(intent)
  }

  override fun onResume() {
    super.onResume()
    disableShakeDevMenu()
  }

  private fun disableShakeDevMenu() {
    try {
      (application as? ReactApplication)?.reactNativeHost?.reactInstanceManager?.devSupportManager?.let { dsm ->
        dsm.shakeGestureEnabled = false
      }
    } catch (_: Throwable) {
    }
    try {
      (application as? ReactApplication)?.reactHost?.devSupportManager?.let { devSupportManager ->
        devSupportManager.shakeGestureEnabled = false
      }
    } catch (_: Throwable) {
    }
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    turnScreenOnAndShowWhenLocked()
    handleIntent(intent)
  }

  private fun handleIntent(intent: Intent?) {
    if (intent?.action == com.alarmyclone.alarm.AlarmScheduler.ACTION_OPEN_SNOOZE) {
      val alarmId = intent.getStringExtra(com.alarmyclone.alarm.AlarmScheduler.EXTRA_ALARM_ID)
      val intervalMin = intent.getIntExtra(com.alarmyclone.alarm.AlarmScheduler.EXTRA_SNOOZE_INTERVAL, 5)
      if (alarmId != null) {
        pendingSnoozeAlarmId = alarmId
        pendingSnoozeIntervalMin = intervalMin
        val map = com.facebook.react.bridge.Arguments.createMap().apply {
          putString("alarmId", alarmId)
          putInt("intervalMin", intervalMin)
        }
        com.alarmyclone.alarm.AlarmModule.instance?.sendEvent("onOpenSnooze", map)
      }
    }
  }

  private fun turnScreenOnAndShowWhenLocked() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
      val keyguardManager = getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
      keyguardManager?.requestDismissKeyguard(this, null)
    } else {
      @Suppress("DEPRECATION")
      window.addFlags(
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
        WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
      )
    }
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "Alba"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
