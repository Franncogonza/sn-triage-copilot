#!/usr/bin/env python3
"""
Generate icons for SN Triage Copilot Pro Chrome Extension
Requires: pip install pillow
"""

from PIL import Image, ImageDraw
import os

def create_icon(size):
    """Create a rocket icon with the specified size"""
    # Create image with blue gradient background
    img = Image.new('RGB', (size, size), color='#2563eb')
    draw = ImageDraw.Draw(img)
    
    # Scale factor
    scale = size / 128
    
    # Draw gradient background (simplified - solid color)
    draw.rectangle([(0, 0), (size, size)], fill='#2563eb')
    
    # Rocket body (white triangle)
    center_x = size // 2
    center_y = size // 2
    
    rocket_points = [
        (center_x, int(center_y - size * 0.35)),  # Top
        (int(center_x + size * 0.15), int(center_y + size * 0.25)),  # Bottom right
        (int(center_x - size * 0.15), int(center_y + size * 0.25))   # Bottom left
    ]
    draw.polygon(rocket_points, fill='white')
    
    # Rocket window (blue circle)
    window_radius = int(size * 0.08)
    window_y = int(center_y - size * 0.15)
    draw.ellipse([
        (center_x - window_radius, window_y - window_radius),
        (center_x + window_radius, window_y + window_radius)
    ], fill='#2563eb')
    
    # Left fin
    left_fin = [
        (int(center_x - size * 0.15), int(center_y + size * 0.1)),
        (int(center_x - size * 0.25), int(center_y + size * 0.25)),
        (int(center_x - size * 0.15), int(center_y + size * 0.25))
    ]
    draw.polygon(left_fin, fill='#e0f2fe')
    
    # Right fin
    right_fin = [
        (int(center_x + size * 0.15), int(center_y + size * 0.1)),
        (int(center_x + size * 0.25), int(center_y + size * 0.25)),
        (int(center_x + size * 0.15), int(center_y + size * 0.25))
    ]
    draw.polygon(right_fin, fill='#e0f2fe')
    
    # Flame (yellow triangle)
    flame = [
        (int(center_x - size * 0.1), int(center_y + size * 0.25)),
        (center_x, int(center_y + size * 0.38)),
        (int(center_x + size * 0.1), int(center_y + size * 0.25))
    ]
    draw.polygon(flame, fill='#fbbf24')
    
    return img

def main():
    """Generate all required icon sizes"""
    sizes = [16, 48, 128]
    output_dir = 'src/icons'
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    print("🚀 Generating icons for SN Triage Copilot Pro...")
    
    for size in sizes:
        icon = create_icon(size)
        filename = f'{output_dir}/icon{size}.png'
        icon.save(filename, 'PNG')
        print(f"✅ Created {filename}")
    
    print("\n✨ All icons generated successfully!")
    print(f"📁 Icons saved in: {output_dir}/")
    print("\n📋 Next steps:")
    print("1. Reload the extension in Chrome")
    print("2. Check that the rocket icon appears instead of the puzzle piece")
    print("3. Ready for Chrome Web Store!")

if __name__ == '__main__':
    try:
        main()
    except ImportError:
        print("❌ Error: Pillow library not found")
        print("📦 Install it with: pip install pillow")
        print("\n💡 Alternative: Open generate-icons.html in your browser")
    except Exception as e:
        print(f"❌ Error: {e}")
