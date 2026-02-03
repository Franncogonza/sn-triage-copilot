# Icons for SN Triage Copilot Pro

## 🎨 How to Generate Icons

1. Open `generate-icons.html` (located in the root folder) in your browser
2. Click "📦 Descargar Todos" to download all 3 icons
3. Move the downloaded files to this folder (`src/icons/`)
4. The icons should be named:
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)

## 📋 Icon Specifications

- **16x16**: Toolbar icon (small)
- **48x48**: Extension management page
- **128x128**: Chrome Web Store listing

## 🚀 Design

The icon features:
- Blue gradient background (#2563eb to #1d4ed8)
- White rocket symbol
- Professional and modern look
- Matches the extension's branding

## ✅ Verification

After adding the icons:
1. Reload the extension in Chrome
2. Check the toolbar - should show the rocket icon instead of puzzle piece
3. Go to chrome://extensions - should show the icon in the list
4. The icon should appear in all sizes without pixelation

## 📦 Chrome Web Store Requirements

Chrome Web Store requires:
- At least 128x128 icon for the store listing
- 16x16 and 48x48 for the browser UI
- PNG format
- Transparent or solid background (we use solid blue gradient)

---

**Note:** The `generate-icons.html` file uses Canvas API to generate the icons programmatically, ensuring consistent design across all sizes.
