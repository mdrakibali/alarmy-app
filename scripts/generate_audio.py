#!/usr/bin/env python3
import os
import wave
import struct
import math
import random

SAMPLE_RATE = 22050  # 22.05 kHz is compact, clear, and high quality

def clamp(val, min_v=-1.0, max_v=1.0):
    return max(min(val, max_v), min_v)

def save_wav(filename, samples, sample_rate=SAMPLE_RATE):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with wave.open(filename, 'wb') as wav:
        wav.setnchannels(1)      # mono
        wav.setsampwidth(2)      # 16-bit
        wav.setframerate(sample_rate)
        
        # Convert float [-1.0, 1.0] to int16 [-32767, 32767]
        raw_data = bytearray()
        for s in samples:
            int_val = int(clamp(s) * 32767)
            raw_data.extend(struct.pack('<h', int_val))
        wav.writeframes(raw_data)
    print(f"Generated {filename} ({len(samples) / sample_rate:.1f}s, {len(raw_data)} bytes)")

def copy_to_destinations(base_name, samples, sample_rate=SAMPLE_RATE):
    res_raw_dir = "android/app/src/main/res/raw"
    src_assets_alarm = "src/assets/sounds/alarm"
    src_assets_sleep = "src/assets/sounds/sleep"
    
    # Android raw resource names must be lowercase letters, numbers, and underscores only
    res_name = base_name.lower().replace("-", "_") + ".wav"
    raw_path = os.path.join(res_raw_dir, res_name)
    save_wav(raw_path, samples, sample_rate)
    
    if base_name.startswith("alarm_"):
        asset_path = os.path.join(src_assets_alarm, res_name)
    else:
        asset_path = os.path.join(src_assets_sleep, res_name)
    
    save_wav(asset_path, samples, sample_rate)

# ==================== ALARM SOUND GENERATORS ====================

def gen_alarm_classic(duration=5.0):
    """Classic mechanical twin-bell alarm clock (intense fast ringing with metallic clapper bursts)"""
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        # Ring pulse: on for 0.4s, off for 0.1s
        cycle_pos = (t % 0.5) / 0.5
        if cycle_pos < 0.8:
            # Clapper rapid strike at 28Hz
            strike = 0.5 + 0.5 * math.sin(2 * math.pi * 28 * t)
            # Twin bell resonance: 1050 Hz and 1350 Hz with metallic overtone at 2400 Hz
            bell1 = math.sin(2 * math.pi * 1050 * t)
            bell2 = math.sin(2 * math.pi * 1350 * t)
            metal = 0.3 * math.sin(2 * math.pi * 2420 * t)
            val = strike * (bell1 * 0.45 + bell2 * 0.45 + metal * 0.1)
        else:
            val = 0.0
        samples.append(val * 0.9)
    return samples

def gen_alarm_digital(duration=4.0):
    """Classic digital watch alarm: sharp double beeps (beep-beep ... beep-beep)"""
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        # 1-second pattern: [0.0 - 0.15: beep], [0.15 - 0.25: silence], [0.25 - 0.4: beep], [0.4 - 1.0: silence]
        sec_t = t % 1.0
        if (0.0 <= sec_t < 0.14) or (0.24 <= sec_t < 0.38):
            # Square-wave like digital tone at 2048 Hz with 1024 Hz harmonic
            tone = 0.7 * math.sin(2 * math.pi * 2048 * t) + 0.3 * math.sin(2 * math.pi * 1024 * t)
            # Sharp envelope attack/decay
            sub_t = sec_t if sec_t < 0.2 else (sec_t - 0.24)
            env = min(1.0, sub_t * 100) * min(1.0, (0.14 - sub_t) * 100)
            val = tone * env
        else:
            val = 0.0
        samples.append(val * 0.85)
    return samples

def gen_alarm_siren(duration=5.0):
    """Loud emergency siren sweeping smoothly up and down"""
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    phase = 0.0
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        # Sweep frequency between 500 Hz and 1300 Hz every 1.5 seconds
        freq = 900.0 + 400.0 * math.sin(2 * math.pi * (1.0 / 1.5) * t)
        phase += 2 * math.pi * freq / SAMPLE_RATE
        # Overtones for piercing presence
        val = 0.6 * math.sin(phase) + 0.3 * math.sin(phase * 2) + 0.1 * math.sin(phase * 3)
        samples.append(val * 0.8)
    return samples

def gen_alarm_emergency(duration=4.0):
    """Piercing dual-tone urgent warning alarm"""
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        # Alternates between 960 Hz and 1440 Hz every 0.18s
        freq = 960.0 if (int(t / 0.18) % 2 == 0) else 1440.0
        val = math.sin(2 * math.pi * freq * t)
        # Add slight pulse modulation
        val += 0.3 * math.sin(2 * math.pi * (freq * 1.5) * t)
        samples.append(val * 0.75)
    return samples

def gen_alarm_bell(duration=5.0):
    """Chime / brass bell tolling every 1.6s with rich reverberant decay"""
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        chime_t = t % 1.6
        # Exponential strike decay
        env = math.exp(-2.5 * chime_t)
        # Bell harmonics: Fundamental 660 Hz (E5), Overtones: 1320 Hz, 1980 Hz, 2640 Hz
        tone = (
            0.5 * math.sin(2 * math.pi * 659.25 * chime_t) +
            0.3 * math.sin(2 * math.pi * 1318.5 * chime_t) +
            0.15 * math.sin(2 * math.pi * 1977.75 * chime_t) +
            0.05 * math.sin(2 * math.pi * 2637.0 * chime_t)
        )
        samples.append(tone * env * 0.9)
    return samples

def gen_alarm_rooster(duration=4.5):
    """Synthesized rooster 'cock-a-doodle-doo' pattern"""
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    phase = 0.0
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        cycle_t = t % 2.2
        # Cock-a-doodle-doo 4-note contour:
        # Note 1: 0.00 - 0.20s (450 Hz)
        # Note 2: 0.25 - 0.45s (480 Hz)
        # Note 3: 0.50 - 0.75s (600 Hz)
        # Note 4: 0.80 - 1.80s (780 Hz with vibrato)
        freq = 0
        amp = 0
        if 0.0 <= cycle_t < 0.20:
            freq = 450.0
            amp = math.sin(math.pi * (cycle_t / 0.20))
        elif 0.25 <= cycle_t < 0.45:
            freq = 480.0
            amp = math.sin(math.pi * ((cycle_t - 0.25) / 0.20))
        elif 0.50 <= cycle_t < 0.75:
            freq = 600.0
            amp = math.sin(math.pi * ((cycle_t - 0.50) / 0.25))
        elif 0.80 <= cycle_t < 1.70:
            sub = cycle_t - 0.80
            vibrato = 15.0 * math.sin(2 * math.pi * 6.5 * sub)
            freq = 780.0 + vibrato
            amp = min(1.0, sub * 8) * math.exp(-1.5 * sub)
        
        if freq > 0:
            phase += 2 * math.pi * freq / SAMPLE_RATE
            # Bright rooster timbre with rich odd/even harmonics
            val = amp * (0.6 * math.sin(phase) + 0.3 * math.sin(2 * phase) + 0.15 * math.sin(3 * phase))
        else:
            val = 0.0
        samples.append(val * 0.85)
    return samples

def gen_alarm_birds(duration=5.0):
    """Morning forest birds singing chirps and trills"""
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    random.seed(42)
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        sec = t % 1.8
        # Chirp 1 at 0.1s, Chirp 2 at 0.5s, Trill at 0.9s-1.3s
        val = 0.0
        if 0.1 <= sec < 0.35:
            dt = sec - 0.1
            f = 2400 + 1800 * math.sin(math.pi * (dt / 0.25))
            val = 0.6 * math.sin(2 * math.pi * f * dt) * math.sin(math.pi * (dt / 0.25))
        elif 0.45 <= sec < 0.7:
            dt = sec - 0.45
            f = 2800 + 2000 * math.sin(math.pi * (dt / 0.25))
            val = 0.7 * math.sin(2 * math.pi * f * dt) * math.sin(math.pi * (dt / 0.25))
        elif 0.85 <= sec < 1.4:
            dt = sec - 0.85
            # Rapid vibrato trill
            trill = 400 * math.sin(2 * math.pi * 18 * dt)
            f = 3200 + trill
            val = 0.8 * math.sin(2 * math.pi * f * dt) * math.exp(-2.0 * dt)
        samples.append(val * 0.8)
    return samples

def gen_alarm_gentle(duration=5.0):
    """Gentle relaxing ascending pentatonic morning chimes"""
    notes = [523.25, 587.33, 659.25, 783.99, 880.00]  # C5, D5, E5, G5, A5
    num_samples = int(SAMPLE_RATE * duration)
    samples = [0.0] * num_samples
    
    for idx, freq in enumerate(notes):
        start_t = idx * 0.75
        start_sample = int(start_t * SAMPLE_RATE)
        for i in range(start_sample, min(num_samples, start_sample + int(2.5 * SAMPLE_RATE))):
            t_rel = (i - start_sample) / SAMPLE_RATE
            env = math.exp(-2.2 * t_rel)
            tone = 0.6 * math.sin(2 * math.pi * freq * t_rel) + 0.3 * math.sin(2 * math.pi * freq * 2 * t_rel)
            samples[i] += tone * env * 0.45
    return samples

def gen_alarm_piano(duration=5.0):
    """Warm uplifting piano arpeggio chord progression"""
    # C major (C4, E4, G4, C5) -> F major (F4, A4, C5, F5)
    chords = [
        [(261.63, 0.0), (329.63, 0.3), (392.00, 0.6), (523.25, 0.9)],
        [(349.23, 2.0), (440.00, 2.3), (523.25, 2.6), (698.46, 2.9)]
    ]
    num_samples = int(SAMPLE_RATE * duration)
    samples = [0.0] * num_samples
    
    for chord in chords:
        for freq, offset_t in chord:
            start_i = int(offset_t * SAMPLE_RATE)
            for i in range(start_i, min(num_samples, start_i + int(2.2 * SAMPLE_RATE))):
                t_rel = (i - start_i) / SAMPLE_RATE
                env = math.exp(-1.8 * t_rel)
                # Piano timbre: fundamental + 2nd, 3rd, 4th harmonics
                piano_tone = (
                    0.50 * math.sin(2 * math.pi * freq * t_rel) +
                    0.25 * math.sin(2 * math.pi * freq * 2 * t_rel) +
                    0.15 * math.sin(2 * math.pi * freq * 3 * t_rel) +
                    0.05 * math.sin(2 * math.pi * freq * 4 * t_rel)
                )
                samples[i] += piano_tone * env * 0.35
    return samples

def gen_alarm_electronic(duration=4.5):
    """Energetic rhythmic electronic synth beat pulse"""
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        beat_t = t % 0.25
        # 16th note synth arpeggiator
        step = int((t % 1.0) / 0.25)
        freqs = [440, 554.37, 659.25, 880]
        freq = freqs[step]
        env = math.exp(-12.0 * beat_t)
        # Sawtooth approximation
        val = 0.0
        for h in range(1, 6):
            val += (1.0 / h) * math.sin(2 * math.pi * freq * h * beat_t)
        samples.append(val * env * 0.4)
    return samples

# ==================== SLEEP SOUND GENERATORS ====================

def gen_sleep_rain(duration=8.0):
    """Gentle steady rainfall (low-pass filtered noise with random droplet taps)"""
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    random.seed(101)
    
    # Simple recursive low-pass filter
    prev = 0.0
    alpha = 0.12  # filter cutoff
    
    for i in range(num_samples):
        # White noise input
        noise = random.uniform(-1.0, 1.0)
        # Random rain drop tap
        if random.random() < 0.003:
            noise += random.uniform(1.5, 3.0)
        prev = prev + alpha * (noise - prev)
        samples.append(prev * 0.45)
    return samples

def gen_sleep_ocean(duration=8.0):
    """Rhythmic ocean waves gently rolling onto a sandy beach"""
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    random.seed(202)
    prev = 0.0
    
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        # Ocean swell cycle: ~4 seconds per wave
        wave_cycle = 0.5 + 0.5 * math.sin(2 * math.pi * 0.25 * t - math.pi / 2)
        # Filtered foamy water sound
        alpha = 0.04 + 0.08 * wave_cycle
        noise = random.uniform(-1.0, 1.0)
        prev = prev + alpha * (noise - prev)
        val = prev * wave_cycle * 0.6
        samples.append(val)
    return samples

def gen_sleep_forest(duration=8.0):
    """Forest night ambience with distant gentle crickets and soothing rustling leaves"""
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    random.seed(303)
    prev = 0.0
    alpha = 0.08
    
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        noise = random.uniform(-1.0, 1.0)
        prev = prev + alpha * (noise - prev)
        # Distant crickets chirping at 4500 Hz pulsed at 4 Hz
        cricket_env = 0.5 + 0.5 * math.sin(2 * math.pi * 4.0 * t)
        if cricket_env > 0.8:
            cricket = 0.12 * math.sin(2 * math.pi * 4500 * t) * (cricket_env - 0.8) * 5
        else:
            cricket = 0.0
        val = prev * 0.3 + cricket
        samples.append(val * 0.6)
    return samples

def gen_sleep_wind(duration=8.0):
    """Soft mountain breeze howling soothingly through trees"""
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    random.seed(404)
    prev1 = 0.0
    prev2 = 0.0
    
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        # Gentle modulation of wind strength
        wind_mod = 0.5 + 0.5 * math.sin(2 * math.pi * 0.15 * t)
        alpha = 0.02 + 0.03 * wind_mod
        noise = random.uniform(-1.0, 1.0)
        prev1 = prev1 + alpha * (noise - prev1)
        prev2 = prev2 + alpha * (prev1 - prev2)  # Double-pole low-pass
        # Soft resonant low howl at 180 Hz
        howl = 0.15 * math.sin(2 * math.pi * (160 + 40 * wind_mod) * t) * wind_mod
        val = (prev2 * 0.7 + howl * 0.3) * 0.65
        samples.append(val)
    return samples

def gen_sleep_thunderstorm(duration=8.0):
    """Steady rain with distant rolling thunder claps"""
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    random.seed(505)
    rain_prev = 0.0
    thunder_prev = 0.0
    
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        # Continuous rain
        rain_prev = rain_prev + 0.1 * (random.uniform(-1.0, 1.0) - rain_prev)
        
        # Distant thunder rumble occurring around t=2.0s to 5.0s
        thunder = 0.0
        if 1.5 <= t < 6.0:
            th_t = t - 1.5
            th_env = math.exp(-0.8 * th_t) * (1.0 - math.exp(-4.0 * th_t))
            thunder_prev = thunder_prev + 0.015 * (random.uniform(-1.0, 1.0) - thunder_prev)
            thunder = thunder_prev * th_env * 3.5
        
        val = rain_prev * 0.3 + thunder
        samples.append(val * 0.55)
    return samples

def gen_sleep_fireplace(duration=8.0):
    """Warm crackling campfire / hearth embers with soothing low hum"""
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    random.seed(606)
    prev = 0.0
    
    for i in range(num_samples):
        # Warm hum
        prev = prev + 0.05 * (random.uniform(-1.0, 1.0) - prev)
        # Random sharp crackle / pop transient
        pop = 0.0
        if random.random() < 0.0018:
            pop = random.uniform(0.6, 1.4) * (1 if random.random() > 0.5 else -1)
        val = (prev * 0.4 + pop * 0.6) * 0.65
        samples.append(val)
    return samples

def gen_sleep_whitenoise(duration=6.0):
    """Smooth calibrated white noise for sleep masking"""
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    random.seed(707)
    for _ in range(num_samples):
        val = random.uniform(-0.35, 0.35)
        samples.append(val)
    return samples

def gen_sleep_pinknoise(duration=6.0):
    """Paul Kellet's filtered 1/f Pink Noise algorithm"""
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    random.seed(808)
    b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0
    
    for _ in range(num_samples):
        white = random.uniform(-1.0, 1.0)
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.96900 * b2 + white * 0.1538520
        b3 = 0.86650 * b3 + white * 0.3104856
        b4 = 0.55000 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.0168980
        pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
        b6 = white * 0.115926
        samples.append(pink * 0.075)
    return samples

def gen_sleep_brownnoise(duration=6.0):
    """1/f^2 Brown / Red Noise (deep low-frequency brownian rumble)"""
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    random.seed(909)
    brown = 0.0
    
    for _ in range(num_samples):
        white = random.uniform(-1.0, 1.0)
        brown = (brown + (0.02 * white)) / 1.02
        samples.append(brown * 1.5)
    return samples

def gen_sleep_meditation(duration=8.0):
    """Deep 432 Hz Tibetan singing bowl resonance with 4 Hz binaural relaxation beat"""
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        # Slow 0.125 Hz breath swell
        swell = 0.6 + 0.4 * math.sin(2 * math.pi * 0.125 * t)
        # 432 Hz fundamental with subtle 4 Hz theta beat (432 Hz + 436 Hz)
        f1 = math.sin(2 * math.pi * 432.0 * t)
        f2 = math.sin(2 * math.pi * 436.0 * t)
        harmonic = 0.3 * math.sin(2 * math.pi * (432.0 * 2) * t)
        val = (0.45 * f1 + 0.45 * f2 + harmonic) * swell * 0.5
        samples.append(val)
    return samples

def gen_sleep_piano(duration=8.0):
    """Soothing slow nighttime piano lullaby chords (Ab major - Db major)"""
    # Ab4 (415.30), C5 (523.25), Eb5 (622.25)
    num_samples = int(SAMPLE_RATE * duration)
    samples = [0.0] * num_samples
    notes = [
        (415.30, 0.0), (523.25, 0.5), (622.25, 1.0),
        (349.23, 4.0), (440.00, 4.5), (523.25, 5.0)
    ]
    for freq, start_t in notes:
        start_i = int(start_t * SAMPLE_RATE)
        for i in range(start_i, min(num_samples, start_i + int(3.5 * SAMPLE_RATE))):
            t_rel = (i - start_i) / SAMPLE_RATE
            env = math.exp(-1.2 * t_rel)
            tone = 0.6 * math.sin(2 * math.pi * freq * t_rel) + 0.3 * math.sin(2 * math.pi * freq * 2 * t_rel)
            samples[i] += tone * env * 0.35
    return samples

def gen_sleep_ambient(duration=8.0):
    """Dreamy evolving ambient space drone with warm pad harmonics"""
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        lfo = 0.5 + 0.5 * math.sin(2 * math.pi * 0.2 * t)
        # D2, A2, D3, F#3 chord with warm phasing
        d2 = math.sin(2 * math.pi * 73.42 * t)
        a2 = math.sin(2 * math.pi * 110.00 * t + 0.3)
        d3 = math.sin(2 * math.pi * 146.83 * t)
        f_sharp = math.sin(2 * math.pi * 185.00 * t + lfo)
        val = (d2 * 0.35 + a2 * 0.3 + d3 * 0.2 + f_sharp * 0.15) * 0.6
        samples.append(val)
    return samples

def gen_sleep_relaxation(duration=8.0):
    """Zen mountain stream: babbling water splashing lightly over smooth river stones"""
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    random.seed(1111)
    prev = 0.0
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        water_swirl = 0.08 + 0.04 * math.sin(2 * math.pi * 1.2 * t)
        noise = random.uniform(-1.0, 1.0)
        prev = prev + water_swirl * (noise - prev)
        bubble = 0.0
        if random.random() < 0.004:
            f_bubble = random.uniform(800, 1600)
            bubble = 0.25 * math.sin(2 * math.pi * f_bubble * t)
        val = (prev * 0.7 + bubble * 0.3) * 0.55
        samples.append(val)
    return samples

def main():
    print("=== Generating Alarmy Sound Assets ===")
    
    # 1. Alarm Sounds
    alarm_generators = {
        "alarm_classic": gen_alarm_classic,
        "alarm_digital": gen_alarm_digital,
        "alarm_siren": gen_alarm_siren,
        "alarm_emergency": gen_alarm_emergency,
        "alarm_bell": gen_alarm_bell,
        "alarm_rooster": gen_alarm_rooster,
        "alarm_birds": gen_alarm_birds,
        "alarm_gentle": gen_alarm_gentle,
        "alarm_piano": gen_alarm_piano,
        "alarm_electronic": gen_alarm_electronic,
    }
    
    for name, gen in alarm_generators.items():
        samples = gen()
        copy_to_destinations(name, samples)
        
    # 2. Sleep Sounds
    sleep_generators = {
        "sleep_rain": gen_sleep_rain,
        "sleep_ocean": gen_sleep_ocean,
        "sleep_forest": gen_sleep_forest,
        "sleep_wind": gen_sleep_wind,
        "sleep_thunderstorm": gen_sleep_thunderstorm,
        "sleep_fireplace": gen_sleep_fireplace,
        "sleep_whitenoise": gen_sleep_whitenoise,
        "sleep_pinknoise": gen_sleep_pinknoise,
        "sleep_brownnoise": gen_sleep_brownnoise,
        "sleep_meditation": gen_sleep_meditation,
        "sleep_piano": gen_sleep_piano,
        "sleep_ambient": gen_sleep_ambient,
        "sleep_relaxation": gen_sleep_relaxation,
    }
    
    for name, gen in sleep_generators.items():
        samples = gen()
        copy_to_destinations(name, samples)
        
    print("\nAll 23 sound assets successfully generated and deployed!")

if __name__ == '__main__':
    main()

