# 📁 src/assets/images/

All static image assets used by the website.

## Subfolders

| Folder | Contents |
|---|---|
| `logos/` | NexaSphere + GL Bajaj logos (transparent PNG) |
| `team/` | Circular profile photos for all team members |

---

## logos/

| File | Used in |
|---|---|
| `nexasphere-logo.png` | Navbar, Hero section, Splash screen, Footer |
| `glbajaj-logo.png` | Navbar, Footer |

**To replace a logo:** Upload the new PNG with the **same filename** — no code changes needed.
Logos must have a **transparent background**.

---

## team/

Circular profile photos (300×300px, PNG with transparent background).

| File | Member |
|---|---|
| `ayush.png` | Ayush Sharma |
| `tanishk.png` | Tanishk Bansal |
| `tushar.png` | Tushar Goswami |
| `swayam.png` | Swayam Dwivedi |
| `aryan.png` | Aryan Singh |
| `vartika.png` | Vartika Sharma |
| `arya.png` | Arya Kaushik |
| `astha.png` | Astha Shukla |
| `ankit.png` | Ankit Singh |
| `vikas.png` | Vikas Kumar Sharma |
| `surjeet.png` | Suryjeet Singh |
| `roshni.png` | Roshni Gupta |
| `placeholder.png` | Default — shown when no photo is set |

**To add a new member photo:**
1. Crop image to circle, 300×300px, transparent background
2. Save as `membername.png` in this folder
3. Import in `src/data/teamData.js`:
   ```js
   import membernameImg from '../assets/images/team/membername.png';
   ```
