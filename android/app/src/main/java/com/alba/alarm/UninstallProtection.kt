package com.alba.alarm

import android.app.Activity
import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.Log
import com.alba.MainActivity

/**
 * Device Admin-based uninstall protection:
 * While device admin is active, Android blocks uninstalling Alba.
 * If user attempts to disable admin while an alarm or mission is ringing,
 * we re-launch the ringing activity so they cannot cheat the alarm.
 */
object UninstallProtection {
    private const val TAG = "UninstallProtection"

    fun component(context: Context) = ComponentName(context, UninstallProtectionReceiver::class.java)

    private fun dpm(context: Context) =
        context.getSystemService(Context.DEVICE_POLICY_SERVICE) as? DevicePolicyManager

    fun isEnabled(context: Context): Boolean =
        dpm(context)?.isAdminActive(component(context)) == true

    fun requestEnable(context: Context) {
        val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
            putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, component(context))
            putExtra(
                DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                "Protects Alba from being uninstalled during wake-up missions. " +
                "You can turn this off at any time when no alarm is ringing."
            )
            if (context !is Activity) {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
        }
        try {
            context.startActivity(intent)
        } catch (e: Exception) {
            Log.w(TAG, "Cannot open device admin request screen", e)
        }
    }

    fun disable(context: Context) {
        if (isEnabled(context)) {
            try {
                dpm(context)?.removeActiveAdmin(component(context))
            } catch (e: Exception) {
                Log.w(TAG, "Cannot disable device admin", e)
            }
        }
    }
}

class UninstallProtectionReceiver : DeviceAdminReceiver() {
    override fun onDisableRequested(context: Context, intent: Intent): CharSequence {
        // If an alarm is ringing, bring the ringing activity right back to the front!
        if (AlarmService.isRinging) {
            val alarmId = AlarmService.currentAlarmId
            val ringingIntent = Intent(context, MainActivity::class.java).apply {
                action = AlarmReceiver.ACTION_ALARM_RINGING
                putExtra(AlarmScheduler.EXTRA_ALARM_ID, alarmId)
                addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP or
                    Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                )
            }
            try {
                context.startActivity(ringingIntent)
            } catch (e: Exception) {
                Log.w("UninstallProtection", "Failed to bring ringing activity back", e)
            }
            return "Alba mission is currently ringing! Complete the mission first to turn this off."
        }
        return "Without uninstall protection, Alba can be uninstalled to bypass wake-up missions."
    }

    override fun onEnabled(context: Context, intent: Intent) {
        Log.i("UninstallProtection", "Alba device admin uninstall protection enabled")
    }

    override fun onDisabled(context: Context, intent: Intent) {
        Log.i("UninstallProtection", "Alba device admin uninstall protection disabled")
    }
}

