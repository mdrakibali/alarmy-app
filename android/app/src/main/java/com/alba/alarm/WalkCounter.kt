package com.alba.alarm

import kotlin.math.abs
import kotlin.math.exp
import kotlin.math.sqrt

/**
 * Intelligent walking and stride detector using the accelerometer.
 *
 * Separates Earth's gravity vector from dynamic body movement using a time-decay low-pass filter,
 * projects movement onto gravity to isolate true vertical heel-strike ground reaction,
 * rejects lateral swings and bed shaking, and enforces stable human walking cadence.
 *
 * Prevents false positives from shaking, rocking in bed, or moving the phone in hand.
 */
class WalkCounter {
    var steps = 0
        private set

    private var gx = 0f
    private var gy = 0f
    private var gz = 9.81f
    private var vertical = 0f
    private var lastSample = -1L
    private var peakAt = -1L
    private var lastStride = -1L
    private var cadence = 0L
    private var consecutive = 0
    private var armed = true

    fun resetMotion() {
        lastSample = -1L
        peakAt = -1L
        lastStride = -1L
        cadence = 0
        consecutive = 0
        vertical = 0f
        armed = true
    }

    fun resetAll() {
        resetMotion()
        steps = 0
    }

    /**
     * @param x accelerometer X
     * @param y accelerometer Y
     * @param z accelerometer Z
     * @param now timestamp in milliseconds
     * @return 1 when a valid human walking step is confirmed, 0 otherwise
     */
    fun update(x: Float, y: Float, z: Float, now: Long): Int {
        if (!x.isFinite() || !y.isFinite() || !z.isFinite()) return 0
        if (lastSample < 0 || now - lastSample > 500) {
            resetMotion()
            gx = x
            gy = y
            gz = z
            lastSample = now
            return 0
        }
        if (now <= lastSample) return 0

        val dt = (now - lastSample).coerceAtMost(100)
        lastSample = now

        // 1. Estimate gravity direction with time-decay filter
        val gravityAlpha = exp(-dt / 1000f)
        gx = gravityAlpha * gx + (1f - gravityAlpha) * x
        gy = gravityAlpha * gy + (1f - gravityAlpha) * y
        gz = gravityAlpha * gz + (1f - gravityAlpha) * z
        val gravity = sqrt(gx * gx + gy * gy + gz * gz).coerceAtLeast(1f)

        // 2. Project linear dynamic movement onto gravity vector -> True vertical acceleration
        val lx = x - gx
        val ly = y - gy
        val lz = z - gz
        val projected = (lx * gx + ly * gy + lz * gz) / gravity
        val lateral = sqrt((lx * lx + ly * ly + lz * lz - projected * projected).coerceAtLeast(0f))

        val alpha = exp(-dt / 55f)
        vertical = alpha * vertical + (1f - alpha) * projected
        val magnitude = sqrt(x * x + y * y + z * z)

        // 3. Reject erratic shakes, freefalls, and excessive lateral movement (swinging in air)
        if (magnitude > 22f || magnitude < 3f || lateral > maxOf(2.5f, abs(projected) * 1.7f)) {
            peakAt = -1L
            consecutive = 0
            lastStride = -1L
            armed = false
            return 0
        }

        // 4. Heel-strike peak detection
        if (vertical < 0.2f && peakAt < 0) armed = true
        if (peakAt < 0 && armed && vertical > 1.35f) {
            peakAt = now
            armed = false
        }
        if (peakAt < 0) return 0

        val phase = now - peakAt
        if (phase > 650) {
            peakAt = -1L
            consecutive = 0
            return 0
        }
        if (vertical > -0.7f || phase < 100) return 0
        peakAt = -1L

        val gap = now - lastStride
        if (lastStride >= 0 && gap < 380) {
            consecutive = 0
            lastStride = now
            return 0
        }

        // 5. Cadence lock (human walking cadence: 380ms to 1300ms between strides)
        val steady = lastStride >= 0 && gap <= 1300 &&
                (cadence == 0L || abs(gap - cadence) <= maxOf(180L, cadence / 3))
        consecutive = if (steady) consecutive + 1 else 1
        cadence = if (steady && cadence > 0) (cadence * 2 + gap) / 3 else if (steady) gap else 0
        lastStride = now

        // Require 2 initial warm-up strides to establish rhythm before counting steps
        if (consecutive < 3) return 0
        steps++
        return 1
    }
}

