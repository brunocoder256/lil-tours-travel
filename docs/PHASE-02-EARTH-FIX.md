# Lil Tours & Travel — Phase 2 Earth Animation FIX

## Critical Issue

The Phase 2 Earth add-on was implemented, but the Earth animation is **not visible**.

This is a **debugging and repair task only**.

Do NOT rebuild Phase 2.
Do NOT redesign the website.
Do NOT start Phase 3.
Do NOT implement Supabase, registry, authentication, or database functionality.

---

## 1. Inspect First

Read and inspect:

```text
website/index.html
website/js/earth.js
website/css/
docs/PHASE-02-EARTH-ATTRIBUTION.md
```

Run the site and inspect the browser console and Network tab if available.

Determine the actual root cause before rewriting anything.

---

## 2. Check WebGPU Initialization — VERY IMPORTANT

The current implementation uses:

```javascript
new THREE.WebGPURenderer()
```

Verify that the renderer is properly initialized before rendering.

For current Three.js WebGPU usage, verify the lifecycle includes the asynchronous initialization, conceptually:

```javascript
const renderer = new THREE.WebGPURenderer({
    antialias: true,
    alpha: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(width, height, false);

await renderer.init();
```

Only begin the render loop after successful initialization.

If the current implementation calls:

```javascript
renderer.setAnimationLoop(animate);
```

before successful WebGPU initialization, correct it.

Do not assume that constructing `WebGPURenderer` alone is sufficient.

---

## 3. Check the CDN Import Map

The current implementation reportedly uses Three.js `0.175.0` through jsDelivr.

Verify that these imports actually resolve:

```text
three
three/webgpu
three/tsl
three/addons/controls/OrbitControls.js
```

Fix broken import-map paths.

Do not copy the Three.js example folder structure into the project.

---

## 4. Check Texture Paths

Actual textures reportedly exist at:

```text
website/assets/textures/planets/earth_day.jpg
website/assets/textures/planets/earth_night.jpg
website/assets/textures/planets/earth_clouds.jpg
```

Remember that browser asset paths are resolved relative to the HTML document URL, not relative to `earth.js`.

Verify all three textures load successfully.

Check for 404/403/network errors.

---

## 5. Check IntersectionObserver

The Earth is lazy-loaded using IntersectionObserver.

Verify that the observer actually triggers.

During debugging, temporary logs may be added:

```javascript
console.log('[Lil Earth] section intersected');
console.log('[Lil Earth] initializing');
console.log('[Lil Earth] WebGPU supported');
console.log('[Lil Earth] renderer initialized');
console.log('[Lil Earth] rendering');
```

Remove unnecessary debug logging after fixing the problem.

The Earth must initialize when the section approaches the viewport.

---

## 6. Check Container Dimensions

Inspect the Earth section CSS and DOM.

The Earth container must have:

- Non-zero width
- Non-zero height
- `position: relative`
- Visible display
- No `display:none`
- No `visibility:hidden`
- No zero-height parent
- Canvas above the background

Check:

```javascript
container.getBoundingClientRect()
```

Width and height must both be greater than zero.

If `aspect-ratio: 1` is being used, verify that the surrounding layout actually gives the container a usable size.

---

## 7. Renderer Must Use Container Size

The renderer must NOT permanently use:

```javascript
renderer.setSize(window.innerWidth, window.innerHeight);
```

Instead use the Earth container:

```javascript
const rect = container.getBoundingClientRect();

renderer.setSize(
    Math.max(1, rect.width),
    Math.max(1, rect.height),
    false
);
```

Camera:

```javascript
camera.aspect = rect.width / rect.height;
camera.updateProjectionMatrix();
```

Continue using ResizeObserver so resizing the section updates the renderer.

---

## 8. Check Camera and Globe

Verify that:

```javascript
globe = new THREE.Mesh(
    sphereGeometry,
    globeMaterial
);

scene.add(globe);
```

actually occurs.

Verify the camera can see the globe.

The reference camera is approximately:

```javascript
camera = new THREE.PerspectiveCamera(
    25,
    width / height,
    0.1,
    100
);

camera.position.set(4.5, 2, 3);
camera.lookAt(0, 0, 0);
```

Do not unnecessarily change the composition.

---

## 9. WebGL Fallback

If WebGPU is unavailable or initialization fails, verify that the WebGL fallback actually renders.

The fallback must:

- Create WebGLRenderer
- Attach canvas to the Earth container
- Render the Earth
- Animate rotation
- Resize correctly
- Not be hidden

A WebGPU failure must never leave an empty Earth section.

---

## 10. CSS Fallback

If both WebGPU and WebGL fail, the CSS globe must remain visible.

Check that it is not accidentally hidden by:

```css
display: none;
opacity: 0;
visibility: hidden;
```

or covered by another layer.

---

## 11. Check Console and Network

Look specifically for errors involving:

```text
WebGPU
WebGPURenderer
GPUDevice
THREE
TSL
OrbitControls
renderer.init
404
Failed to fetch
TextureLoader
CORS
Shader
```

Fix the actual error.

Do not merely suppress errors with empty catch blocks.

---

## 12. Make It Visibly Render

Ensure the final Earth:

- Is large enough to see
- Has visible day/night texture
- Has atmosphere
- Has lighting
- Is not transparent
- Is not behind another element
- Has a suitable section background
- Occupies a meaningful part of the Earth section

The Earth should look like a premium interactive centerpiece.

---

## 13. Animation

Verify continuous rotation:

```javascript
globe.rotation.y += delta * 0.025;
```

Automatic rotation should work for normal users.

For:

```text
prefers-reduced-motion: reduce
```

disable automatic rotation but preserve manual interaction where appropriate.

Do not accidentally disable animation for everyone.

---

## 14. OrbitControls

Verify:

```javascript
controls.enableDamping = true;
controls.enablePan = false;
```

Manual rotation should work.

Normal page scrolling must still work.

---

## 15. Do Not Break Phase 2

After fixing the Earth, verify:

- Header
- Mobile navigation
- Hero
- What We Offer
- Earth section
- Featured Services
- Other sections
- Footer

No horizontal overflow.

Do not modify unrelated sections.

---

## 16. Acceptance Criteria

The fix is complete only when:

- Desktop visibly shows the Earth.
- Mobile visibly shows the Earth.
- Supported WebGPU browsers render the WebGPU Earth.
- WebGPU failure/unavailability renders the WebGL fallback.
- Complete rendering failure shows the CSS fallback.
- Earth rotates automatically for normal users.
- Reduced-motion disables automatic rotation.
- Manual interaction works where supported.
- No uncaught console errors remain.
- No missing Earth assets remain.
- No broken Three.js imports remain.
- The rest of the website still works.

---

## 17. Completion Report

Report:

1. Actual root cause of the invisible Earth.
2. Exact files changed.
3. Whether `WebGPURenderer.init()` was required/fixed.
4. Import-map corrections.
5. Texture-path corrections.
6. Container sizing corrections.
7. WebGPU status.
8. WebGL fallback status.
9. CSS fallback status.
10. Browser/device testing.
11. Console and Network validation.
12. Any remaining limitations.

**This is strictly a repair of the existing Earth animation. Do not rebuild Phase 2 or start Phase 3.**
