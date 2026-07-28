# ChoreQuest PWA Required Assets Reference Plan

Below is the complete list of required PWA image assets for **ChoreQuest**, including recommended file naming, exact dimensions, image format, manifest purpose, primary usage, and key design restrictions & tips.

## Required PWA Assets & Design Guidelines Table

| Asset Filename                  | Recommended Size | Format    | Manifest `purpose` | Primary Purpose & Usage                                                        | Key Design Restrictions & Tips                                                                                                                                                          |
| :------------------------------ | :--------------- | :-------- | :----------------- | :----------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`icon.png`**                  | `1024 × 1024 px` | PNG       | N/A (Master)       | High-res master source graphic for generating all icon sizes.                  | • **Square 1:1 ratio**, uncompressed 24-bit PNG.<br>• Avoid fine text/thin lines that get lost when downscaled.<br>• Use rich edge-to-edge background gradient (`#4f46e5`).             |
| **`pwa-192x192.png`**           | `192 × 192 px`   | PNG       | `"any"`            | Standard PWA icon for Android app launcher, task switcher & home screen.       | • Exact 192x192 px dimensions.<br>• Keep main emblem centered.<br>• High contrast for visibility on dark/light wallpapers.                                                              |
| **`pwa-512x512.png`**           | `512 × 512 px`   | PNG       | `"any"`            | High-res PWA icon for splash screens, app install prompts & store banners.     | • Exact 512x512 px dimensions.<br>• Used as the main splash screen hero graphic.<br>• Crisp, bold RPG emblem.                                                                           |
| **`maskable-icon-192x192.png`** | `192 × 192 px`   | PNG       | `"maskable"`       | Android adaptive icon with 20% safe-zone padding (fits circle/squircle masks). | • **Inner 80% Safe Zone**: Keep logo inside 153x153 px center circle.<br>• **Full Bleed Background**: Background color MUST fill outer edges (no transparent corners or black borders). |
| **`maskable-icon-512x512.png`** | `512 × 512 px`   | PNG       | `"maskable"`       | High-res Android adaptive maskable icon with 20% safe-zone padding.            | • **Inner 80% Safe Zone**: Keep logo inside 410x410 px center circle.<br>• Full bleed background to accommodate Android circle, squircle, or teardrop masking.                          |
| **`apple-touch-icon.png`**      | `180 × 180 px`   | PNG       | N/A (iOS)          | iOS Home Screen icon.                                                          | • **NO Transparency**: Fill background completely (transparent pixels render black on iOS).<br>• **NO Pre-cut Rounded Corners**: Keep square (iOS applies squircle crop automatically). |
| **`favicon-196.png`**           | `196 × 196 px`   | PNG       | N/A (Favicon)      | Desktop browser tab icon & Chrome Android tab icon.                            | • High-density tab favicon.<br>• High-contrast silhouetted emblem for instant tab recognition.                                                                                          |
| **`favicon.ico`**               | `32 × 32 px`     | ICO / PNG | N/A (Favicon)      | Legacy web browser tab icon fallback.                                          | • 32x32 px pixel-crisp fallback.<br>• Keep graphic minimal (remove complex 3D gradients/tiny details).                                                                                  |
| **`shortcut-parent.png`**       | `192 × 192 px`   | PNG       | `"any"`            | Manifest shortcut icon for long-press Quick Action: **Parent Hub**.            | • 192x192 px square PNG.<br>• Distinct visual glyph (e.g. Shield / Crown / Gear) representing parent admin mode.                                                                        |
| **`shortcut-quests.png`**       | `192 × 192 px`   | PNG       | `"any"`            | Manifest shortcut icon for long-press Quick Action: **Quest Log**.             | • 192x192 px square PNG.<br>• Distinct visual glyph (e.g. Sword / Scroll) representing child quest log mode.                                                                            |

---

## Detailed Design Guidelines & Best Practices

1. **Maskable Icon Safe Zone**:
   - Android crops maskable icons using various shape masks (Circle, Squircle, Rounded Rectangle, Teardrop).
   - All critical logo elements (star, sword, broom) **MUST stay within the center 80% circle** (safe zone).
   - The outer 10% on every side is bleed area and will be clipped by the OS.

2. **iOS Apple Touch Icon Rules**:
   - Apple automatically applies a 22.37% corner radius to 180x180 icons.
   - Do NOT add rounded corners to the image file yourself.
   - Do NOT use transparent backgrounds (alpha channel), as iOS displays unpainted pixels as solid black.

3. **Color Consistency**:
   - Match theme color `#4f46e5` (Indigo) or background color `#f8fafc` across manifest, meta tags, and icon backgrounds to avoid color flash on app open.
