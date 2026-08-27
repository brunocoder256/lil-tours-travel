# Lil Tours & Travel — Phase 2 Add-On
## Interactive Live Earth / Global Travel Animation

**This is an add-on to Phase 2 only. Do not rebuild Phase 2.**

Read the existing Phase 2 implementation first. Add one new interactive Earth experience directly **below the existing “What We Offer” / “What can we help you with?” section** and before the next major section.

The purpose is persuasion: the globe should visually communicate **global travel, exploration, movement, tourism, work-abroad opportunities, visas and international journeys**.

## Requirements

- Use Three.js WebGPU + TSL based on the supplied reference implementation below.
- Adapt it to the existing Lil Tours HTML/CSS/JS architecture.
- Do not copy the Three.js demo page UI.
- Do not include the Three.js logo, developer Inspector, debug GUI, demo information panel, or full-screen demo layout.
- The Earth must live inside a branded, responsive Lil Tours section.
- Keep the existing Phase 2 design intact.
- Do not implement Supabase, registry, authentication, database, or Phase 3 functionality.

Suggested section message:

**Explore Beyond Borders**

“From local adventures to international journeys, Lil Tours & Travel helps you move closer to where you want to go.”

Add a tasteful CTA such as **Start Your Journey** or **Talk to a Travel Consultant**.

## Earth behavior

- Slow continuous rotation.
- Realistic day/night Earth.
- Atmospheric glow.
- Gentle OrbitControls interaction.
- Touch interaction where practical.
- Responsive to the section container, not the whole browser viewport.
- No horizontal overflow.
- Must look like part of the Lil Tours brand.

## Responsive sizes

Test at:

320px, 360px, 375px, 390px, 414px, 768px, 1024px, 1280px, 1440px, 1920px.

On mobile, users must still be able to scroll naturally past the globe.

## WebGPU fallback

Because this is a public site, WebGPU failure must never break the page.

If WebGPU is unavailable or initialization fails, provide a graceful fallback such as a static Earth image or lightweight WebGL/CSS alternative.

Do not show browser errors to visitors.

## Performance

- Lazy/deferred initialization where practical.
- Cap device pixel ratio appropriately.
- Avoid duplicate render loops.
- Avoid loading unnecessary assets before the Earth section is needed.
- Optimize texture loading for mobile where practical.
- Respect `prefers-reduced-motion`; disable automatic rotation for users who request reduced motion.

## Code organization

Prefer a dedicated module such as:

```text
website/js/earth.js
```

rather than putting the complete implementation into `index.html`.

The module should have a clean initialization interface and should not create duplicate renderers.

## Textures

The reference uses:

```text
./textures/planets/earth_day_4096.jpg
./textures/planets/earth_night_4096.jpg
./textures/planets/earth_bump_roughness_clouds_4096.jpg
```

Adapt these paths to the actual Lil Tours project. Do not assume the Three.js example folder structure exists. Do not leave broken imports or missing texture paths.

If third-party Earth textures are added, document their source/license/attribution in:

```text
docs/PHASE-02-EARTH-ATTRIBUTION.md
```

## Supplied Three.js reference implementation

Use the following code as the technical reference. Preserve its Earth rendering approach, but adapt it to the Lil Tours site rather than copying the demo page.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<title>three.js webgpu - earth</title>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
</head>
<body>
<script type="module">
import * as THREE from 'three/webgpu';
import { step, normalWorldGeometry, output, texture, vec3, vec4, normalize, positionWorld, bumpMap, cameraPosition, color, uniform, mix, uv, max } from 'three/tsl';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let camera, scene, renderer, controls, globe, timer;

init();

function init() {

    timer = new THREE.Timer();
    timer.connect(document);

    camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(4.5, 2, 3);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const sun = new THREE.DirectionalLight('#ffffff', 2);
    sun.position.set(0, 0, 3);
    scene.add(sun);

    const atmosphereDayColor = uniform(color('#4db2ff'));
    const atmosphereTwilightColor = uniform(color('#bc490b'));
    const roughnessLow = uniform(0.25);
    const roughnessHigh = uniform(0.35);

    const textureLoader = new THREE.TextureLoader();

    const dayTexture = textureLoader.load('./textures/planets/earth_day_4096.jpg');
    dayTexture.colorSpace = THREE.SRGBColorSpace;
    dayTexture.anisotropy = 8;

    const nightTexture = textureLoader.load('./textures/planets/earth_night_4096.jpg');
    nightTexture.colorSpace = THREE.SRGBColorSpace;
    nightTexture.anisotropy = 8;

    const bumpRoughnessCloudsTexture = textureLoader.load('./textures/planets/earth_bump_roughness_clouds_4096.jpg');
    bumpRoughnessCloudsTexture.anisotropy = 8;

    const viewDirection = positionWorld.sub(cameraPosition).normalize();
    const fresnel = viewDirection.dot(normalWorldGeometry).abs().oneMinus().toVar();

    const sunOrientation = normalWorldGeometry.dot(normalize(sun.position)).toVar();

    const atmosphereColor = mix(
        atmosphereTwilightColor,
        atmosphereDayColor,
        sunOrientation.smoothstep(-0.25, 0.75)
    );

    const globeMaterial = new THREE.MeshStandardNodeMaterial();

    const cloudsStrength = texture(
        bumpRoughnessCloudsTexture,
        uv()
    ).b.smoothstep(0.2, 1);

    globeMaterial.colorNode = mix(
        texture(dayTexture),
        vec3(1),
        cloudsStrength.mul(2)
    );

    const roughness = max(
        texture(bumpRoughnessCloudsTexture).g,
        step(0.01, cloudsStrength)
    );

    globeMaterial.roughnessNode =
        roughness.remap(0, 1, roughnessLow, roughnessHigh);

    const night = texture(nightTexture);
    const dayStrength = sunOrientation.smoothstep(-0.25, 0.5);

    const atmosphereDayStrength =
        sunOrientation.smoothstep(-0.5, 1);

    const atmosphereMix =
        atmosphereDayStrength.mul(fresnel.pow(2)).clamp(0, 1);

    let finalOutput = mix(night.rgb, output.rgb, dayStrength);
    finalOutput = mix(finalOutput, atmosphereColor, atmosphereMix);

    globeMaterial.outputNode = vec4(finalOutput, output.a);

    const bumpElevation = max(
        texture(bumpRoughnessCloudsTexture).r,
        cloudsStrength
    );

    globeMaterial.normalNode = bumpMap(bumpElevation);

    const sphereGeometry = new THREE.SphereGeometry(1, 64, 64);

    globe = new THREE.Mesh(sphereGeometry, globeMaterial);
    scene.add(globe);

    const atmosphereMaterial =
        new THREE.MeshBasicNodeMaterial({
            side: THREE.BackSide,
            transparent: true
        });

    let alpha =
        fresnel.remap(0.73, 1, 1, 0).pow(3);

    alpha =
        alpha.mul(sunOrientation.smoothstep(-0.5, 1));

    atmosphereMaterial.outputNode =
        vec4(atmosphereColor, alpha);

    const atmosphere =
        new THREE.Mesh(sphereGeometry, atmosphereMaterial);

    atmosphere.scale.setScalar(1.04);
    scene.add(atmosphere);

    renderer = new THREE.WebGPURenderer();

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.setAnimationLoop(animate);

    document.body.appendChild(renderer.domElement);

    controls =
        new OrbitControls(camera, renderer.domElement);

    controls.enableDamping = true;
    controls.minDistance = 0.1;
    controls.maxDistance = 50;

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {

    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
}

async function animate() {

    timer.update();

    const delta = timer.getDelta();

    globe.rotation.y += delta * 0.025;

    controls.update();

    renderer.render(scene, camera);
}

</script>
</body>
</html>
```

## Important adaptation instructions

The supplied reference intentionally contains a full-page demo structure. **Do not use that structure.**

The final Lil Tours implementation must:

1. Mount into a dedicated Earth-section container.
2. Size the renderer to that container.
3. Keep the rest of the website visible.
4. Remove developer/debug UI.
5. Integrate the existing Lil Tours typography, colors and spacing.
6. Use the existing website's responsive breakpoints where sensible.
7. Provide a graceful WebGPU fallback.
8. Keep normal page scrolling functional.
9. Avoid excessive GPU usage.
10. Not interfere with the existing navigation or other animations.

If the current project does not already have the Three.js dependencies, add only the dependencies actually required.

## Validation

Before finishing:

- Check the Earth visually on desktop and mobile.
- Test rotation.
- Test mouse interaction.
- Test touch interaction where supported.
- Test resizing.
- Test WebGPU fallback.
- Check the browser console.
- Check for missing textures/imports.
- Check reduced-motion behavior.
- Check that the website can scroll normally.
- Check that no horizontal overflow was introduced.
- Check that the existing Phase 2 sections still work.

## Completion report

Report:

1. Exact location of the Earth section.
2. Three.js version/dependency approach used.
3. Texture locations.
4. WebGPU implementation details.
5. Fallback behavior.
6. Responsive behavior.
7. Touch behavior.
8. Performance optimizations.
9. Reduced-motion handling.
10. Attribution requirements.
11. Validation results.
12. Any remaining limitations.

**Do not rebuild Phase 2. This is only an Earth-animation add-on. Do not start Phase 3.**
