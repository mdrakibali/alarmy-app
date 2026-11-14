#!/usr/bin/env python3
import struct

def lzw_compress(data, min_code_size):
    clear_code = 1 << min_code_size
    end_code = clear_code + 1
    
    code_size = min_code_size + 1
    max_code = (1 << code_size) - 1
    
    table = {bytes([i]): i for i in range(clear_code)}
    next_code = end_code + 1
    
    out_bits = []
    
    def emit(code):
        for i in range(code_size):
            out_bits.append((code >> i) & 1)

    emit(clear_code)
    
    pattern = bytearray()
    for byte in data:
        pattern.append(byte)
        p_bytes = bytes(pattern)
        if p_bytes in table:
            continue
        else:
            emit(table[bytes(pattern[:-1])])
            if next_code <= 4095:
                table[p_bytes] = next_code
                next_code += 1
                if next_code > max_code and code_size < 12:
                    code_size += 1
                    max_code = (1 << code_size) - 1
            else:
                emit(clear_code)
                table = {bytes([i]): i for i in range(clear_code)}
                next_code = end_code + 1
                code_size = min_code_size + 1
                max_code = (1 << code_size) - 1
            pattern = bytearray([byte])
            
    if pattern:
        emit(table[bytes(pattern)])
    emit(end_code)
    
    # Pack bits into bytes
    byte_array = bytearray()
    for i in range(0, len(out_bits), 8):
        byte = 0
        for b in range(min(8, len(out_bits) - i)):
            byte |= (out_bits[i + b] << b)
        byte_array.append(byte)
        
    # Chunk into blocks of at most 254 bytes
    res = bytearray()
    for i in range(0, len(byte_array), 254):
        chunk = byte_array[i:i + 254]
        res.append(len(chunk))
        res.extend(chunk)
    res.append(0)  # Block terminator
    return res

def write_animated_gif(filename, width, height, palette, frames, delay_cs=15):
    """
    palette: list of (r, g, b) tuples (must be power of 2, up to 256)
    frames: list of lists/bytearrays of length width * height (each element is an index into palette)
    delay_cs: frame delay in centiseconds (1/100 sec, so 15 = 150ms)
    """
    assert len(palette) <= 256
    # Pad palette to 256
    pal_len = 256
    padded_palette = list(palette) + [(0, 0, 0)] * (pal_len - len(palette))
    
    gif = bytearray(b'GIF89a')
    
    # Logical screen descriptor: width, height, packed, bg index, aspect ratio
    # packed: 1 (global color table flag) | 7 (color resolution 8-bit) | 0 (sort flag) | 7 (256 colors: 2^(7+1))
    gif.extend(struct.pack('<HHBBB', width, height, 0xF7, 0, 0))
    
    # Global color table
    for r, g, b in padded_palette:
        gif.extend((r, g, b))
        
    # Netscape loop 2.0 extension
    gif.extend(b'\x21\xFF\x0B' + b'NETSCAPE2.0' + b'\x03\x01\x00\x00\x00')
    
    min_code_size = 8
    
    for frame_indices in frames:
        # Graphic control extension: delay, no transparency
        # Delay in 1/100 sec
        gif.extend(b'\x21\xF9\x04\x00')
        gif.extend(struct.pack('<H', delay_cs))
        gif.extend(b'\x00\x00')
        
        # Image descriptor: left=0, top=0, width, height, packed=0
        gif.extend(b'\x2C' + struct.pack('<HHHHB', 0, 0, width, height, 0))
        
        # LZW image data
        gif.append(min_code_size)
        compressed = lzw_compress(frame_indices, min_code_size)
        gif.extend(compressed)
        
    gif.append(0x3B)  # Trailer
    
    with open(filename, 'wb') as f:
        f.write(gif)
    print(f"Successfully generated animated GIF {filename} ({width}x{height}, {len(frames)} frames, {len(gif)} bytes)")

print("LZW GIF encoder ready")

