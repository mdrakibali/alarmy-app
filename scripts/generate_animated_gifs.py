#!/usr/bin/env python3
import os
import math
import random
from gif_encoder import write_animated_gif

WIDTH = 180
HEIGHT = 320
NUM_FRAMES = 8  # 8 frames per animation for smooth loops and compact size

def make_palette_and_frames(generator_func):
    """
    generator_func(frame_idx, total_frames, u, v, x, y) returns (r, g, b)
    Quantizes to a 216-color Web-safe palette (6x6x6 RGB cube) + 16 custom greys/colors
    """
    # 6x6x6 color cube = 216 colors
    palette = []
    for r in range(6):
        for g in range(6):
            for b in range(6):
                palette.append((r * 51, g * 51, b * 51))
                
    # Extra 40 specialized tints
    for i in range(40):
        val = int(i * 255 / 39)
        palette.append((val, val, val))
        
    def find_closest_color(r, g, b):
        # Direct math lookup into 6x6x6 cube
        r_i = int(round(r / 51.0))
        g_i = int(round(g / 51.0))
        b_i = int(round(b / 51.0))
        r_i = max(0, min(5, r_i))
        g_i = max(0, min(5, g_i))
        b_i = max(0, min(5, b_i))
        return r_i * 36 + g_i * 6 + b_i

    frames = []
    for f in range(NUM_FRAMES):
        frame_bytes = bytearray()
        for y in range(HEIGHT):
            v = y / float(HEIGHT - 1)
            for x in range(WIDTH):
                u = x / float(WIDTH - 1)
                r, g, b = generator_func(f, NUM_FRAMES, u, v, x, y)
                r = max(0, min(255, int(r)))
                g = max(0, min(255, int(g)))
                b = max(0, min(255, int(b)))
                frame_bytes.append(find_closest_color(r, g, b))
        frames.append(frame_bytes)
        
    return palette, frames

def main():
    dest_dir = "src/assets/images/backgrounds"
    os.makedirs(dest_dir, exist_ok=True)
    
    print("=== Generating Animated GIF Background Wallpapers ===")
    
    # 1. Dancing Cat (Warm playful dancing vibe with bouncing animations)
    def gen_cat(f, total, u, v, x, y):
        phase = (f / total) * 2 * math.pi
        # Bouncing dance displacement
        bounce_y = math.sin(phase) * 0.05
        sway_x = math.cos(phase) * 0.04
        
        # Grid of dancing cats
        grid_x = (u * 4 + sway_x) % 1.0
        grid_y = (v * 5 + bounce_y) % 1.0
        
        # Background gradient: warm gold
        bg_r = 250 - int(v * 40)
        bg_g = 210 - int(v * 50)
        bg_b = 140
        
        # Simple cute cat face silhouette
        dx = grid_x - 0.5
        dy = grid_y - 0.5
        dist = math.sqrt(dx*dx + dy*dy)
        
        # Cat ears
        is_ear = (abs(dx) > 0.15 and abs(dx) < 0.28 and dy < -0.15 and dy > -0.32)
        if dist < 0.22 or is_ear:
            # White/cream cat body
            return (255, 250, 240)
        elif dist < 0.25:
            # Subtle warm outline
            return (220, 160, 90)
        return (bg_r, bg_g, bg_b)
        
    pal, frames = make_palette_and_frames(gen_cat)
    write_animated_gif(f"{dest_dir}/bg_cats.gif", WIDTH, HEIGHT, pal, frames, delay_cs=12)

    # 2. Cosmic Galaxy (Rotating, glowing cosmic nebula swirl)
    def gen_galaxy(f, total, u, v, x, y):
        phase = (f / total) * 2 * math.pi
        cx = u - 0.5
        cy = v - 0.4
        dist = math.sqrt(cx*cx + cy*cy)
        angle = math.atan2(cy, cx) + phase
        
        swirl = math.sin(dist * 14 - angle * 2)
        glow = math.exp(-dist * 3.0)
        
        r = 30 + 170 * glow + 35 * swirl
        g = 20 + 80 * glow
        b = 70 + 185 * glow + 45 * swirl
        return (r, g, b)
        
    pal, frames = make_palette_and_frames(gen_galaxy)
    write_animated_gif(f"{dest_dir}/bg_galaxy.gif", WIDTH, HEIGHT, pal, frames, delay_cs=12)

    # 3. Ocean Waves (Rhythmic flowing turquoise sea waves)
    def gen_ocean(f, total, u, v, x, y):
        phase = (f / total) * 2 * math.pi
        wave1 = math.sin(u * 12 + phase) * 0.04
        wave2 = math.cos(u * 8 - phase * 1.5) * 0.03
        y_wave = v + wave1 + wave2
        
        # Deep navy to tropical cyan
        r = int(10 + y_wave * 40)
        g = int(120 + (1.0 - y_wave) * 100)
        b = int(160 + (1.0 - y_wave) * 80)
        
        # White foam crests
        foam = math.sin(u * 16 + phase * 2)
        if 0.38 < y_wave < 0.42 and foam > 0.3:
            return (240, 255, 255)
        return (r, g, b)
        
    pal, frames = make_palette_and_frames(gen_ocean)
    write_animated_gif(f"{dest_dir}/bg_ocean.gif", WIDTH, HEIGHT, pal, frames, delay_cs=14)

    # 4. Golden Sunrise (Radiant pulsating sun rays)
    def gen_sunrise(f, total, u, v, x, y):
        phase = (f / total) * 2 * math.pi
        pulse = 0.5 + 0.5 * math.sin(phase)
        
        sun_x = 0.5
        sun_y = 0.65
        dx = u - sun_x
        dy = v - sun_y
        dist = math.sqrt(dx*dx + dy*dy)
        angle = math.atan2(dy, dx)
        
        ray = math.sin(angle * 12 + phase) * 0.15
        sun_glow = math.exp(-dist * 2.2) * (1.0 + 0.15 * pulse)
        
        r = min(255, int(255 * sun_glow + 230 * (1.0 - v)))
        g = min(255, int(180 * sun_glow + 120 * (1.0 - v)))
        b = min(255, int(90 * sun_glow + 60 * (1.0 - v) + 20 * ray))
        return (r, g, b)
        
    pal, frames = make_palette_and_frames(gen_sunrise)
    write_animated_gif(f"{dest_dir}/bg_sunrise.gif", WIDTH, HEIGHT, pal, frames, delay_cs=14)

    # 5. Starry Night Sky (Twinkling stars and soft aurora drift)
    random.seed(999)
    stars_coords = [(random.random(), random.random(), random.uniform(0.5, 1.0)) for _ in range(60)]
    def gen_night(f, total, u, v, x, y):
        phase = (f / total) * 2 * math.pi
        
        # Midnight deep indigo gradient
        base_r = int(12 + v * 25)
        base_g = int(18 + v * 30)
        base_b = int(45 + v * 50)
        
        # Soft aurora green/violet wave
        aurora = math.sin(u * 5 + phase) * 0.1
        if 0.25 + aurora < v < 0.45 + aurora:
            intensity = math.sin((v - (0.25 + aurora)) / 0.2 * math.pi) * 40
            base_g += int(intensity * 1.2)
            base_b += int(intensity * 0.8)
            
        # Check closest star
        for sx, sy, brightness in stars_coords:
            if abs(u - sx) < 0.012 and abs(v - sy) < 0.008:
                twinkle = 0.5 + 0.5 * math.sin(phase * 2 + sx * 20)
                st_val = int(255 * brightness * twinkle)
                return (st_val, st_val, st_val)
                
        return (base_r, base_g, base_b)
        
    pal, frames = make_palette_and_frames(gen_night)
    write_animated_gif(f"{dest_dir}/bg_night_sky.gif", WIDTH, HEIGHT, pal, frames, delay_cs=12)

    # 6. K-Pop Pastel & Aesthetic Glow (Pulsing neon hearts & stage lights)
    def gen_kpop(f, total, u, v, x, y):
        phase = (f / total) * 2 * math.pi
        pulse = 0.5 + 0.5 * math.sin(phase)
        
        c1 = (220, 185, 250) # Pastel Lavender
        c2 = (175, 235, 225) # Pastel Mint
        t = (v + math.sin(u * 4 + phase) * 0.1)
        r = c1[0] + (c2[0] - c1[0]) * t
        g = c1[1] + (c2[1] - c1[1]) * t
        b = c1[2] + (c2[2] - c1[2]) * t
        
        # Floating heart sparkle
        hx = 0.5 + math.sin(phase) * 0.15
        hy = 0.4 + math.cos(phase) * 0.1
        h_dist = math.sqrt((u - hx)**2 + (v - hy)**2)
        if h_dist < 0.08:
            return (255, 120, 180)
        return (r, g, b)
        
    pal, frames = make_palette_and_frames(gen_kpop)
    write_animated_gif(f"{dest_dir}/bg_kpop.gif", WIDTH, HEIGHT, pal, frames, delay_cs=12)

    print("\nAll animated GIF wallpapers successfully generated!")

if __name__ == '__main__':
    main()

