import struct
import zlib
import math

def get_pixel_rgba(x, y, size):
    # Normalized coords [0, 1]
    u = (x + 0.5) / size
    v = (y + 0.5) / size
    
    # Rounded rectangle parameters (rx = 0.25 * size, ~12px on 48px)
    # Distance from center
    cx = 0.5
    cy = 0.5
    half = 0.5
    radius = 0.24
    
    # Distance to rounded box boundary
    # SDF for rounded box
    dx = abs(u - cx) - (half - radius)
    dy = abs(v - cy) - (half - radius)
    
    ax = max(dx, 0.0)
    ay = max(dy, 0.0)
    inside_dist = min(max(dx, dy), 0.0)
    outside_dist = math.sqrt(ax * ax + ay * ay)
    sdf = inside_dist + outside_dist - radius
    
    # Anti-aliasing margin
    pixel_size = 1.0 / size
    edge_alpha = max(0.0, min(1.0, 0.5 - (sdf / pixel_size)))
    
    if edge_alpha <= 0.001:
        return 0, 0, 0, 0

    # Gradient background from indigo-700 to violet-500
    # (u, 1-v) direction from bottom-left to top-right
    t = (u + (1.0 - v)) * 0.5
    t = max(0.0, min(1.0, t))
    
    # #4338ca (67, 56, 202) -> #4f46e5 (79, 70, 229) -> #8b5cf6 (139, 92, 246)
    if t < 0.5:
        sub_t = t * 2.0
        bg_r = 67 + (79 - 67) * sub_t
        bg_g = 56 + (70 - 56) * sub_t
        bg_b = 202 + (229 - 202) * sub_t
    else:
        sub_t = (t - 0.5) * 2.0
        bg_r = 79 + (139 - 79) * sub_t
        bg_g = 70 + (92 - 70) * sub_t
        bg_b = 229 + (246 - 229) * sub_t
        
    # Subtle inner border highlight
    border_dist = abs(sdf + pixel_size * 1.5)
    if border_dist < pixel_size * 1.0:
        highlight = max(0.0, min(1.0, 1.0 - border_dist / (pixel_size * 1.0))) * 0.25 * (1.0 - t * 0.5)
        bg_r = bg_r * (1 - highlight) + 255 * highlight
        bg_g = bg_g * (1 - highlight) + 255 * highlight
        bg_b = bg_b * (1 - highlight) + 255 * highlight

    # Sparkle Star Icon calculation in normalized [0, 1] coords
    # Center of main star is around (0.47, 0.52)
    scx = 0.46
    scy = 0.52
    
    px = u - scx
    py = v - scy
    
    # 4-pointed astroid / pinched star shape
    # Equation: (|x|/a)^0.5 + (|y|/b)^0.5 <= 1
    # Scaled to radius ~ 0.24
    star_radius = 0.23
    core_radius = 0.05
    
    # Check main 4-pointed sparkle
    dist_sq = px * px + py * py
    dist = math.sqrt(dist_sq)
    
    is_star = 0.0
    if abs(px) < star_radius and abs(py) < star_radius:
        # Evaluate concave pinched shape
        nx = abs(px) / star_radius
        ny = abs(py) / star_radius
        val = math.sqrt(nx) + math.sqrt(ny)
        if val <= 1.05:
            # Inside star
            edge_dist = (1.05 - val)
            is_star = max(0.0, min(1.0, edge_dist * 8.0))
            
    # Small satellite star at top right: (0.75, 0.26)
    sat_x = u - 0.74
    sat_y = v - 0.26
    is_sat = 0.0
    if abs(sat_x) < 0.12 and abs(sat_y) < 0.12:
        # Plus-like cross
        cross_w = 0.022
        cross_l = 0.075
        if (abs(sat_x) <= cross_w and abs(sat_y) <= cross_l) or (abs(sat_y) <= cross_w and abs(sat_x) <= cross_l):
            is_sat = 1.0
            
    # Small blue accent dot at bottom left: (0.24, 0.76)
    dot_x = u - 0.23
    dot_y = v - 0.76
    dot_dist = math.sqrt(dot_x * dot_x + dot_y * dot_y)
    dot_radius = 0.046
    is_dot = max(0.0, min(1.0, (dot_radius - dot_dist) / pixel_size))

    # Composite layers
    r = bg_r
    g = bg_g
    b = bg_b
    
    # Apply dot (sky-400: #38bdf8 = 56, 189, 248)
    if is_dot > 0:
        r = r * (1 - is_dot) + 56 * is_dot
        g = g * (1 - is_dot) + 189 * is_dot
        b = b * (1 - is_dot) + 248 * is_dot
        
    # Apply satellite sparkle (indigo-100: #e0e7ff = 224, 231, 255)
    if is_sat > 0:
        r = r * (1 - is_sat) + 224 * is_sat
        g = g * (1 - is_sat) + 231 * is_sat
        b = b * (1 - is_sat) + 255 * is_sat
        
    # Apply main star (pure white #ffffff)
    if is_star > 0:
        r = r * (1 - is_star) + 255 * is_star
        g = g * (1 - is_star) + 255 * is_star
        b = b * (1 - is_star) + 255 * is_star
        
    return int(round(r)), int(round(g)), int(round(b)), int(round(edge_alpha * 255))

def create_png_bytes(width, height):
    raw_bytes = bytearray()
    for y in range(height):
        raw_bytes.append(0)  # filter type 0 (None)
        for x in range(width):
            r, g, b, a = get_pixel_rgba(x, y, width)
            raw_bytes.extend([r, g, b, a])
            
    compressed = zlib.compress(bytes(raw_bytes), 9)
    
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    
    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
    png.extend(struct.pack('>I', 13) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc))
    
    # IDAT
    idat_crc = zlib.crc32(b'IDAT' + compressed)
    png.extend(struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', idat_crc))
    
    # IEND
    iend_crc = zlib.crc32(b'IEND')
    png.extend(struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc))
    
    return bytes(png)

def create_ico_bytes(png_images):
    # ICO header: 0x0000 (reserved), 0x0001 (icon type), count (2 bytes)
    num_images = len(png_images)
    header = struct.pack('<HHH', 0, 1, num_images)
    
    offset = 6 + (16 * num_images)
    directory = bytearray()
    image_data = bytearray()
    
    for width, height, data in png_images:
        w_byte = 0 if width >= 256 else width
        h_byte = 0 if height >= 256 else height
        size = len(data)
        
        # 16-byte ICONDIRENTRY:
        # width, height, colors(0), reserved(0), planes(1), bpp(32), size(4 bytes), offset(4 bytes)
        entry = struct.pack('<BBBBHHII', w_byte, h_byte, 0, 0, 1, 32, size, offset)
        directory.extend(entry)
        image_data.extend(data)
        offset += size
        
    return header + directory + image_data

# Generate 48x48 (standard high-res favicon)
png_48 = create_png_bytes(48, 48)
with open('public/favicon-48x48.png', 'wb') as f:
    f.write(png_48)

# Generate 32x32
png_32 = create_png_bytes(32, 32)
with open('public/favicon-32x32.png', 'wb') as f:
    f.write(png_32)

# Generate 16x16
png_16 = create_png_bytes(16, 16)
with open('public/favicon-16x16.png', 'wb') as f:
    f.write(png_16)

# Generate 180x180 (Apple touch icon)
png_180 = create_png_bytes(180, 180)
with open('public/apple-touch-icon.png', 'wb') as f:
    f.write(png_180)

# Generate 192x192 (Android / PWA)
png_192 = create_png_bytes(192, 192)
with open('public/icon-192.png', 'wb') as f:
    f.write(png_192)

# Generate 512x512 (High res / PWA splash)
png_512 = create_png_bytes(512, 512)
with open('public/icon-512.png', 'wb') as f:
    f.write(png_512)

# Generate standard multi-resolution favicon.ico containing 16x16, 32x32, 48x48
ico = create_ico_bytes([
    (16, 16, png_16),
    (32, 32, png_32),
    (48, 48, png_48)
])
with open('public/favicon.ico', 'wb') as f:
    f.write(ico)

print('Successfully generated all high-resolution favicon files!')
