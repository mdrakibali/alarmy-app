#!/usr/bin/env python3
import os
import zlib
import struct
import math
import random

def create_png(width, height, pixel_func, output_path):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # PNG signature
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    
    # IHDR chunk
    # width (4), height (4), bit depth (1: 8-bit), color type (1: 2=RGB), compression (1: 0), filter (1: 0), interlace (1: 0)
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
    png.extend(struct.pack('>I', len(ihdr_data)))
    png.extend(b'IHDR')
    png.extend(ihdr_data)
    png.extend(struct.pack('>I', ihdr_crc))
    
    # Raw uncompressed image data with filter type 0 (None) at the start of each row
    raw_scanlines = bytearray()
    for y in range(height):
        raw_scanlines.append(0) # Filter type 0
        v = y / float(height - 1)
        for x in range(width):
            u = x / float(width - 1)
            r, g, b = pixel_func(u, v, x, y)
            r_c = max(0, min(255, int(r)))
            g_c = max(0, min(255, int(g)))
            b_c = max(0, min(255, int(b)))
            raw_scanlines.extend((r_c, g_c, b_c))
            
    # Compress with zlib
    idat_data = zlib.compress(bytes(raw_scanlines), 6)
    idat_crc = zlib.crc32(b'IDAT' + idat_data)
    png.extend(struct.pack('>I', len(idat_data)))
    png.extend(b'IDAT')
    png.extend(idat_data)
    png.extend(struct.pack('>I', idat_crc))
    
    # IEND chunk
    iend_crc = zlib.crc32(b'IEND')
    png.extend(struct.pack('>I', 0))
    png.extend(b'IEND')
    png.extend(struct.pack('>I', iend_crc))
    
    with open(output_path, 'wb') as f:
        f.write(png)
    print(f"Generated {output_path} ({width}x{height}, {len(png)} bytes)")

W = 360
H = 640

def lerp(c1, c2, t):
    return (
        c1[0] + (c2[0] - c1[0]) * t,
        c1[1] + (c2[1] - c1[1]) * t,
        c1[2] + (c2[2] - c1[2]) * t,
    )

def main():
    dest_dir = "src/assets/images/backgrounds"
    
    # 1. Sunrise: Deep peach to golden yellow
    def sunrise(u, v, x, y):
        top = (255, 120, 80)
        mid = (255, 180, 70)
        bot = (255, 230, 140)
        if v < 0.5:
            return lerp(top, mid, v * 2)
        return lerp(mid, bot, (v - 0.5) * 2)
    create_png(W, H, sunrise, f"{dest_dir}/bg_sunrise.png")
    
    # 2. Sunset: Deep purple to coral rose
    def sunset(u, v, x, y):
        c1 = (43, 20, 84)
        c2 = (142, 45, 110)
        c3 = (255, 107, 107)
        if v < 0.5:
            return lerp(c1, c2, v * 2)
        return lerp(c2, c3, (v - 0.5) * 2)
    create_png(W, H, sunset, f"{dest_dir}/bg_sunset.png")
    
    # 3. Night Sky: Deep indigo with starry noise
    random.seed(42)
    stars = {(random.randint(0, W - 1), random.randint(0, H - 1)): random.randint(180, 255) for _ in range(120)}
    def night_sky(u, v, x, y):
        base = lerp((10, 15, 45), (25, 30, 80), v)
        star = stars.get((x, y), 0)
        if star > 0:
            return (star, star, star)
        return base
    create_png(W, H, night_sky, f"{dest_dir}/bg_night_sky.png")
    
    # 4. Galaxy: Cosmic violet nebula swirl
    def galaxy(u, v, x, y):
        dist = math.sqrt((u - 0.5)**2 + (v - 0.4)**2)
        swirl = math.sin(dist * 12 - math.atan2(v - 0.4, u - 0.5) * 2)
        glow = math.exp(-dist * 2.8)
        r = 30 + 160 * glow + 30 * swirl
        g = 20 + 90 * glow
        b = 60 + 190 * glow + 40 * swirl
        return (r, g, b)
    create_png(W, H, galaxy, f"{dest_dir}/bg_galaxy.png")
    
    # 5. Ocean: Tropical cyan to deep navy
    def ocean(u, v, x, y):
        wave = math.sin(u * 10 + v * 4) * 15
        base = lerp((0, 168, 181), (10, 40, 95), v)
        return (base[0] + wave, base[1] + wave, base[2] + wave)
    create_png(W, H, ocean, f"{dest_dir}/bg_ocean.png")
    
    # 6. Mountains: Lavender mist to deep mountain slate
    def mountains(u, v, x, y):
        c1 = (180, 185, 215)
        c2 = (110, 120, 165)
        c3 = (45, 52, 75)
        if v < 0.4:
            return lerp(c1, c2, v / 0.4)
        return lerp(c2, c3, (v - 0.4) / 0.6)
    create_png(W, H, mountains, f"{dest_dir}/bg_mountains.png")
    
    # 7. Forest: Emerald deep woods
    def forest(u, v, x, y):
        c1 = (20, 60, 45)
        c2 = (40, 110, 75)
        c3 = (15, 45, 30)
        if v < 0.6:
            return lerp(c1, c2, v / 0.6)
        return lerp(c2, c3, (v - 0.6) / 0.4)
    create_png(W, H, forest, f"{dest_dir}/bg_forest.png")
    
    # 8. Minimal: Soft warm slate to calm off-white
    def minimal(u, v, x, y):
        return lerp((240, 243, 246), (225, 230, 238), v)
    create_png(W, H, minimal, f"{dest_dir}/bg_minimal.png")
    
    # 9. Abstract: Vibrant magenta-coral glow
    def abstract(u, v, x, y):
        c1 = (255, 90, 95)
        c2 = (155, 89, 182)
        c3 = (52, 152, 219)
        t = (math.sin(u * 3 + v * 2) + 1) / 2
        return lerp(c1, c2, t)
    create_png(W, H, abstract, f"{dest_dir}/bg_abstract.png")
    
    # 10. Gradient: Alarmy signature Coral Red to Sunrise Gold
    def gradient_brand(u, v, x, y):
        c1 = (255, 56, 92)
        c2 = (255, 128, 64)
        return lerp(c1, c2, (u + v) / 2)
    create_png(W, H, gradient_brand, f"{dest_dir}/bg_gradient.png")
    
    # 11. KPOP Trending: Pastel idol aesthetics (Lavender & Mint)
    def kpop(u, v, x, y):
        c1 = (210, 190, 245)
        c2 = (180, 230, 225)
        return lerp(c1, c2, v)
    create_png(W, H, kpop, f"{dest_dir}/bg_kpop.png")
    
    # 12. Trending Meme / Cats: Warm sunny playful pattern
    def cats(u, v, x, y):
        c1 = (255, 235, 205)
        c2 = (255, 210, 160)
        grid = 40
        is_dot = ((x % grid < 6) and (y % grid < 6))
        base = lerp(c1, c2, v)
        if is_dot:
            return (240, 170, 110)
        return base
    create_png(W, H, cats, f"{dest_dir}/bg_cats.png")

    print("\nAll 12 background wallpapers successfully generated!")

if __name__ == '__main__':
    main()

