import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ASSETS } from '../assets';
import { sharedLoadingManager, reportModelBytes, markModelReady } from '../lib/assetLoading';
import { createRegionPins, updatePins, type PinField, type RegionPin } from '../lib/regionPins';
import { RegionSheet } from './RegionSheet';
import economicRegionsData from '../data/economicRegions.json';
import type { EconomicRegionsFile } from '../types';

/**
 * Hero cartoon Earth.
 *
 * Replaces a procedurally-built globe (an ocean sphere plus continent plates
 * extruded from hand-authored lat/lon polygons, with five economic marker pins
 * and a fabricated-indicator overlay). All of that is gone: the planet is now a
 * single authored .glb.
 *
 * It auto-rotates, spins under drag, and carries a map pin at the centre of each
 * World Bank economic region: hovering pulls a pin out of the globe, clicking it
 * opens that region's card.
 *
 * The pins are the deliberate second act of a story worth knowing. This hero
 * originally carried pins that were pure decoration with invented figures
 * attached ("+4.2% QoQ", "Yield 4.15%"); those were deleted, and for a while the
 * regions were shown by tinting the land itself instead. These pins are the
 * opposite of the first set — real World Bank series, sourced on the card — and
 * the one rule that survived from that cleanup still holds: the vendor's logo
 * sign-boards are stripped at load and must stay stripped.
 *
 * The asset is self-contained: geometry and all six textures live in the .glb's
 * binary chunk, so this is the hero's only network request, and it is what the
 * splash screen's progress bar is measuring.
 */

const { meta: REGION_META, regions: REGIONS } =
  economicRegionsData as unknown as EconomicRegionsFile;

/** Radius the model is normalised to, in world units. Camera framing derives from it. */
const MODEL_RADIUS = 5;

/** Camera field of view, in degrees. Paired with fitDistance below. */
const CAMERA_FOV = 38;

/**
 * Fraction of the tighter view half-angle the model is allowed to fill.
 *
 * The procedural globe used 0.72, but that budget existed solely to keep the
 * planet out from under an info card pinned top-left and a control bar across
 * the bottom. Both overlays are gone, so the model can be framed much closer.
 * It is still under 1 because the bounding sphere is measured in the rest pose —
 * the planes and cloud puffs orbit, and the slack absorbs their excursion.
 */
const CAMERA_FILL = 0.82;

/** Auto-rotation rate, radians per second. */
const SPIN_RATE = 0.18;

/** Camera direction — mostly front-on, lifted slightly so the globe reads as a sphere. */
const CAMERA_DIR = new THREE.Vector3(0.34, 0.3, 1).normalize();

/** Axial tilt, so the spin axis is not dead vertical on screen. */
const AXIAL_TILT_RAD = THREE.MathUtils.degToRad(16);

/**
 * How far a pointer may travel, in CSS pixels, and how long it may stay down,
 * before a press stops counting as a click and becomes a drag.
 *
 * Without this every drag would end in a selection, because releasing the
 * pointer over a continent is exactly how a drag finishes. 6px is above the
 * jitter of a thumb on glass and well below a deliberate spin.
 */
const CLICK_SLOP_PX = 6;
const CLICK_MAX_MS = 400;

/** How long the globe takes to turn a chosen region to face the camera. */
const FOCUS_MS = 700;

/** Radians of rotation per pixel of drag, in both axes. */
const DRAG_SPEED = 0.008;

/**
 * How close, in CSS pixels, the cursor must come to a pin's head to hit it.
 *
 * Generous on purpose. The head renders about 20px across on desktop and 17px
 * on a phone, so matching the drawn size would make the pins fussy to hit with
 * a thumb — this gives every pin the same comfortable target regardless of how
 * large the globe happens to be drawn.
 */
const PIN_HIT_RADIUS_PX = 30;

/** The globe's own polar axis, in its local frame — what auto-spin turns about. */
const LOCAL_POLE = new THREE.Vector3(0, 1, 0);

/**
 * How far a drag may tip the pole off the tilt axis before the spring resists,
 * and how fast it is pulled back — while the pointer is pushing past the limit,
 * and once it has been let go.
 *
 * The globe is a planet: it spins about one tilted axis, and a drag is a push
 * against that rather than a new orientation to keep. Without the spring the
 * axis stays wherever a drag left it, so after one vertical drag the planet
 * spins about some arbitrary pole for the rest of the session.
 *
 * Only the *pole* is regulated. Yaw stays completely free — drag all the way
 * round, in any direction, and that is where it stays.
 */
const MAX_TILT_RAD = THREE.MathUtils.degToRad(28);
const RESIST_RATE = 9;
const RETURN_RATE = 2.5;

/**
 * tiltGroup's fixed rotation, and its inverse.
 *
 * Everything the drag and the focus need to do happens in spinGroup's *parent*
 * space, which is tiltGroup's local frame. Since that transform is a constant,
 * both quaternions can be built once here rather than read back off the object.
 */
const TILT_QUAT = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(0, 0, 1),
  -AXIAL_TILT_RAD
);
const TILT_INV = TILT_QUAT.clone().invert();

/** Direction a region must end up pointing to face the camera, in tiltGroup space. */
const FACE_DIR = CAMERA_DIR.clone().applyQuaternion(TILT_INV).normalize();

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Distance at which a sphere of `radius` at the origin fills `fill` of the
 * tighter of the two view half-angles. Tangent fit is `radius / sin(halfAngle)`;
 * shrinking the half-angle by `fill` leaves margin.
 *
 * Which axis binds flips with aspect ratio — at this fov a 1024×680 desktop box
 * is vertically bound, while a 375×520 phone box is *horizontally* bound and
 * needs to pull back roughly a third further. That crossover is why the distance
 * is recomputed on every resize rather than hardcoded.
 *
 * Salvaged from the deleted src/lib/globeGeometry.ts, which was otherwise
 * entirely procedural-globe machinery.
 */
function fitDistance(radius: number, fovDeg: number, aspect: number, fill: number): number {
  const vHalf = THREE.MathUtils.degToRad(fovDeg) / 2;
  const hHalf = Math.atan(Math.tan(vHalf) * aspect);
  return Math.max(radius / Math.sin(vHalf * fill), radius / Math.sin(hHalf * fill));
}

/**
 * True for anything in the .glb that exists to advertise the model's vendor.
 *
 * Two separate things have to be caught here, which is why this tests the
 * material as well as the name:
 *
 *  - Nodes named `ox-logo.*` — small sign boards standing off the surface. These
 *    read as map pins, which the hero explicitly must not have.
 *  - Nodes `avion.004` and `avion.001` — banners towed behind the two aircraft.
 *    Their names give nothing away; what identifies them is the `ox-logo`
 *    material, and their UVs sample U 0.151–0.856 × V 0.404–0.597 of the logo
 *    sheet, which is precisely the vendor's mark plus wordmark.
 *
 * The banners are siblings/children of the plane bodies rather than part of
 * them, so dropping them leaves both aircraft flying with their animated
 * propellers intact.
 *
 * GLTFLoader runs node names through PropertyBinding.sanitizeNodeName, which
 * strips `.`, so the runtime name is `ox-logo008`, not `ox-logo.008` — hence a
 * prefix test rather than an exact-match list.
 */
const isVendorBranding = (object: THREE.Object3D): boolean => {
  if (object.name.startsWith('ox-logo')) return true;

  const material = (object as THREE.Mesh).material;
  const materials = Array.isArray(material) ? material : material ? [material] : [];
  return materials.some((entry) => entry.name === 'ox-logo');
};

export const EarthModel: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // The three.js effect runs once and never re-runs, so it cannot read
  // `selectedId` directly. These refs are the whole bridge: the loop reads
  // `selectedIndexRef` each frame to know whether to hold the spin and which
  // region to tint, and picks up an anchor left in `pendingFocusRef` to start a
  // turn. `setSelectedId` needs no such treatment — a useState setter is
  // identity-stable.
  const selectedIndexRef = useRef(-1);
  const pendingFocusRef = useRef<number[] | null>(null);

  const selectRegion = (id: string | null) => {
    setSelectedId(id);
    const index = id ? REGIONS.findIndex((entry) => entry.id === id) : -1;
    selectedIndexRef.current = index;
    // The pin's own direction, so selecting a region turns its pin to the front.
    pendingFocusRef.current = index >= 0 ? REGIONS[index].pin : null;
  };

  useEffect(() => {
    if (!mountRef.current) return;

    // Capture the mount node locally rather than re-reading mountRef.current in
    // cleanup. React StrictMode's dev-only mount→cleanup→mount simulation detaches
    // refs (sets them to null) *before* running cleanup, so a cleanup that read
    // mountRef.current would see null and silently skip removeChild — leaving a
    // stale canvas in the DOM that a second, live canvas then renders behind.
    const mountNode = mountRef.current;

    const width = mountNode.clientWidth;
    const height = mountNode.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, width / height, 0.1, 1000);

    // Constructing the renderer is the one step that can fail outright — no WebGL,
    // a blocked context, a driver that refuses. It is guarded separately because a
    // throw here would leave markModelReady() uncalled, which strands every such
    // visitor behind the splash for its full 25s auto-dismiss.
    const renderer = (() => {
      try {
        return new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        });
      } catch (err) {
        console.error('WebGL unavailable; hero Earth disabled:', err);
        return null;
      }
    })();

    if (!renderer) {
      markModelReady();
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // pan-y, not none: this canvas is 520px tall at the very top of the page, so
    // claiming every touch gesture would trap the scroll. Horizontal drags spin
    // the Earth, vertical swipes still scroll the document.
    renderer.domElement.style.touchAction = 'pan-y';
    mountNode.appendChild(renderer.domElement);

    // Screen right and screen up, expressed in spinGroup's parent space. A
    // horizontal drag turns the globe about the second, a vertical drag about
    // the first — which is what makes the surface follow the pointer in any
    // direction. Refreshed with the camera, since they derive from it.
    const dragAxisX = new THREE.Vector3();
    const dragAxisY = new THREE.Vector3();

    const applyCamera = () => {
      const distance = fitDistance(MODEL_RADIUS, CAMERA_FOV, camera.aspect, CAMERA_FILL);
      camera.position.copy(CAMERA_DIR).multiplyScalar(distance);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();
      dragAxisX.setFromMatrixColumn(camera.matrixWorld, 0).applyQuaternion(TILT_INV).normalize();
      dragAxisY.setFromMatrixColumn(camera.matrixWorld, 1).applyQuaternion(TILT_INV).normalize();
    };
    applyCamera();

    // Lights. Deliberately soft: every material in this model is baseColorTexture-
    // driven with the cartoon shading already painted into the sheet, so a hot key
    // light blows out the land texture rather than adding form. The rig's only job
    // is a gentle left-to-right falloff across the sphere.
    scene.add(new THREE.AmbientLight(0xf2f6fb, 0.95));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.05);
    keyLight.position.set(-9, 10, 12);
    scene.add(keyLight);

    // Cool fill from the opposite corner, so the dark limb stays blue rather than
    // going muddy grey.
    const coolFill = new THREE.DirectionalLight(0xa8c8ea, 0.38);
    coolFill.position.set(11, -5, -7);
    scene.add(coolFill);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xa8c4dd, 0.35));

    // tiltGroup (fixed axial tilt) ⊃ spinGroup (yaw, auto + drag)
    const tiltGroup = new THREE.Group();
    tiltGroup.rotation.z = -AXIAL_TILT_RAD;
    scene.add(tiltGroup);

    const spinGroup = new THREE.Group();
    tiltGroup.add(spinGroup);

    // Test seam for the axis spring. Its central invariant — the pole never
    // strays past MAX_TILT_RAD, and returns to zero once released — is invisible
    // in a screenshot, because a tilt and a yaw both just move pixels around.
    // This exposes the one number that settles it. `import.meta.env.DEV` is a
    // Vite compile-time constant, so the whole block is dropped from the
    // production bundle.
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__globeTilt = () =>
        THREE.MathUtils.radToDeg(
          new THREE.Vector3().copy(LOCAL_POLE).applyQuaternion(spinGroup.quaternion).angleTo(LOCAL_POLE)
        );
    }

    // The load is async, so a late callback could otherwise mutate a torn-down
    // scene. THREE.Cache holds the ArrayBuffer but *not* the parsed result, so
    // StrictMode's second mount genuinely re-parses and would inject a second
    // Earth into the first mount's discarded scene without this guard.
    let isActive = true;
    let mixer: THREE.AnimationMixer | null = null;
    /** The pins, and the model they hang off — both exist only after load. */
    let pinField: PinField | null = null;
    let model: THREE.Object3D | null = null;

    const gltfLoader = new GLTFLoader(sharedLoadingManager);
    gltfLoader.load(
      ASSETS.models.earthCartoonGlb,
      (gltf) => {
        if (!isActive) return;

        model = gltf.scene;

        // 1. Strip vendor branding.
        const removed: THREE.Object3D[] = [];
        model.traverse((child) => {
          if (isVendorBranding(child)) removed.push(child);
        });

        for (const object of removed) {
          object.removeFromParent();
          // Geometry only. Materials are shared by index across the whole file —
          // the sign boards use the same `Atlas.2` instance as the ships, planes
          // and buildings we are keeping — so disposing them here would blank out
          // half the model. The now-orphaned `ox-logo` material is never rendered
          // and so never reaches the GPU; leaving it to GC is correct.
          object.traverse((child) => {
            (child as THREE.Mesh).geometry?.dispose();
          });
        }

        // 2. Drop animation tracks that pointed at those nodes. Several of them
        // are animation targets, and leaving the tracks in makes the mixer log a
        // `PropertyBinding: No target node found` warning per track on bind.
        const removedNames = new Set(removed.map((object) => object.name));
        const clips = gltf.animations
          .map((clip) => {
            const trimmed = clip.clone();
            trimmed.tracks = trimmed.tracks.filter(
              // Track names are `<sanitizedNodeName>.<property>`, and sanitizing
              // has already stripped any dots from the node name, so the first
              // segment is unambiguously the node.
              (track) => !removedNames.has(track.name.split('.')[0])
            );
            return trimmed;
          })
          .filter((clip) => clip.tracks.length > 0);

        // 3. Baked node animation swings the planes and cloud puffs well outside
        // the bounding volumes they were authored with, and the whale tails are
        // skinned — both make three cull meshes that are actually on screen. The
        // model is small and always fully in frame, so culling buys nothing here.
        model.traverse((child) => {
          child.frustumCulled = false;
        });

        // 4. Centre on the origin and normalise the scale. Unlike a model that
        // stands on a ground plane, this one must stay centred rather than resting
        // its base at y = 0, so that it spins about its own axis.
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Half the largest box dimension, NOT Box3.getBoundingSphere(). That
        // method returns the half-diagonal, which for a roughly spherical model
        // over-estimates the radius by up to √3 and frames the planet at a third
        // of the size it should be.
        const radius = Math.max(size.x, size.y, size.z) / 2;

        const wrapper = new THREE.Group();
        model.position.sub(center);
        wrapper.add(model);
        if (radius > 0) {
          wrapper.scale.setScalar(MODEL_RADIUS / radius);
        }
        spinGroup.add(wrapper);

        // 5. Plant the pins — deliberately *after* the box above. The model's
        // local frame is the one the `pin` vectors were measured in and the one
        // the land sphere is centred on, so parenting to it needs no matrix work
        // and the pins inherit the centring, the fit scale and the spin. But
        // adding them any earlier puts them inside the measured bounds, which
        // inflates the fit radius and silently shrinks the whole globe.
        pinField = createRegionPins(REGIONS);
        model.add(pinField.group);

        // 6. Play everything the artist baked in — orbiting planes, drifting
        // clouds, and the rigged whale tails. Both clips loop at ~30s.
        if (clips.length > 0) {
          mixer = new THREE.AnimationMixer(model);
          for (const clip of clips) mixer.clipAction(clip).play();
        }

        // The model is downloaded, parsed, textured and in the scene graph — this
        // is the signal SplashScreen blocks its exit on.
        markModelReady();
      },
      // Byte-accurate progress: this .glb is the entire hero payload.
      (event) => reportModelBytes(event.loaded, event.total),
      (err) => {
        if (!isActive) return;
        console.error('Hero Earth model failed to load:', err);
        // Still release the splash. sharedLoadingManager.onError has separately
        // set the `failed` flag, which is what gives SplashScreen its Retry
        // button — but without this the curtain never lifts on its own.
        markModelReady();
      }
    );

    /* Interaction ----------------------------------------------------------- */
    const domElement = renderer.domElement;
    /** Scratch for projecting a pin head to screen space. */
    const projected = new THREE.Vector3();
    const globeCentre = new THREE.Vector3();
    const toCamera = new THREE.Vector3();
    const toPin = new THREE.Vector3();

    let isDragging = false;
    let previousX = 0;
    let previousY = 0;
    // Click-vs-drag bookkeeping. `travel` accumulates absolute movement rather
    // than measuring start-to-end distance, so a drag that wanders out and comes
    // back to where it started still counts as a drag.
    let travel = 0;
    let pressedAt = 0;

    // Scratch quaternions for the drag, reused so a fast drag does not allocate
    // two objects per pointermove.
    const qDrag = new THREE.Quaternion();
    const qPitch = new THREE.Quaternion();
    /** Last pointer position over the canvas, for the per-frame hover test. */
    let hoverX = -1;
    let hoverY = -1;
    let isHovering = false;
    /** Which pin the cursor is on, resolved once per frame. */
    let hoveredRegionId: string | null = null;

    /**
     * Where a pin's head is on the page, and whether it is on the near side.
     *
     * A far-side pin is hidden behind the opaque ocean but still projects onto
     * the canvas, so `facing` is what stops a hover reaching one straight
     * through the planet. `updatePins` has already refreshed each `hitWorld`
     * this frame.
     */
    const pinScreenPosition = (pin: RegionPin, rect: DOMRect) => {
      toPin.copy(pin.hitWorld).sub(globeCentre);
      projected.copy(pin.hitWorld).project(camera);
      return {
        x: rect.left + ((projected.x + 1) / 2) * rect.width,
        y: rect.top + ((1 - projected.y) / 2) * rect.height,
        depth: pin.hitWorld.distanceToSquared(camera.position),
        facing: toPin.dot(toCamera) > 0,
      };
    };

    /**
     * Which pin, if any, is under a client-space point.
     *
     * Screen-space distance rather than a raycast against the pin meshes. The
     * heads are only ~20px across on desktop and ~17px on a phone, so testing
     * the geometry would make them a fiddly target; a fixed pixel radius is
     * uniform at every resolution and every zoom, and it needs no Raycaster at
     * all.
     */
    const pinAt = (clientX: number, clientY: number): RegionPin | null => {
      if (!pinField || !model) return null;

      const rect = domElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;

      // The land sphere sits at the model object's local origin, so its world
      // position is the globe's centre.
      model.getWorldPosition(globeCentre);
      toCamera.copy(camera.position).sub(globeCentre);

      let best: RegionPin | null = null;
      let bestDistance = PIN_HIT_RADIUS_PX;
      let bestDepth = Infinity;

      for (const pin of pinField.pins) {
        const { x, y, depth, facing } = pinScreenPosition(pin, rect);
        if (!facing) continue;

        const distance = Math.hypot(x - clientX, y - clientY);
        if (distance > PIN_HIT_RADIUS_PX) continue;

        // Two pins can overlap on screen near the limb. Prefer the nearer one
        // rather than whichever the loop happened to reach first.
        if (distance < bestDistance - 1 || (distance < bestDistance + 1 && depth < bestDepth)) {
          best = pin;
          bestDistance = Math.min(distance, bestDistance);
          bestDepth = depth;
        }
      }

      return best;
    };

    // Second test seam, alongside __globeTilt. Where the pins are on screen is
    // the one thing an end-to-end test cannot work out for itself: the heads and
    // spikes are the same red and merge into a single blob optically, and a
    // focused pin does not land on a fixed pixel (see the parallax note in
    // docs/3D_MODEL_VIEWER.md). Hunting for them by scanning the cursor is slow
    // and flaky, and it got flakier once closing a card started springing the
    // globe back to its axis. This reports positions only — a test still has to
    // hover and click them to prove anything.
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__pinScreen = () => {
        if (!pinField || !model) return [];
        const rect = domElement.getBoundingClientRect();
        model.getWorldPosition(globeCentre);
        toCamera.copy(camera.position).sub(globeCentre);
        return pinField.pins.map((pin) => {
          const { x, y, facing } = pinScreenPosition(pin, rect);
          return { id: pin.regionId, x, y, facing };
        });
      };
    }

    const handlePointerDown = (event: PointerEvent) => {
      // Ignore a second finger so it cannot hijack an in-progress drag.
      if (!event.isPrimary) return;
      isDragging = true;
      previousX = event.clientX;
      previousY = event.clientY;
      travel = 0;
      pressedAt = event.timeStamp;
      domElement.style.cursor = 'grabbing';
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isDragging) return;
      const dx = event.clientX - previousX;
      const dy = event.clientY - previousY;
      previousX = event.clientX;
      previousY = event.clientY;
      travel += Math.hypot(dx, dy);

      // Free rotation, not yaw-and-pitch Euler angles. Turning about the screen's
      // own axes means the surface tracks the pointer whichever way it moves,
      // including diagonally, and there is no orientation where an axis
      // collapses. Rotation is pre-multiplied because these axes live in the
      // parent's frame, not the model's.
      //
      // The drag itself is unbounded in both axes — the frame loop's axis spring
      // is what decides how far off the tilt axis the result is allowed to sit,
      // and it does that per frame, since pointermove is not frame-paced and a
      // limit applied here would step by however far a fast drag happened to
      // move between events.
      qDrag.setFromAxisAngle(dragAxisY, dx * DRAG_SPEED);
      qPitch.setFromAxisAngle(dragAxisX, dy * DRAG_SPEED);
      spinGroup.quaternion.premultiply(qDrag.multiply(qPitch)).normalize();
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      domElement.style.cursor = 'grab';

      const wasClick = travel < CLICK_SLOP_PX && event.timeStamp - pressedAt < CLICK_MAX_MS;
      if (!wasClick) return;

      // A click on a pin selects it; a click on anything else — bare land, the
      // ocean, empty space — closes whatever is open.
      const pin = pinAt(event.clientX, event.clientY);
      selectRegion(pin ? pin.regionId : null);
    };

    // Hover is recorded here and resolved once per frame in the loop below —
    // testing on the move event itself would fire several times per frame for
    // no benefit.
    const handleHoverMove = (event: PointerEvent) => {
      hoverX = event.clientX;
      hoverY = event.clientY;
      isHovering = true;
    };

    const handleHoverLeave = () => {
      isHovering = false;
    };

    domElement.addEventListener('pointerdown', handlePointerDown);
    domElement.addEventListener('pointermove', handleHoverMove);
    domElement.addEventListener('pointerleave', handleHoverLeave);
    // Window-level, not canvas-level, so a drag keeps working past the edges and
    // a release outside the canvas cannot leave it stuck mid-drag.
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    /* Reduced motion -------------------------------------------------------- */
    // There is no pause button any more, so this is the only way out of a
    // permanently spinning globe. It holds the baked animations too, not just the
    // yaw — a still planet with planes circling it would miss the point. Drag
    // still works, so the model stays explorable.
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = motionQuery.matches;
    const onMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
    };
    motionQuery.addEventListener('change', onMotionChange);

    /* Animation loop -------------------------------------------------------- */
    // Hand-rolled rather than THREE.Clock, which is deprecated as of three 0.185.
    // Delta is clamped so a backgrounded tab does not resume by jumping the spin
    // and the mixer forward by however many seconds it was away.
    let previousFrameAt = performance.now();
    let frameId = 0;

    // In-flight turn-to-face, if any.
    const focusFrom = new THREE.Quaternion();
    const focusTo = new THREE.Quaternion();
    const facing = new THREE.Vector3();
    const qSpin = new THREE.Quaternion();
    // Scratch for the axis spring below.
    const pole = new THREE.Vector3();
    const qUpright = new THREE.Quaternion();
    const qStep = new THREE.Quaternion();
    let focusStartedAt = 0;
    let isFocusing = false;

    const animate = () => {
      frameId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = Math.min((now - previousFrameAt) / 1000, 0.1);
      previousFrameAt = now;

      // A selection was made since the last frame: start turning that region
      // round to the camera. Reading it here rather than in a React effect keeps
      // the yaw owned by one place.
      const pendingAnchor = pendingFocusRef.current;
      if (pendingAnchor) {
        pendingFocusRef.current = null;
        focusFrom.copy(spinGroup.quaternion);

        // Shortest arc that carries the anchor to where the camera is looking.
        // Composing that onto the current orientation rather than replacing it
        // keeps whatever tumble the user has already dialled in — the globe
        // turns the short way to the region instead of snapping upright first.
        facing.set(pendingAnchor[0], pendingAnchor[1], pendingAnchor[2])
          .applyQuaternion(spinGroup.quaternion)
          .normalize();
        focusTo
          .setFromUnitVectors(facing, FACE_DIR)
          .multiply(spinGroup.quaternion)
          .normalize();

        focusStartedAt = now;
        isFocusing = !reducedMotion;
        if (reducedMotion) spinGroup.quaternion.copy(focusTo);
      }

      if (isFocusing) {
        const t = Math.min((now - focusStartedAt) / FOCUS_MS, 1);
        spinGroup.quaternion.copy(focusFrom).slerp(focusTo, easeOutCubic(t));
        if (t === 1 || isDragging) isFocusing = false;
      }

      // Axis spring. The target offset is whatever the drag has reached, capped
      // at MAX_TILT_RAD, while the pointer is down — and zero once it is
      // released. One easing serves both: pushing past the limit is resisted
      // each frame rather than stopped dead, so it feels rubbery, and letting go
      // unwinds instead of snapping.
      //
      // The correction turns about an axis perpendicular to both poles, so it
      // carries no yaw of its own — whatever longitude the user dragged round to
      // is exactly where it stays.
      //
      // Suspended while focusing and while a card is open, which is the same
      // guard the auto-spin uses. Turning a region to face the camera puts the
      // pole legitimately past the drag limit — the Europe pin, at 55°N, needs
      // 35° — and a spring running then would pull the region off the front
      // mid-sentence.
      // Coming back *out* of a focus, the first drag eases the pole down from
      // there rather than jumping, because this is rate-based rather than a
      // hard clamp.
      if (!isFocusing && selectedIndexRef.current < 0) {
        pole.copy(LOCAL_POLE).applyQuaternion(spinGroup.quaternion);
        const offset = pole.angleTo(LOCAL_POLE);
        const target = isDragging ? Math.min(offset, MAX_TILT_RAD) : 0;

        if (offset > target + 1e-4) {
          const rate = isDragging ? RESIST_RATE : RETURN_RATE;
          // Reduced motion still bounds the tilt and still rights the axis — it
          // just does it without the travel, the same way the turn-to-face snaps.
          const ease = reducedMotion ? 1 : 1 - Math.exp(-delta * rate);
          // setFromUnitVectors gives the whole correction as a rotation of
          // `offset` about a fixed axis, so slerping identity toward it by t
          // rotates by exactly t * offset — the fraction is the arithmetic.
          qUpright.setFromUnitVectors(pole, LOCAL_POLE);
          qStep.identity().slerp(qUpright, ((offset - target) / offset) * ease);
          spinGroup.quaternion.premultiply(qStep).normalize();
        }
      }

      if (!reducedMotion) {
        mixer?.update(delta);
        // Hold the globe still while a card is open — it is being read against,
        // and a region that drifts off the limb mid-sentence is worse than no
        // motion at all. Dragging still works, and closing the card resumes it.
        if (!isDragging && !isFocusing && selectedIndexRef.current < 0) {
          // Post-multiplied, so this turns about the globe's own pole rather
          // than a fixed screen axis: once the user has tipped the planet, it
          // keeps rotating about its axis the way a planet does, instead of
          // snapping back to spinning about screen-vertical.
          qSpin.setFromAxisAngle(LOCAL_POLE, delta * SPIN_RATE);
          spinGroup.quaternion.multiply(qSpin).normalize();
        }
      }

      // Pins. Seat or raise each one, and refresh the head positions the hit
      // test reads — so this has to run before the hover test below, and before
      // the render, or the pins lag a frame behind the globe.
      if (pinField) {
        const selectedId =
          selectedIndexRef.current >= 0 ? REGIONS[selectedIndexRef.current].id : null;
        updatePins(
          pinField,
          delta,
          (pin) => pin.regionId === hoveredRegionId || pin.regionId === selectedId,
          reducedMotion
        );
      }

      // Hover, once per frame. Skipped mid-drag: the cursor is already 'grabbing'
      // and the answer would be thrown away.
      if (!isDragging) {
        const over = isHovering ? pinAt(hoverX, hoverY) : null;
        hoveredRegionId = over ? over.regionId : null;
        domElement.style.cursor = over ? 'pointer' : 'grab';
      } else {
        hoveredRegionId = null;
      }

      renderer.render(scene, camera);
    };
    animate();

    /* Resize ---------------------------------------------------------------- */
    // The distance has to be recomputed, not just the aspect: which view
    // half-angle binds flips with aspect ratio, so a model framed for desktop is
    // cropped left and right on a phone.
    const handleResize = () => {
      const w = mountNode.clientWidth;
      const h = mountNode.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      applyCamera();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isActive = false;
      cancelAnimationFrame(frameId);
      // Otherwise the seam above keeps a torn-down scene alive, and StrictMode's
      // second mount would leave the first mount's group reachable.
      if (import.meta.env.DEV) {
        delete (window as unknown as Record<string, unknown>).__globeTilt;
        delete (window as unknown as Record<string, unknown>).__pinScreen;
      }
      window.removeEventListener('resize', handleResize);
      motionQuery.removeEventListener('change', onMotionChange);
      domElement.removeEventListener('pointerdown', handlePointerDown);
      domElement.removeEventListener('pointermove', handleHoverMove);
      domElement.removeEventListener('pointerleave', handleHoverLeave);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      if (mixer) {
        mixer.stopAllAction();
        mixer.uncacheRoot(mixer.getRoot());
      }

      // The pins' buffers are shared across all seven meshes, so the generic
      // scene.traverse below would dispose each of them repeatedly. Doing it
      // once here is both correct and clearer about who owns them.
      pinField?.dispose();

      if (domElement.parentNode === mountNode) {
        mountNode.removeChild(domElement);
      }

      // Dispose before the context goes away — disposing afterwards is a no-op.
      const disposeMaterial = (material: THREE.Material) => {
        // Enumerate the material's own properties rather than naming map /
        // normalMap / emissiveMap, so a map this model happens to carry cannot be
        // missed. Texture.dispose() is safe to call twice, which matters because
        // glTF materials share texture instances freely.
        for (const value of Object.values(material as unknown as Record<string, unknown>)) {
          if (value && (value as THREE.Texture).isTexture) (value as THREE.Texture).dispose();
        }
        material.dispose();
      };

      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) material.forEach(disposeMaterial);
        else if (material) disposeMaterial(material);
      });
      scene.clear();

      renderer.dispose();
    };
  }, []);

  const selectedRegion = selectedId
    ? REGIONS.find((region) => region.id === selectedId) ?? null
    : null;

  return (
    <div className="relative w-full h-[520px] sm:h-[600px] md:h-[680px] rounded-3xl overflow-hidden select-none">
      {/* On a phone the sheet takes the lower 55% of a 520px-tall canvas, and the
          globe is centred in it, so without this only the polar cap clears the
          card. Lifting the canvas by 16% of its height brings about two-thirds of
          the Earth back above the sheet. Transforming the element rather than the
          scene keeps the raycast honest — NDC is computed from
          getBoundingClientRect(), which already accounts for the transform. From
          md: up the card is docked in a corner and nothing needs to move. */}
      <div
        ref={mountRef}
        className={`absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing
          transition-transform duration-500 ease-out motion-reduce:transition-none
          ${selectedId ? '-translate-y-[16%] md:translate-y-0' : ''}`}
      />

      {/* Keyboard and screen-reader path to the same regions. A canvas cannot be
          tabbed into and a raycast cannot be triggered without a pointer, so
          without these the feature simply would not exist for anyone not using a
          mouse. Invisible, and it costs the layout nothing. */}
      <ul className="sr-only">
        {REGIONS.map((region) => (
          <li key={region.id}>
            <button type="button" onClick={() => selectRegion(region.id)}>
              Show economic data for {region.name}
            </button>
          </li>
        ))}
      </ul>

      <RegionSheet
        region={selectedRegion}
        meta={REGION_META}
        onClose={() => selectRegion(null)}
      />
    </div>
  );
};
