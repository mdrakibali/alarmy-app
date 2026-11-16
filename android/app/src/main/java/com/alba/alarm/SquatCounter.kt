package com.alba.alarm

import kotlin.math.hypot

/**
 * Counts squats from body landmarks detected by ML Kit.
 *
 * Each frame it reduces the legs to one vertical ratio:
 *   r = (knee.y - hip.y) / (ankle.y - knee.y)
 * the vertical hip->knee distance relative to vertical knee->ankle distance.
 *
 * When standing upright: r ≈ 1.0 (thigh and shin vertical heights are comparable).
 * When squatting down: hips sink towards knee level, so (knee.y - hip.y) -> 0 and r -> 0.
 *
 * This works reliably whether facing the camera head-on, side-on, or at an angle,
 * does not depend on distance or user body proportions, and cannot be spoofed by tilting the phone.
 *
 * Standing height is dynamically calibrated per session.
 */
class SquatCounter {

    data class Point(val x: Float, val y: Float)

    /** One leg, in image coordinates (y points downwards). */
    data class Leg(val hip: Point, val knee: Point, val ankle: Point)

    enum class State {
        /** No reliable legs in view. */
        NOT_VISIBLE,
        /** In view; waiting to detect user standing up straight. */
        STAND_UP,
        /** Standing straight: ready to squat down. */
        READY,
        /** Squat depth reached: stand back up to complete the rep. */
        DOWN,
    }

    companion object {
        /** Down = ratio below 55% of standing value (deep parallel squat). */
        const val DOWN_FRACTION = 0.55f
        /** Standing again = ratio back above 80% of standing value. */
        const val UP_FRACTION = 0.80f
        /** Plausible standing values of r for calibration. */
        const val MIN_STANDING = 0.6f
        const val MAX_STANDING = 1.8f
        const val CALIBRATION_FRAMES = 5
        /** Frames in a row required to switch state, filtering single-frame jitter. */
        const val CONFIRM_FRAMES = 2
        /** Out of view for this long resets session to STAND_UP and recalibrates. */
        const val LOST_RESET_MS = 1_500L
        /** Shins smaller than 4% of frame height are too far to trust. */
        const val MIN_SHIN_FRACTION = 0.04f
        private const val SMOOTHING = 0.5f
    }

    var state = State.NOT_VISIBLE
        private set
    var reps = 0
        private set
    /** 0.0 = standing tall ... 1.0 = deep enough to count rep. Drives depth UI. */
    var depth = 0f
        private set

    private var standing: Float? = null
    private var smoothed: Float? = null
    private var streak = 0
    private var lostAt = -1L
    private val calibration = ArrayList<Float>()

    fun reset() {
        state = State.NOT_VISIBLE
        reps = 0
        depth = 0f
        standing = null
        smoothed = null
        streak = 0
        lostAt = -1L
        calibration.clear()
    }

    /**
     * @param legs detected legs whose hip, knee, and ankle are all visible
     * @param frameHeight height of the camera frame
     * @param nowMs current elapsed realtime
     * @return true when a complete rep (standing -> down -> standing) was counted on this frame
     */
    fun update(legs: List<Leg>, frameHeight: Float, nowMs: Long): Boolean {
        val ratios = legs.mapNotNull { ratio(it, frameHeight) }
        if (ratios.isEmpty()) {
            lost(nowMs)
            return false
        }
        lostAt = -1L
        val r = ratios.average().toFloat()
        val s = smoothed?.let { it + SMOOTHING * (r - it) } ?: r
        smoothed = s

        if (state == State.NOT_VISIBLE) {
            state = State.STAND_UP
            streak = 0
        }

        val base = standing
        if (base == null) {
            calibrate(s)
            depth = 0f
            return false
        }

        depth = ((base - s) / (base * (1f - DOWN_FRACTION))).coerceIn(0f, 1f)
        val isUp = s >= base * UP_FRACTION
        val isDown = s <= base * DOWN_FRACTION
        if (isUp) adaptStanding(s)

        when (state) {
            State.STAND_UP -> if (confirm(isUp)) state = State.READY
            State.READY -> if (confirm(isDown)) state = State.DOWN
            State.DOWN -> if (confirm(isUp)) {
                state = State.READY
                reps++
                return true
            }
            State.NOT_VISIBLE -> Unit
        }
        return false
    }

    private fun ratio(leg: Leg, frameHeight: Float): Float? {
        val shinDy = leg.ankle.y - leg.knee.y
        val shinLength = hypot(leg.ankle.x - leg.knee.x, shinDy)
        if (shinDy < MIN_SHIN_FRACTION * frameHeight || shinDy < 0.5f * shinLength) return null
        return (leg.knee.y - leg.hip.y) / shinDy
    }

    private fun confirm(condition: Boolean): Boolean {
        if (!condition) {
            streak = 0
            return false
        }
        if (++streak < CONFIRM_FRAMES) return false
        streak = 0
        return true
    }

    private fun calibrate(s: Float) {
        if (s < MIN_STANDING || s > MAX_STANDING) {
            calibration.clear()
            return
        }
        calibration.add(s)
        if (calibration.size < CALIBRATION_FRAMES) return
        standing = calibration.sorted()[calibration.size / 2]
        calibration.clear()
        state = State.READY
        streak = 0
    }

    private fun adaptStanding(s: Float) {
        val base = standing ?: return
        val rate = if (s > base) 0.2f else 0.02f
        standing = (base + rate * (s - base)).coerceIn(MIN_STANDING, MAX_STANDING)
    }

    private fun lost(nowMs: Long) {
        if (lostAt < 0) lostAt = nowMs
        if (state == State.NOT_VISIBLE || nowMs - lostAt < LOST_RESET_MS) return
        state = State.NOT_VISIBLE
        standing = null
        smoothed = null
        streak = 0
        depth = 0f
        calibration.clear()
    }
}
