/* ============================================
   Lil Tours & Travel — Interactive Earth Module
   ============================================
   Lazy-initialized 3D Earth globe using Three.js.
   WebGPU preferred, WebGL fallback.
   ============================================ */

(function () {
  "use strict";

  var SECTION_ID = "earth-section";
  var CONTAINER_ID = "earth-canvas-container";
  var canvasContainer = null;
  var renderer = null;
  var scene = null;
  var camera = null;
  var controls = null;
  var globe = null;
  var atmosphere = null;
  var animationId = null;
  var initialized = false;
  var disposed = false;

  // --- Configuration ---
  var ROTATION_SPEED = 0.025;
  var CAMERA_FOV = 25;
  var CAMERA_NEAR = 0.1;
  var CAMERA_FAR = 100;
  var CAMERA_POS = { x: 0, y: 1.2, z: 3.2 };
  var MAX_PIXEL_RATIO = 2;

  var TEXTURE_BASE = "assets/textures/planets/";
  var TEXTURES = {
    day: TEXTURE_BASE + "earth_day.jpg",
    night: TEXTURE_BASE + "earth_night.jpg",
    clouds: TEXTURE_BASE + "earth_clouds.jpg",
  };

  // --- Reduced Motion ---
  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  // --- Logging ---
  function log(msg) {
    if (typeof console !== "undefined") {
      console.log("[Lil Earth] " + msg);
    }
  }

  function warn(msg, err) {
    if (typeof console !== "undefined") {
      if (err) {
        console.warn("[Lil Earth] " + msg, err);
      } else {
        console.warn("[Lil Earth] " + msg);
      }
    }
  }

  // --- Fallback UI ---
  function showFallback() {
    if (!canvasContainer) return;
    log("Showing CSS fallback globe");
    canvasContainer.innerHTML =
      '<div class="earth-fallback" aria-hidden="true">' +
      '<div class="earth-fallback-globe"></div>' +
      "</div>";
  }

  // --- Check WebGPU Support ---
  async function checkWebGPUSupport() {
    if (!navigator.gpu) {
      log("WebGPU not available (navigator.gpu missing)");
      return false;
    }
    try {
      var adapter = await navigator.gpu.requestAdapter();
      if (adapter) {
        log("WebGPU supported");
        return true;
      }
      log("WebGPU adapter not available");
      return false;
    } catch (e) {
      log("WebGPU check failed: " + e.message);
      return false;
    }
  }

  // --- Get Container Dimensions ---
  function getContainerSize() {
    if (!canvasContainer) return { width: 0, height: 0 };
    var rect = canvasContainer.getBoundingClientRect();
    return {
      width: Math.max(1, rect.width),
      height: Math.max(1, rect.height),
    };
  }

  // --- Initialize ---
  async function initEarth() {
    if (initialized || disposed) return;
    initialized = true;

    log("Initializing Earth");

    canvasContainer = document.getElementById(CONTAINER_ID);
    if (!canvasContainer) {
      warn("Container #" + CONTAINER_ID + " not found");
      return;
    }

    var size = getContainerSize();
    log("Container size: " + size.width + "x" + size.height);

    if (size.width <= 1 || size.height <= 1) {
      warn("Container has zero dimensions, showing fallback");
      showFallback();
      return;
    }

    // Check for WebGPU
    var webgpuSupported = await checkWebGPUSupport();

    if (webgpuSupported) {
      try {
        await initWebGPU();
        log("WebGPU Earth initialized successfully");
        return;
      } catch (e) {
        warn("WebGPU Earth init failed, falling back to WebGL", e);
      }
    }

    // WebGL fallback
    try {
      await initWebGL();
      log("WebGL Earth initialized successfully");
    } catch (e) {
      warn("WebGL Earth init failed", e);
      showFallback();
    }
  }

  // --- WebGPU Path ---
  async function initWebGPU() {
    log("Loading Three.js modules (WebGPU path)");
    var THREE = await import("three");
    var webgpu = await import("three/webgpu");
    var tsl = await import("three/tsl");
    var OrbitControlsMod = await import(
      "three/addons/controls/OrbitControls.js"
    );
    log("Three.js modules loaded");

    var SphereGeometry = THREE.SphereGeometry;
    var Mesh = THREE.Mesh;
    var DirectionalLight = THREE.DirectionalLight;
    var TextureLoader = THREE.TextureLoader;
    var SRGBColorSpace = THREE.SRGBColorSpace;
    var BackSide = THREE.BackSide;

    var uniform = tsl.uniform;
    var colorFn = tsl.color;
    var textureFn = tsl.texture;
    var vec3 = tsl.vec3;
    var vec4 = tsl.vec4;
    var normalize = tsl.normalize;
    var positionWorld = tsl.positionWorld;
    var cameraPosition = tsl.cameraPosition;
    var normalWorldGeometry = tsl.normalWorldGeometry;
    var output = tsl.output;
    var bumpMap = tsl.bumpMap;
    var mix = tsl.mix;
    var uv = tsl.uv;
    var max = tsl.max;
    var step = tsl.step;

    // Scene setup
    scene = new THREE.Scene();

    // Camera
    var size = getContainerSize();
    var aspect = size.width / size.height;
    camera = new THREE.PerspectiveCamera(CAMERA_FOV, aspect, CAMERA_NEAR, CAMERA_FAR);
    camera.position.set(CAMERA_POS.x, CAMERA_POS.y, CAMERA_POS.z);

    // Sun light
    var sun = new DirectionalLight("#ffffff", 2);
    sun.position.set(0, 0, 3);
    scene.add(sun);

    // Uniforms
    var atmosphereDayColor = uniform(colorFn("#4db2ff"));
    var atmosphereTwilightColor = uniform(colorFn("#bc490b"));
    var roughnessLow = uniform(0.25);
    var roughnessHigh = uniform(0.35);

    // Texture loader
    var textureLoader = new TextureLoader();

    log("Loading textures");
    var dayTexture = textureLoader.load(TEXTURES.day);
    dayTexture.colorSpace = SRGBColorSpace;
    dayTexture.anisotropy = 8;

    var nightTexture = textureLoader.load(TEXTURES.night);
    nightTexture.colorSpace = SRGBColorSpace;
    nightTexture.anisotropy = 8;

    var cloudsTexture = textureLoader.load(TEXTURES.clouds);
    cloudsTexture.anisotropy = 8;

    // TSL nodes
    var viewDirection = positionWorld
      .sub(cameraPosition)
      .normalize();
    var fresnel = viewDirection
      .dot(normalWorldGeometry)
      .abs()
      .oneMinus()
      .toVar();

    var sunOrientation = normalWorldGeometry
      .dot(normalize(sun.position))
      .toVar();

    var atmosphereColor = mix(
      atmosphereTwilightColor,
      atmosphereDayColor,
      sunOrientation.smoothstep(-0.25, 0.75)
    );

    // Globe material
    var globeMaterial = new webgpu.MeshStandardNodeMaterial();

    var cloudsStrength = textureFn(cloudsTexture, uv())
      .b.smoothstep(0.2, 1);

    globeMaterial.colorNode = mix(
      textureFn(dayTexture),
      vec3(1),
      cloudsStrength.mul(2)
    );

    var roughnessVal = max(
      textureFn(cloudsTexture).g,
      step(0.01, cloudsStrength)
    );
    globeMaterial.roughnessNode = roughnessVal.remap(
      0,
      1,
      roughnessLow,
      roughnessHigh
    );

    var night = textureFn(nightTexture);
    var dayStrength = sunOrientation.smoothstep(-0.25, 0.5);
    var atmosphereDayStrength = sunOrientation.smoothstep(-0.5, 1);
    var atmosphereMix = atmosphereDayStrength
      .mul(fresnel.pow(2))
      .clamp(0, 1);

    var finalOutput = mix(night.rgb, output.rgb, dayStrength);
    finalOutput = mix(finalOutput, atmosphereColor, atmosphereMix);
    globeMaterial.outputNode = vec4(finalOutput, output.a);

    var bumpElevation = max(
      textureFn(cloudsTexture).r,
      cloudsStrength
    );
    globeMaterial.normalNode = bumpMap(bumpElevation);

    // Globe mesh
    var geometry = new SphereGeometry(1, 64, 64);
    globe = new Mesh(geometry, globeMaterial);
    scene.add(globe);
    log("Globe mesh added to scene");

    // Atmosphere
    var atmosphereMaterial = new webgpu.MeshBasicNodeMaterial({
      side: BackSide,
      transparent: true,
    });

    var alpha = fresnel.remap(0.73, 1, 1, 0).pow(3);
    alpha = alpha.mul(sunOrientation.smoothstep(-0.5, 1));
    atmosphereMaterial.outputNode = vec4(atmosphereColor, alpha);

    atmosphere = new Mesh(geometry, atmosphereMaterial);
    atmosphere.scale.setScalar(1.04);
    scene.add(atmosphere);

    // Renderer
    log("Creating WebGPURenderer");
    renderer = new webgpu.WebGPURenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO)
    );
    renderer.setSize(size.width, size.height, false);

    // CRITICAL: await renderer.init() for WebGPU
    log("Awaiting renderer.init()");
    await renderer.init();
    log("WebGPU renderer initialized");

    canvasContainer.appendChild(renderer.domElement);
    log("Canvas appended to container");

    // Controls
    controls = new OrbitControlsMod.OrbitControls(
      camera,
      renderer.domElement
    );
    controls.enableDamping = true;
    controls.minDistance = 1.5;
    controls.maxDistance = 8;
    controls.enablePan = false;
    controls.rotateSpeed = 0.5;

    // Animation loop
    var clock = new THREE.Clock();

    function animate() {
      animationId = renderer.setAnimationLoop(function () {
        var delta = clock.getDelta();
        if (!prefersReducedMotion.matches) {
          globe.rotation.y += delta * ROTATION_SPEED;
        }
        controls.update();
        renderer.render(scene, camera);
      });
    }

    animate();
    log("Animation loop started");
    setupResize();
  }

  // --- WebGL Path (Fallback) ---
  async function initWebGL() {
    log("Loading Three.js modules (WebGL path)");
    var THREE = await import("three");
    var OrbitControlsMod = await import(
      "three/addons/controls/OrbitControls.js"
    );
    log("Three.js modules loaded (WebGL)");

    var SphereGeometry = THREE.SphereGeometry;
    var Mesh = THREE.Mesh;
    var DirectionalLight = THREE.DirectionalLight;
    var AmbientLight = THREE.AmbientLight;
    var Color = THREE.Color;
    var TextureLoader = THREE.TextureLoader;
    var SRGBColorSpace = THREE.SRGBColorSpace;
    var MeshPhongMaterial = THREE.MeshPhongMaterial;
    var MeshBasicMaterial = THREE.MeshBasicMaterial;
    var BackSide = THREE.BackSide;

    // Scene
    scene = new THREE.Scene();

    // Camera
    var size = getContainerSize();
    camera = new THREE.PerspectiveCamera(
      CAMERA_FOV,
      size.width / size.height,
      CAMERA_NEAR,
      CAMERA_FAR
    );
    camera.position.set(CAMERA_POS.x, CAMERA_POS.y, CAMERA_POS.z);

    // Lights
    var sun = new DirectionalLight("#ffffff", 1.8);
    sun.position.set(5, 3, 5);
    scene.add(sun);

    var ambient = new AmbientLight("#223344", 0.4);
    scene.add(ambient);

    // Texture loader
    var textureLoader = new TextureLoader();

    log("Loading textures (WebGL)");
    var dayTexture = textureLoader.load(TEXTURES.day);
    dayTexture.colorSpace = SRGBColorSpace;

    var nightTexture = textureLoader.load(TEXTURES.night);
    nightTexture.colorSpace = SRGBColorSpace;

    var cloudsTexture = textureLoader.load(TEXTURES.clouds);

    // Globe material (WebGL standard)
    var globeMaterial = new MeshPhongMaterial({
      map: dayTexture,
      bumpMap: cloudsTexture,
      bumpScale: 0.03,
      specularMap: cloudsTexture,
      specular: new Color("#333333"),
      shininess: 15,
    });

    // Globe mesh
    var geometry = new SphereGeometry(1, 64, 64);
    globe = new Mesh(geometry, globeMaterial);
    scene.add(globe);
    log("Globe mesh added (WebGL)");

    // Atmosphere (simple glow)
    var atmosphereMaterial = new MeshBasicMaterial({
      color: new Color("#4db2ff"),
      transparent: true,
      opacity: 0.15,
      side: BackSide,
    });
    atmosphere = new Mesh(
      new SphereGeometry(1.08, 64, 64),
      atmosphereMaterial
    );
    scene.add(atmosphere);

    // Renderer
    log("Creating WebGLRenderer");
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO)
    );
    renderer.setSize(size.width, size.height, false);
    renderer.setClearColor(0x000000, 0);
    canvasContainer.appendChild(renderer.domElement);
    log("Canvas appended (WebGL)");

    // Controls
    controls = new OrbitControlsMod.OrbitControls(
      camera,
      renderer.domElement
    );
    controls.enableDamping = true;
    controls.minDistance = 1.5;
    controls.maxDistance = 8;
    controls.enablePan = false;
    controls.rotateSpeed = 0.5;

    // Animate
    var clock = new THREE.Clock();

    function animate() {
      animationId = requestAnimationFrame(animate);
      var delta = clock.getDelta();
      if (!prefersReducedMotion.matches) {
        globe.rotation.y += delta * ROTATION_SPEED;
      }
      controls.update();
      renderer.render(scene, camera);
    }

    animate();
    log("Animation loop started (WebGL)");
    setupResize();
  }

  // --- Resize Handler ---
  function setupResize() {
    if (!canvasContainer || !renderer || !camera) return;

    var resizeObserver = new ResizeObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        var width = entry.contentRect.width;
        var height = entry.contentRect.height;
        if (width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height, false);
        }
      }
    });

    resizeObserver.observe(canvasContainer);
    canvasContainer._resizeObserver = resizeObserver;
  }

  // --- Cleanup ---
  function dispose() {
    disposed = true;

    if (animationId !== null) {
      if (renderer && renderer.setAnimationLoop) {
        renderer.setAnimationLoop(null);
      } else {
        cancelAnimationFrame(animationId);
      }
      animationId = null;
    }

    if (canvasContainer && canvasContainer._resizeObserver) {
      canvasContainer._resizeObserver.disconnect();
    }

    if (renderer) {
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    }

    if (scene) {
      scene.traverse(function (obj) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(function (m) { m.dispose(); });
          } else {
            obj.material.dispose();
          }
        }
      });
    }

    camera = null;
    scene = null;
    renderer = null;
    controls = null;
    globe = null;
    atmosphere = null;
  }

  // --- Lazy Init with IntersectionObserver ---
  function setupLazyInit() {
    var section = document.getElementById(SECTION_ID);
    if (!section) {
      warn("Section #" + SECTION_ID + " not found");
      return;
    }

    log("Section found, setting up IntersectionObserver");

    if (!("IntersectionObserver" in window)) {
      log("IntersectionObserver not supported, initializing immediately");
      initEarth();
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            log("Section intersected, initializing");
            initEarth();
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px 0px" }
    );

    observer.observe(section);
    log("IntersectionObserver attached");
  }

  // --- Start ---
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupLazyInit);
  } else {
    setupLazyInit();
  }

  // Expose dispose for cleanup if needed
  window.LilEarth = { dispose: dispose };
})();
