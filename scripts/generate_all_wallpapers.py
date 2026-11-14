#!/usr/bin/env python3
import os
import math
import random
from gif_encoder import write_animated_gif

WIDTH = 180
HEIGHT = 320
NUM_FRAMES = 8

def make_palette_and_frames(generator_func):
    """
    generator_func(frame_idx, total_frames, u, v, x, y) returns (r, g, b)
    Quantizes to standard 216-color Web-safe cube + 40 shades of grey.
    """
    palette = []
    for r in range(6):
        for g in range(6):
            for b in range(6):
                palette.append((r * 51, g * 51, b * 51))
                
    for i in range(40):
        val = int(i * 255 / 39)
        palette.append((val, val, val))
        
    def find_closest_color(r, g, b):
        r_i = max(0, min(5, int(round(r / 51.0))))
        g_i = max(0, min(5, int(round(g / 51.0))))
        b_i = max(0, min(5, int(round(b / 51.0))))
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

def generate_gif(filepath, generator_func, delay_cs=12):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    palette, frames = make_palette_and_frames(generator_func)
    write_animated_gif(filepath, WIDTH, HEIGHT, palette, frames, delay_cs)

def main():
    base = "src/assets/wallpapers"
    print("=== Generating 24 Curated Animated GIF Wallpapers ===")

    # 1. KPOP Trending
    def kpop_stage(f, total, u, v, x, y):
        p = (f / total) * 2 * math.pi
        pulse = 0.5 + 0.5 * math.sin(p)
        c1 = (220, 185, 250)
        c2 = (175, 235, 225)
        t = v + math.sin(u * 4 + p) * 0.1
        r = c1[0] + (c2[0] - c1[0]) * t
        g = c1[1] + (c2[1] - c1[1]) * t
        b = c1[2] + (c2[2] - c1[2]) * t
        hx = 0.5 + math.sin(p) * 0.15
        hy = 0.4 + math.cos(p) * 0.1
        if math.sqrt((u - hx)**2 + (v - hy)**2) < 0.08:
            return (255, 120, 180)
        return (r, g, b)
    generate_gif(f"{base}/kpop/kpop_stage.gif", kpop_stage)

    def kpop_heart(f, total, u, v, x, y):
        p = (f / total) * 2 * math.pi
        beat = 1.0 + 0.15 * math.sin(p)
        cx, cy = u - 0.5, v - 0.45
        dist = math.sqrt(cx*cx + cy*cy) / beat
        bg_r = int(40 + v * 30)
        bg_g = int(20 + v * 15)
        bg_b = int(60 + v * 50)
        if dist < 0.2:
            return (255, 105, 180)
        elif dist < 0.24:
            return (255, 182, 193)
        return (bg_r, bg_g, bg_b)
    generate_gif(f"{base}/kpop/kpop_heart.gif", kpop_heart)

    # 2. Trending
    def trending_dancing_cat(f, total, u, v, x, y):
        p = (f / total) * 2 * math.pi
        bounce = math.sin(p) * 0.05
        sway = math.cos(p) * 0.04
        gx = (u * 4 + sway) % 1.0
        gy = (v * 5 + bounce) % 1.0
        bg_r, bg_g, bg_b = 250 - int(v * 40), 210 - int(v * 50), 140
        dx, dy = gx - 0.5, gy - 0.5
        dist = math.sqrt(dx*dx + dy*dy)
        is_ear = (abs(dx) > 0.15 and abs(dx) < 0.28 and -0.32 < dy < -0.15)
        if dist < 0.22 or is_ear:
            return (255, 250, 240)
        elif dist < 0.25:
            return (220, 160, 90)
        return (bg_r, bg_g, bg_b)
    generate_gif(f"{base}/trending/trending_dancing_cat.gif", trending_dancing_cat)

    def trending_glitch(f, total, u, v, x, y):
        p = (f / total) * 2 * math.pi
        shift = math.sin(v * 20 + p) * 0.05
        grid_u = (u + shift) % 1.0
        r = int(128 + 127 * math.sin(grid_u * 10 + p))
        g = int(50 + 40 * math.cos(v * 15))
        b = int(180 + 75 * math.cos(grid_u * 8 - p))
        return (r, g, b)
    generate_gif(f"{base}/trending/trending_glitch.gif", trending_glitch)

    # 3. Daily Motivation
    def motivation_sunrise(f, total, u, v, x, y):
        p = (f / total) * 2 * math.pi
        pulse = 0.5 + 0.5 * math.sin(p)
        dx, dy = u - 0.5, v - 0.65
        dist = math.sqrt(dx*dx + dy*dy)
        angle = math.atan2(dy, dx)
        ray = math.sin(angle * 12 + p) * 0.15
        sun_glow = math.exp(-dist * 2.2) * (1.0 + 0.15 * pulse)
        r = min(255, int(255 * sun_glow + 230 * (1.0 - v)))
        g = min(255, int(180 * sun_glow + 120 * (1.0 - v)))
        b = min(255, int(90 * sun_glow + 60 * (1.0 - v) + 20 * ray))
        return (r, g, b)
    generate_gif(f"{base}/motivation/motivation_sunrise.gif", motivation_sunrise)

    def motivation_fire(f, total, u, v, x, y):
        p = (f / total) * 2 * math.pi
        flame_y = v + math.sin(u * 10 + p * 2) * 0.05 + math.cos(u * 15 - p) * 0.03
        r = min(255, int(255 * (1.0 - flame_y * 0.6)))
        g = min(255, int(180 * max(0.0, 1.0 - flame_y * 1.5)))
        b = 20
        if flame_y > 0.8:
            return (40, 15, 10)
        return (r, g, b)
    generate_gif(f"{base}/motivation/motivation_fire.gif", motivation_fire)

    # 4. Anime
    def anime_sakura(f, total, u, v, x, y):
        p = (f / total) * 2 * math.pi
        petal_u = (u + (f / total) * 0.5 + math.sin(v * 6 + p) * 0.08) % 1.0
        petal_v = (v + (f / total) * 0.6) % 1.0
        bg_r, bg_g, bg_b = 250, 225, 235
        # Petal shape check
        dx = (petal_u * 5) % 1.0 - 0.5
        dy = (petal_v * 7) % 1.0 - 0.5
        if math.sqrt(dx*dx + dy*dy) < 0.15:
            return (255, 150, 180)
        return (bg_r, bg_g, bg_b)
    generate_gif(f"{base}/anime/anime_sakura.gif", anime_sakura)

    def anime_speed_lines(f, total, u, v, x, y):
        p = (f / total) * 2 * math.pi
        cx, cy = u - 0.5, v - 0.5
        angle = math.atan2(cy, cx)
        dist = math.sqrt(cx*cx + cy*cy)
        line = math.sin(angle * 24 + p * 3)
        if dist > 0.2 and line > 0.6:
            return (255, 255, 255)
        bg = int(20 + dist * 60)
        return (bg, bg + 10, bg + 40)
    generate_gif(f"{base}/anime/anime_speed_lines.gif", anime_speed_lines)

    # 5. Cute Animals
    def animals_corgi(f, total, u, v, x, y):
        p = (f / total) * 2 * math.pi
        bob = math.sin(p) * 0.04
        dx, dy = u - 0.5, (v - 0.5 + bob)
        dist = math.sqrt(dx*dx + dy*dy)
        bg_r, bg_g, bg_b = 255, 240, 215
        # Face oval
        if dist < 0.22:
            return (230, 140, 50)  # Corgi golden brown
        elif dist < 0.28 and dy > 0:
            return (255, 255, 255) # White muzzle
        return (bg_r, bg_g, bg_b)
    generate_gif(f"{base}/animals/animals_corgi.gif", animals_corgi)

    def animals_sleepy_fox(f, total, u, v, x, y):
        p = (f / total) * 2 * math.pi
        breathe = math.sin(p) * 0.02
        dx, dy = u - 0.5, v - 0.55
        dist = math.sqrt(dx*dx + dy*dy) / (1.0 + breathe)
        bg_r, bg_g, bg_b = 30, 35, 65
        if dist < 0.22:
            return (235, 95, 30) # Fox rust orange
        elif dist < 0.27 and dy > 0.05:
            return (255, 245, 230) # White tail tip
        return (bg_r, bg_g, bg_b)
    generate_gif(f"{base}/animals/animals_sleepy_fox.gif", animals_sleepy_fox)

    # 6. Funny Memes
    def memes_screaming_cat(f, total, u, v, x, y):
        p = (f / total) * 2 * math.pi
        jitter_x = math.sin(p * 4) * 0.03
        jitter_y = math.cos(p * 4) * 0.03
        dx, dy = u - 0.5 + jitter_x, v - 0.5 + jitter_y
        dist = math.sqrt(dx*dx + dy*dy)
        # Psychedelic background strobe
        bg_r = int(128 + 127 * math.sin(p + v * 4))
        bg_g = int(128 + 127 * math.sin(p + 2 + u * 4))
        bg_b = int(128 + 127 * math.sin(p + 4))
        if dist < 0.22:
            return (255, 255, 255) # White cat face
        if dist < 0.28:
            return (200, 50, 50)
        return (bg_r, bg_g, bg_b)
    generate_gif(f"{base}/memes/memes_screaming_cat.gif", memes_screaming_cat)

    def memes_party_parrot(f, total, u, v, x, y):
        p = (f / total) * 2 * math.pi
        hue = (f / total) * 6.0
        # Color shifting disco
        r = int(128 + 127 * math.sin(p))
        g = int(128 + 127 * math.sin(p + 2.0))
        b = int(128 + 127 * math.sin(p + 4.0))
        cx, cy = (u * 3) % 1.0 - 0.5, (v * 4) % 1.0 - 0.5
        if math.sqrt(cx*cx + cy*cy) < 0.25:
            return (r, g, b)
        return (20, 20, 30)
    generate_gif(f"{base}/memes/memes_party_parrot.gif", memes_party_parrot)

    # 7. Nature
    def nature_ocean_waves(f, total, u, v, x, y):
        p = (f / total) * 2 * math.pi
        w1 = math.sin(u * 12 + p) * 0.04
        w2 = math.cos(u * 8 - p * 1.5) * 0.03
        yw = v + w1 + w2
        r = int(10 + yw * 40)
        g = int(120 + (1.0 - yw) * 100)
        b = int(160 + (1.0 - yw) * 80)
        if 0.38 < yw < 0.43 and math.sin(u * 16 + p * 2) > 0.25:
            return (245, 255, 255)
        return (r, g, b)
    generate_gif(f"{base}/nature/nature_ocean_waves.gif", nature_ocean_waves)

    def nature_forest_rain(f, total, u, v, x, y):
        p = (f / total) * 2 * math.pi
        rain_y = (v * 10 + (f / total) * 10) % 1.0
        bg_r, bg_g, bg_b = 20 + int(v * 20), 60 + int(v * 40), 40 + int(v * 20)
        if rain_y < 0.15 and (int(u * 30) % 3 == 0):
            return (180, 230, 220)
        return (bg_r, bg_g, bg_b)
    generate_gif(f"{base}/nature/nature_forest_rain.gif", nature_forest_rain)

    # 8. Aesthetic
    def aesthetic_vaporwave(f, total, u, v, x, y):
        p = (f / total) * 2 * math.pi
        # Neon grid floor
        if v > 0.55:
            grid_v = (v - 0.55) / 0.45
            wire_h = (grid_v * 8 + (f / total) * 2) % 1.0
            wire_w = (u * 12) % 1.0
            if wire_h < 0.1 or wire_w < 0.08:
                return (0, 255, 255) # Cyan grid lines
            return (30, 10, 50)
        # Sunset horizon
        dist = math.sqrt((u - 0.5)**2 + (v - 0.5)**2)
        if dist < 0.2:
            return (255, 220, 50) # Retro sun
        return (int(120 + v * 100), int(20 + v * 40), int(140 + v * 60))
    generate_gif(f"{base}/aesthetic/aesthetic_vaporwave.gif", aesthetic_vaporwave)

    def aesthetic_pastel_clouds(f, total, u, v, x, y):
        p = (f / total) * 2 * math.pi
        drift = math.sin(u * 3 + p) * 0.1 + math.cos(v * 4 + p) * 0.08
        r = int(240 + drift * 15)
        g = int(200 + math.sin(p) * 20)
        b = int(230 + math.cos(p) * 25)
        return (r, g, b)
    generate_gif(f"{base}/aesthetic/aesthetic_pastel_clouds.gif", aesthetic_pastel_clouds)

    # 9. Galaxy
    def galaxy_nebula_swirl(f, total, u, v, x, y):
        p = (f / total) * 2 * math.pi
        cx, cy = u - 0.5, v - 0.4
        dist = math.sqrt(cx*cx + cy*cy)
        angle = math.atan2(cy, cx) + p
        swirl = math.sin(dist * 14 - angle * 2)
        glow = math.exp(-dist * 3.0)
        r = 30 + 170 * glow + 35 * swirl
        g = 20 + 80 * glow
        b = 70 + 185 * glow + 45 * swirl
        return (r, g, b)
    generate_gif(f"{base}/galaxy/galaxy_nebula_swirl.gif", galaxy_nebula_swirl)

    def galaxy_shooting_star(f, total, u, v, x, y):
        p = (f / total) * 2 * math.pi
        star_x = (f / total) * 1.5 - 0.2
        star_y = star_x * 0.7
        dx, dy = u - star_x, v - star_y
        dist = math.sqrt(dx*dx + dy*dy)
        bg = (15, 20, 48)
        if dist < 0.04:
            return (255, 255, 255)
        elif dist < 0.1 and dx < 0 and dy < 0:
            return (180, 210, 255) # Trail
        return bg
    generate_gif(f"{base}/galaxy/galaxy_shooting_star.gif", galaxy_shooting_star)

    # 10. Love & Romance
    def romance_floating_hearts(f, total, u, v, x, y):
        p = (f / total) * 2 * math.pi
        drift_y = (v + (f / total) * 0.8) % 1.0
        drift_x = u + math.sin(drift_y * 8 + p) * 0.05
        dx = (drift_x * 4) % 1.0 - 0.5
        dy = (drift_y * 5) % 1.0 - 0.5
        if math.sqrt(dx*dx + dy*dy) < 0.18:
            return (255, 75, 110)
        return (35, 15, 25)
    generate_gif(f"{base}/romance/romance_floating_hearts.gif", romance_floating_hearts)

    def romance_candlelight(f, total, u, v, x, y):
        p = (f / total) * 2 * math.pi
        flicker = 1.0 + math.sin(p * 3) * 0.12
        cx, cy = u - 0.5, v - 0.55
        dist = math.sqrt(cx*cx + cy*cy) / flicker
        glow = math.exp(-dist * 3.5)
        r = min(255, int(255 * glow + 40))
        g = min(255, int(150 * glow + 20))
        b = min(255, int(40 * glow + 15))
        return (r, g, b)
    generate_gif(f"{base}/romance/romance_candlelight.gif", romance_candlelight)

    # 11. Gaming
    def gaming_pixel_dungeon(f, total, u, v, x, y):
        p = (f / total) * 2 * math.pi
        coin_spin = abs(math.cos(p)) * 0.12
        cx, cy = u - 0.5, v - 0.45
        if abs(cx) < coin_spin and abs(cy) < 0.14:
            return (255, 215, 0) # Gold coin
        brick_x = int(u * 12) % 2
        brick_y = int(v * 20) % 2
        val = 30 + (brick_x ^ brick_y) * 15
        return (val, val + 5, val + 15)
    generate_gif(f"{base}/gaming/gaming_pixel_dungeon.gif", gaming_pixel_dungeon)

    def gaming_cyber_grid(f, total, u, v, x, y):
        p = (f / total) * 2 * math.pi
        pulse = math.sin((u + v) * 10 - p * 2)
        if pulse > 0.6:
            return (0, 255, 180) # Cyber neon green/cyan
        return (10, 20, 30)
    generate_gif(f"{base}/gaming/gaming_cyber_grid.gif", gaming_cyber_grid)

    # 12. Minimal Animation
    def minimal_pulse_circle(f, total, u, v, x, y):
        p = (f / total) * 2 * math.pi
        radius = 0.2 + 0.05 * math.sin(p)
        dist = math.sqrt((u - 0.5)**2 + (v - 0.5)**2)
        if abs(dist - radius) < 0.015:
            return (255, 56, 92) # Alarmy coral circle
        return (245, 247, 250)
    generate_gif(f"{base}/minimal/minimal_pulse_circle.gif", minimal_pulse_circle)

    def minimal_gradient_drift(f, total, u, v, x, y):
        p = (f / total) * 2 * math.pi
        t = (u + v + math.sin(p) * 0.2) / 2.2
        c1 = (235, 240, 245)
        c2 = (215, 225, 238)
        r = c1[0] + (c2[0] - c1[0]) * t
        g = c1[1] + (c2[1] - c1[1]) * t
        b = c1[2] + (c2[2] - c1[2]) * t
        return (r, g, b)
    generate_gif(f"{base}/minimal/minimal_gradient_drift.gif", minimal_gradient_drift)

    print("\nAll 24 Animated GIF Wallpapers generated successfully!")

if __name__ == '__main__':
    main()
