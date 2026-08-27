# Phase 2 Add-On — Earth Animation Attribution

## Three.js

- **Library:** Three.js
- **Version:** 0.175.0
- **Source:** https://github.com/mrdoob/three.js
- **License:** MIT License
- **CDN:** https://cdn.jsdelivr.net/npm/three@0.175.0/

## Earth Textures

The following textures are used for the 3D Earth globe:

### earth_day.jpg

- **Source:** NASA Earth Observatory / Blue Marble
- **Original:** NASA Visible Earth
- **License:** Public Domain (NASA images are generally not copyrighted)
- **URL:** https://eoimages.gsfc.nasa.gov/

### earth_night.jpg

- **Source:** NASA Earth Observatory / Black Marble
- **Original:** NASA nighttime lights composite
- **License:** Public Domain
- **URL:** https://eoimages.gsfc.nasa.gov/

### earth_clouds.jpg

- **Source:** NASA Earth Observatory / Cloud Composite
- **Original:** NASA cloud cover data
- **License:** Public Domain
- **URL:** https://eoimages.gsfc.nasa.gov/

## Reference Implementation

The Earth rendering approach is based on the Three.js WebGPU Earth demo:

- **Source:** https://github.com/mrdoob/three.js (examples/webgpu_geometry_earth.html)
- **License:** MIT License (same as Three.js)
- **Adaptation:** Modified to fit within a branded website section, removed debug UI, added responsive container sizing, added WebGL fallback, added lazy initialization

## Notes

- All NASA imagery is in the public domain and free to use
- Three.js is MIT licensed and free to use
- No proprietary or restricted assets are used in this add-on
