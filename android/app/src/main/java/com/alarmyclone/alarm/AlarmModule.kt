package com.alarmyclone.alarm

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
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
import com.facebook.react.bridge.ActivityEventListener

class AlarmModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private var previewPlayer: MediaPlayer? = null
    private var shakeDetector: ShakeDetector? = null
    private var stepCounter: StepCounter? = null
    private var cameraPromise: Promise? = null
    private var pickPromise: Promise? = null
    private var audioPromise: Promise? = null
    private var videoPromise: Promise? = null

    companion object {
        const val NAME = "AlarmModule"
        private const val CAMERA_REQUEST = 4401
        private const val PICK_REQUEST = 4402
        private const val AUDIO_REQUEST = 4403
        private const val VIDEO_REQUEST = 4404
        private var instance: AlarmModule? = null

        fun emitAlarmRinging(alarmId: String?) {
            instance?.sendEvent("onAlarmRinging", alarmId)
        }
    }

    init {
        instance = this
        reactContext.addActivityEventListener(this)
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
                        arr.getString(i)?.let { missionsList.add(it) }
                    }
                }
            }

            val gentleWakeup = if (alarmMap.hasKey("gentleWakeup")) alarmMap.getBoolean("gentleWakeup") else true

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
                enabled = enabled,
                gentleWakeup = gentleWakeup
            )

            val scheduled = if (enabled) {
                AlarmScheduler.schedule(reactContext, model)
            } else {
                AlarmScheduler.cancel(reactContext, id)
                true
            }
            promise.resolve(scheduled)
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
    fun startAlarm(alarmId: String, promise: Promise) {
        try {
            val serviceIntent = Intent(reactContext, AlarmService::class.java).apply {
                putExtra(AlarmScheduler.EXTRA_ALARM_ID, alarmId)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(serviceIntent)
            } else {
                reactContext.startService(serviceIntent)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("START_ALARM_ERROR", e.message, e)
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
            val success = AlarmScheduler.scheduleSnooze(reactContext, alarmId, intervalMin)
            AlarmService.stop(reactContext)
            promise.resolve(success)
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
    fun canUseFullScreenIntent(promise: Promise) {
        if (Build.VERSION.SDK_INT >= 34) {
            val manager = reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
            promise.resolve(manager.canUseFullScreenIntent())
        } else {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun openFullScreenIntentSettings() {
        if (Build.VERSION.SDK_INT >= 34) {
            val intent = Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT).apply {
                data = Uri.parse("package:${reactContext.packageName}")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactContext.startActivity(intent)
        }
    }

    @ReactMethod
    fun listAlarms(promise: Promise) {
        try {
            val arr = Arguments.createArray()
            AlarmStorage.getAllAlarms(reactContext).forEach { alarm ->
                val map = Arguments.createMap()
                map.putString("id", alarm.id)
                map.putBoolean("enabled", alarm.enabled)
                map.putInt("snoozeUsed", alarm.snoozeUsed)
                map.putInt("snoozeMaxCount", alarm.snoozeMaxCount)
                map.putDouble("triggerTimeMs", alarm.triggerTimeMs.toDouble())
                arr.pushMap(map)
            }
            promise.resolve(arr)
        } catch (e: Exception) {
            promise.reject("LIST_ALARMS", e.message, e)
        }
    }

    @ReactMethod
    fun openExactAlarmSettings() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                data = Uri.parse("package:${reactContext.packageName}")
                setFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
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
                    setFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                reactContext.startActivity(intent)
            } catch (e: Exception) {
                // Fallback to battery optimization settings
                val fallbackIntent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
                    setFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                reactContext.startActivity(fallbackIntent)
            }
        }
    }

    @ReactMethod
    fun canDrawOverlays(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            promise.resolve(Settings.canDrawOverlays(reactContext))
        } else {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun openOverlaySettings() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION).apply {
                    data = Uri.parse("package:${reactContext.packageName}")
                    setFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                reactContext.startActivity(intent)
            } catch (e: Exception) {
                val intent = Intent(Settings.ACTION_SETTINGS).apply {
                    setFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                reactContext.startActivity(intent)
            }
        }
    }

    @ReactMethod
    fun previewSound(soundId: String, promise: Promise) {
        Thread {
            try {
                stopSoundPreviewInternal()
                var soundUri: Uri? = null

                // 1. Try bundled raw sound resource
                if (soundId.isNotEmpty()) {
                    val cleanId = soundId.lowercase().replace("-", "_")
                    val resId = reactContext.resources.getIdentifier(cleanId, "raw", reactContext.packageName)
                    if (resId != 0) {
                        soundUri = Uri.parse("android.resource://${reactContext.packageName}/$resId")
                    }
                }

                // 2. Fallback to system ringtones
                if (soundUri == null) {
                    soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                }
                if (soundUri == null) {
                    soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
                }
                if (soundUri == null) {
                    soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
                }

                val player = MediaPlayer().apply {
                    setDataSource(reactContext, soundUri!!)
                    val audioAttributes = AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .build()
                    setAudioAttributes(audioAttributes)
                    isLooping = false
                    setOnPreparedListener { mp ->
                        try {
                            mp.start()
                        } catch (e: Exception) {}
                    }
                    setOnCompletionListener { mp ->
                        try {
                            mp.release()
                        } catch (e: Exception) {}
                        if (previewPlayer == mp) {
                            previewPlayer = null
                        }
                    }
                    setOnErrorListener { mp, _, _ ->
                        try {
                            mp.release()
                        } catch (e: Exception) {}
                        if (previewPlayer == mp) {
                            previewPlayer = null
                        }
                        true
                    }
                    prepareAsync()
                }
                previewPlayer = player
                promise.resolve(true)
            } catch (e: Exception) {
                promise.resolve(false)
            }
        }.start()
    }

    @ReactMethod
    fun stopSoundPreview(promise: Promise) {
        try {
            stopSoundPreviewInternal()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    private fun stopSoundPreviewInternal() {
        try {
            previewPlayer?.let { player ->
                try {
                    if (player.isPlaying) {
                        player.stop()
                    }
                } catch (e: Exception) {}
                player.release()
            }
        } catch (e: Exception) {}
        previewPlayer = null
    }

    // ==================== SLEEP MUSIC METHODS ====================

    @ReactMethod
    fun playSleepMusic(soundId: String, volume: Double, loop: Boolean, timerMinutes: Int, promise: Promise) {
        try {
            val success = SleepMusicManager.play(
                context = reactContext,
                soundId = soundId,
                volume = volume.toFloat(),
                loop = loop,
                timerMinutes = timerMinutes
            )
            promise.resolve(success)
        } catch (e: Exception) {
            promise.reject("SLEEP_PLAY_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun pauseSleepMusic(promise: Promise) {
        try {
            SleepMusicManager.pause()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SLEEP_PAUSE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun resumeSleepMusic(promise: Promise) {
        try {
            val res = SleepMusicManager.resume()
            promise.resolve(res)
        } catch (e: Exception) {
            promise.reject("SLEEP_RESUME_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopSleepMusic(promise: Promise) {
        try {
            SleepMusicManager.stop()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SLEEP_STOP_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun setSleepMusicVolume(volume: Double, promise: Promise) {
        try {
            SleepMusicManager.setVolume(volume.toFloat())
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SLEEP_VOL_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun seekSleepMusic(positionMs: Int, promise: Promise) {
        try {
            SleepMusicManager.seekTo(positionMs)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SLEEP_SEEK_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getSleepMusicStatus(promise: Promise) {
        try {
            val map = Arguments.createMap().apply {
                putBoolean("isPlaying", SleepMusicManager.isPlaying)
                putString("currentSoundId", SleepMusicManager.currentSoundId)
                putDouble("volume", SleepMusicManager.currentVolume.toDouble())
                putInt("remainingSeconds", SleepMusicManager.timerRemainingSeconds)
                putInt("durationMs", SleepMusicManager.getDuration())
                putInt("positionMs", SleepMusicManager.getCurrentPosition())
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("SLEEP_STATUS_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun startShakeDetection(promise: Promise) {
        try {
            if (shakeDetector == null) {
                shakeDetector = ShakeDetector(reactContext) {
                    sendEvent("onShakeEvent", null)
                }
            }
            val started = shakeDetector?.start() ?: false
            promise.resolve(started)
        } catch (e: Exception) {
            promise.reject("SHAKE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopShakeDetection(promise: Promise) {
        try {
            shakeDetector?.stop()
            shakeDetector = null
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SHAKE_STOP_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun openCameraMission(options: ReadableMap, promise: Promise) {
        val activity = reactContext.currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Open the app before using the camera")
            return
        }
        if (cameraPromise != null) {
            promise.reject("CAMERA_BUSY", "Camera is already open")
            return
        }
        cameraPromise = promise
        val intent = Intent(activity, CameraMissionActivity::class.java).apply {
            putExtra(CameraMissionActivity.EXTRA_MODE, options.getString("mode") ?: CameraMissionActivity.MODE_PHOTO)
            if (options.hasKey("target")) {
                putExtra(CameraMissionActivity.EXTRA_TARGET, options.getInt("target"))
            }
        }
        try {
            activity.startActivityForResult(intent, CAMERA_REQUEST)
        } catch (e: Exception) {
            cameraPromise = null
            promise.reject("CAMERA_START", e.message, e)
        }
    }

    @ReactMethod
    fun comparePhotos(referencePath: String, capturedPath: String, threshold: Int, promise: Promise) {
        try {
            val score = PhotoMatcher.similarityPercent(referencePath, capturedPath)
            val map = Arguments.createMap()
            map.putInt("score", score)
            map.putBoolean("pass", score >= threshold.coerceIn(1, 99))
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("COMPARE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun startStepCounter(promise: Promise) {
        try {
            stepCounter?.stop()
            val counter = StepCounter(
                reactContext,
                onSteps = { sendEvent("onStepCount", it) },
                onUnavailable = { sendEvent("onStepUnavailable", true) },
            )
            stepCounter = counter
            promise.resolve(counter.start())
        } catch (e: Exception) {
            promise.reject("STEP_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopStepCounter(promise: Promise) {
        stepCounter?.stop()
        stepCounter = null
        promise.resolve(true)
    }

    @ReactMethod
    fun pickLocalImage(promise: Promise) {
        val activity = reactContext.currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Open the app before choosing a photo")
            return
        }
        pickPromise = promise
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "image/*"
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION)
        }
        try {
            activity.startActivityForResult(intent, PICK_REQUEST)
        } catch (e: Exception) {
            pickPromise = null
            promise.reject("PICK_IMAGE", e.message, e)
        }
    }

    @ReactMethod
    fun pickLocalAudio(promise: Promise) {
        openDocument(promise, "audio/*", AUDIO_REQUEST) { audioPromise = it }
    }

    @ReactMethod
    fun pickLocalVideo(promise: Promise) {
        openDocument(promise, "video/*", VIDEO_REQUEST) { videoPromise = it }
    }

    @ReactMethod
    fun previewVideo(uri: String) {
        val activity = reactContext.currentActivity ?: return
        val intent = Intent(activity, VideoPreviewActivity::class.java).apply {
            putExtra(VideoPreviewActivity.EXTRA_URI, uri)
        }
        activity.startActivity(intent)
    }

    private fun openDocument(promise: Promise, mime: String, request: Int, hold: (Promise?) -> Unit) {
        val activity = reactContext.currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Open the app before choosing a file")
            return
        }
        hold(promise)
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = mime
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION)
        }
        try {
            activity.startActivityForResult(intent, request)
        } catch (e: Exception) {
            hold(null)
            promise.reject("PICK_FILE", e.message, e)
        }
    }

    @ReactMethod
    fun exportAlarmBackup(json: String, promise: Promise) {
        try {
            val file = java.io.File(reactContext.filesDir, "alba-backup.json")
            file.writeText(json)
            promise.resolve(file.absolutePath)
        } catch (e: Exception) {
            promise.reject("BACKUP", e.message, e)
        }
    }

    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == AUDIO_REQUEST || requestCode == VIDEO_REQUEST) {
            val promise = if (requestCode == AUDIO_REQUEST) audioPromise else videoPromise
            if (requestCode == AUDIO_REQUEST) audioPromise = null else videoPromise = null
            val uri = data?.data
            if (promise == null) return
            if (resultCode != Activity.RESULT_OK || uri == null) {
                promise.reject("PICK_CANCELLED", "cancelled")
                return
            }
            try {
                reactContext.contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
            } catch (_: Exception) {
            }
            promise.resolve(uri.toString())
            return
        }
        if (requestCode == PICK_REQUEST) {
            val promise = pickPromise ?: return
            pickPromise = null
            val uri = data?.data
            if (resultCode != Activity.RESULT_OK || uri == null) {
                promise.reject("PICK_CANCELLED", "cancelled")
                return
            }
            try {
                reactContext.contentResolver.takePersistableUriPermission(
                    uri,
                    Intent.FLAG_GRANT_READ_URI_PERMISSION,
                )
            } catch (_: Exception) {
            }
            promise.resolve(uri.toString())
            return
        }
        if (requestCode != CAMERA_REQUEST) return
        val promise = cameraPromise ?: return
        cameraPromise = null
        if (resultCode != Activity.RESULT_OK || data == null) {
            promise.reject("CAMERA_CANCELLED", data?.getStringExtra(CameraMissionActivity.EXTRA_REASON) ?: "cancelled")
            return
        }
        val map = Arguments.createMap()
        data.getStringExtra(CameraMissionActivity.EXTRA_PATH)?.let { map.putString("path", it) }
        data.getStringExtra(CameraMissionActivity.EXTRA_VALUE)?.let { map.putString("value", it) }
        map.putInt("count", data.getIntExtra(CameraMissionActivity.EXTRA_COUNT, 0))
        map.putBoolean("completed", data.getBooleanExtra(CameraMissionActivity.EXTRA_COMPLETED, false))
        promise.resolve(map)
    }

    override fun onNewIntent(intent: Intent) = Unit

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN built-in Event Emitter Calls.
    }

    @ReactMethod
    fun removeListeners(count: Double) {
        // Required for RN built-in Event Emitter Calls.
    }

    private fun sendEvent(eventName: String, params: Any?) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
}

