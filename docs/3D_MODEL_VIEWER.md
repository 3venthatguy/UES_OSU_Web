# 3D Earth Viewer (`EarthModel.tsx`)

A hand-rolled Three.js scene wired into React via `useRef` + a single mount `useEffect`, **not** `@react-three/fiber`. If you're touching 3D rendering anywhere in this app, this is the only precedent to follow.

The hero Earth is **an authored `.glb`, loaded at runtime**. It is the hero's only network asset, and the splash screen's progress bar is measuring it.

## Where it's used

Mounted once, inside `HeroSection.tsx` (`<EarthModel />`, no props). It is the visual centerpiece of the landing page, layered in front of the giant background wordmark.

## The asset

`public/assets/earth-cartoon/earth-cartoon.glb` — 4.27 MiB, glTF 2.0 binary, registered as `ASSETS.models.earthCartoonGlb`.

**Self-contained.** All six images are `bufferView`-backed with no `uri`, so geometry and textures arrive in one request. The Sketchfab-style export originally shipped a sibling `textures/` folder holding loose copies of those same six images; it was pure dead weight in `dist/` and has been deleted. If you re-download the asset pack, delete `textures/` and `source/` again and keep the `.glb` flat in `earth-cartoon/`.

Contents: 28 meshes, 46 nodes, 8 materials (`tierra`, `agua`, `Atlas_1`, `Atlas.2`, `ballena`, `ox-logo`, `vegetación`, `nube`). The ocean sphere is radius 1 at the origin; clouds and aircraft orbit out to roughly 1.8.

### Animations

Two baked clips, both ~30 s and both looping:

| Clip | Channels | Drives |
|---|---|---|
| `Animación` | 96 | Orbiting aircraft, propeller spin, drifting cloud puffs, one whale armature |
| `Armature.002Action` | 6 | A second whale tail |

Played through a single `AnimationMixer` rooted on the loaded scene. Three meshes (`colaBallena.001/.002/.003`) are **skinned**.

### Vendor branding is stripped at load — do not "fix" this

The asset ships with the model author's (Onirix) logo in **two** places, and `isVendorBranding()` has to catch both:

1. **Nodes named `ox-logo.*`** (4 of them) — small sign boards standing off the surface at ~1.36 radius. These read as map pins, and the hero explicitly must not have pins.
2. **Nodes `avion.004` and `avion.001`** — banners towed behind the two aircraft. **Their names give nothing away.** What identifies them is the `ox-logo` material, and their UVs sample U 0.151–0.856 × V 0.404–0.597 of `Logo.png`, which is exactly the vendor's mark plus wordmark.

Hence the predicate tests **material name as well as node name**. Matching only on `ox-logo*` names leaves two Onirix banners flying around the planet.

The banners are siblings/children of the plane bodies rather than part of them, so dropping them leaves both aircraft flying with their animated propellers intact.

Two follow-on details, both load-bearing:

- **Names are sanitized.** `GLTFLoader` runs node names through `PropertyBinding.sanitizeNodeName`, which *strips* `.` — the runtime name is `ox-logo008`, not `ox-logo.008`. Match by prefix, never against an exact-name list. (The original is preserved on `userData.name`.)
- **Animation tracks must be filtered to match.** Several removed nodes are animation targets. Leaving their tracks in makes the mixer log a `PropertyBinding: No target node found` warning *per track* on bind. Track names are `<sanitizedNodeName>.<property>`, and since sanitizing already removed dots from the node name, `track.name.split('.')[0]` is unambiguously the node. Clips that end up empty are dropped entirely.

When removing the nodes, **dispose geometry only, never materials.** glTF materials are shared by index across the whole file — the sign boards use the same `Atlas.2` instance as the ships, planes and buildings being kept, so disposing it blanks out half the model. The orphaned `ox-logo` material is never rendered and so never reaches the GPU; leaving it to GC is correct.

## Scene setup (all inside the mount `useEffect`)

1. **Scene** — plain `THREE.Scene`.
2. **Camera** — `PerspectiveCamera(fov=38)`, positioned by `applyCamera()` rather than hardcoded (see camera fit below).
3. **Renderer** — `WebGLRenderer({alpha, antialias, powerPreference})`, transparent background so the page's cream shows through, DPR capped at 2. Shadows are off. The construction is wrapped in **its own guard** — a throw here (no WebGL) would otherwise leave `markModelReady()` uncalled, so it calls it and returns early instead.
4. **Lights** — ambient, a key directional from upper-left-front, a cool fill from the opposite corner, and a hemisphere bounce. Deliberately **soft**: every material is `baseColorTexture`-driven with the cartoon shading already painted into the sheet, so a hot key light blows out the land texture rather than adding form. The rig's only job is a gentle left-to-right falloff across the sphere.
5. **Transform hierarchy** — two nested groups:

```
tiltGroup   rotation.z = −AXIAL_TILT_RAD (16°, so the spin axis isn't dead vertical)
└ spinGroup quaternion  = auto-spin + free drag
```

`spinGroup` carries a **quaternion, not Euler angles**. See "Free rotation" below for why; the short version is that yaw-and-pitch cannot express "follow the pointer in any direction" without a clamp, and a clamp is exactly what was asked to go away.

Because `tiltGroup`'s transform is a constant, `TILT_QUAT`/`TILT_INV` are built once at module scope rather than read back off the object — everything the drag and the focus do happens in `spinGroup`'s *parent* frame, which is `tiltGroup`'s local space.

## Fit and framing

After load the model is centred on the origin — **not** rested on `y = 0`, since it's a sphere and must spin about its own axis — and uniformly scaled so its radius is `MODEL_RADIUS` (5).

> **Radius is half the largest `Box3` dimension, NOT `Box3.getBoundingSphere()`.** That method returns the half-*diagonal*, which for a roughly spherical model over-estimates by up to √3 and frames the planet at about a third of the size it should be. This was an actual bug during implementation; the symptom is a correct-looking but conspicuously tiny globe.

`fitDistance(radius, fov, aspect, fill)` then returns the distance at which the model fills `fill` of the tighter view half-angle. **This must be recomputed on resize, not just the aspect** — which half-angle binds flips with aspect ratio: a desktop box is vertically bound, a 375 px phone box is horizontally bound and has to pull back roughly a third further. A hardcoded camera position crops the globe left and right on mobile.

`CAMERA_FILL` is 0.82. It's under 1 because the bounding box is measured in the **rest pose** — the planes and cloud puffs orbit outward from there, and the slack absorbs their excursion. (The procedural predecessor used 0.72, but only to clear an info card and control bar that no longer exist.)

**Frustum culling is disabled on every mesh.** Baked node animation swings the planes and cloud puffs well outside the bounding volumes they were authored with, and the whale tails are skinned — both make Three cull meshes that are actually on screen. The model is small and always fully in frame, so culling buys nothing here.

## Interaction model

Seven **map pins** stand on the globe, one at the centre of each World Bank economic region. Hovering pulls a pin out of the surface; clicking it opens that region's card. The land itself is not a target — a click anywhere else dismisses whatever is open.

This replaced a fragment shader that tinted the land to show a region's true extent. That could colour an exact shape, but it needed a whole nearest-anchor classifier behind it and gave no hint anything was clickable until you were already hovering. A pin says "press me" without being told. (The classifier and the shader — `regionPicker.ts` and `regionHighlight.ts` — were deleted with it. The fitted per-region `anchor` vectors went too; they are in git if land-clicking is ever wanted back.)

**The one rule that survives from the hero's original "no pins" instruction still holds:** the vendor's Onirix logo sign-boards are stripped at load and must stay stripped. That rule was about third-party branding masquerading as map pins, and about a set of *fabricated* economic markers. These pins are functional UI for real, sourced World Bank series.

- **Drag-to-rotate, free in yaw and sprung off the axis:** `pointerdown` on the canvas, `pointermove`/`pointerup`/`pointercancel` on `window`, so a drag continues past the canvas edges and a release outside it can't leave the globe stuck mid-drag. Both axes respond; see "The axis spring" below for what happens to the vertical one.
- `renderer.domElement.style.touchAction = 'pan-y'` — **not** `'none'`. The canvas is 520 px tall at the very top of the page, so claiming every gesture would trap the scroll. A vertical swipe that *starts* vertical scrolls the page; once the browser has resolved a gesture as a globe drag (i.e. it began horizontally), every subsequent move including vertical reaches us, so touch users can still tip the planet — they just have to start sideways.
- `if (!event.isPrimary) return` on pointerdown, so a second finger can't hijack an in-progress drag.
- **Click vs drag:** a press counts as a click only if the pointer travelled under `CLICK_SLOP_PX` (6) and was down for under `CLICK_MAX_MS` (400). Without this *every drag ending over a pin selects it*. `travel` accumulates absolute movement rather than start-to-end distance, so a drag that wanders out and back still counts as a drag.
- **Hover** is recorded on the canvas' own `pointermove` but resolved **once per frame in the animate loop**.

### The axis spring

The globe spins about one axis, tilted 16°, and a drag is treated as a **push against that axis rather than a new orientation to keep**:

- **Yaw is completely free.** Drag all the way round, in either direction, and that is where it stays. Nothing rewinds it.
- **The pole is bounded and sprung.** A drag can tip it up to `MAX_TILT_RAD` (28°) off the tilt axis; past that it is pulled back each frame at `RESIST_RATE` (9), so it resists rather than hitting a wall. On release it returns to the axis at `RETURN_RATE` (2.5), about 1.2 s.

Without it the axis simply stayed wherever a drag left it, so one vertical drag left the planet spinning about an arbitrary pole for the rest of the session.

All of it lives in the frame loop, **not in `pointermove`**. Pointer events are not frame-paced: a limit applied there would step by however far a fast drag moved between events, while a rate applied per frame with `delta` is frame-rate independent, the same way the pin lift is. The correction turns about an axis perpendicular to both poles, which is what makes it carry no yaw of its own.

> **It is suspended while focusing and while a card is open** — the same guard the auto-spin uses. Turning a region to face the camera legitimately puts the pole past the limit (the Europe pin, at 55°N, needs 35°), and a spring running then would pull the region off the front mid-sentence. Because it is rate-based rather than a hard clamp, coming back out of a focus eases the pole down instead of jumping. **Closing a card therefore moves the globe** — the axis rights itself and carries the region that was centred up to 35° away with it. Anything that needs a pin's position after a card closes has to re-read it.

Under `prefers-reduced-motion` the correction is applied in full each frame instead of eased: the tilt is still bounded, the axis still returns, there is just no travel.

`window.__globeTilt()` reports the current offset in degrees. It is a **dev-only test seam** (`import.meta.env.DEV`, so Vite drops it from the production bundle), and it exists because a screenshot cannot tell a tilt from a yaw: dragging vertically about a *tilted* axis imparts real yaw as well — a 170 px drag is 78° about an axis 16° off perpendicular, whose twist component is ~25° — and the spring removes only the tilt, correctly. A pixel diff after release therefore shows a large and entirely legitimate residual, and says nothing either way about the axis.

### The pins

Built by [`src/lib/regionPins.ts`](../src/lib/regionPins.ts): a cone tapering to a buried tip, a sphere head, and a pale dot. All seven **share one geometry set and one material** — seven meshes, three buffers.

Proportions matter more than they look, and they are held as ratios so the whole pin can be scaled in one place. The spike is long and its top radius close to the head's; a short spike much narrower than the head reads as a lollipop, and on a globe already covered in low-poly trees a lollipop just looks like more scenery. The pale dot sits on **top** of the head, not its front: a pin planted radially has no front, so a face-on dot would point somewhere arbitrary, while up the pin's axis always faces away from the planet.

`PIN_LIFT` is deliberately **not** scaled with the geometry. At the current size it is more than half a pin height of travel, which is what keeps hover legible on a head only ~20 px across.

They are parented to **`gltf.scene`**, the frame the `pin` vectors were measured in and the one the land sphere is centred on. That needs no matrix composition at all — the pins inherit the model's centring offset, the wrapper's fit scale and the spin for free, and a pin at `dir * SEATED_RADIUS` lands on the surface exactly.

> **They are added *after* `Box3.setFromObject(model)`.** Adding them earlier puts them inside the measured bounds, which inflates the fit radius and silently shrinks the whole globe.

### Hit testing is screen-space, not a raycast

Each pin's head is projected to the canvas and the nearest one within `PIN_HIT_RADIUS_PX` (30) wins. The head draws about 20 px across on desktop and 17 px on a phone, so testing the geometry would make the pins a fussy target; a fixed pixel radius is uniform at every resolution and needs no `Raycaster` at all.

Three things are load-bearing:

- **Camera-facing only.** A far-side pin is hidden behind the opaque ocean but still projects onto the canvas. Without `(pinWorld − globeCentre) · (cameraPos − globeCentre) > 0` you can hover a pin straight through the planet.
- **Tie-break by depth** when two pins overlap near the limb, so the nearer one wins rather than whichever the loop reached first.
- **The target is the pin's *seated* head (`hitWorld`), not where the head is drawn right now.** Hit-testing the live head makes the target move the moment you hit it: a pin near the limb lifts largely *across* the screen, so the cursor that just raised it can end up outside the radius, which drops the pin, which brings the head back under the cursor — a flicker loop. This was a real bug, found by a test that could hover a pin once and then not again.

`globeCentre` is `model.getWorldPosition()` — the land sphere sits at that object's local origin.

`window.__pinScreen()` reports every pin's id, screen position and `facing` flag. Like `__globeTilt` it is **dev-only** and exists for tests: pin positions are the one thing an end-to-end test cannot work out for itself (see the parallax note below, and the merged-blob problem in the pin history). It reports positions only — a test still has to hover and click them to prove anything.

### The lift

`updatePins` eases each pin toward its target height every frame:

```
lift += (target − lift) * (1 − Math.exp(−dt * LIFT_RATE))   // LIFT_RATE 12, ~250ms
position = dir * (SEATED_RADIUS + lift)
```

Exponential smoothing rather than a fixed-duration tween: frame-rate independent, and interruptible — the pointer can leave halfway up and the pin turns around from wherever it is instead of jumping. Under `prefers-reduced-motion` the lift is applied directly; it is information, so it stays, and only the travel goes.

A hovered or selected pin also grows to `HOVER_SCALE` (1.3), and that number is larger than it first appears to need. **The lift alone is not enough feedback everywhere:** a pin near the limb visibly rises out of the surface, but the pin pointing straight at the camera — the one you are most likely to be hovering, since selecting a region turns it to face you — moves almost purely along the view axis, where a lift is nearly invisible. The growth is the part that reads at every orientation.

A selected pin stays raised while its card is open, so the card has a visible source.

### Where the pins stand

One vector per region, `pin` in `economicRegions.json`, doing three jobs: it is where the pin is planted, what the hit test measures against, and what the camera turns to on selection.

Four are the region's **GDP-weighted centre**, snapped onto mesh terrain so no pin floats over water. Three are placed by hand at a named place instead — Latin America at the centre of South America, Middle East & North Africa on Egypt, Europe & Central Asia on Russia.

They are measured against **the mesh, not real coordinates.** The model is a genuine Earth (its land covers 32.8 % of the sphere against 29 % for the real one) but a stylised export: about **+72°** of longitude offset with local distortion up to ~10°. Real-world lat/lon would miss.

Two consequences worth knowing before moving a pin:

- **This globe has no European Russia.** Everything from the Baltic to the Urals between roughly 48°N and 60°N is drawn as open water — Moscow, Kyiv, Warsaw and St Petersburg are all off the coast, with the nearest land vertex 2–4° away and belonging to a side wall. The nearest *solid* land to Moscow, meaning at least 4° from any coastline (a pin head is ~2.3° of arc across), is 18° east at 55°N 70°E, which is where the Europe & Central Asia pin stands.
- **The mesh's South America is drawn well south of the real one**, so the Latin America pin is the drawn continent's own area-weighted centre (25.1°S 57.7°W) rather than a real-world "centre of South America" such as Cuiabá — which sits high on the drawn shape, 7° from its northern coast and 33° from its southern one.

### Re-measuring the pin positions

If the `.glb` is re-exported, or a region is added:

1. Parse the GLB's JSON + BIN chunks and pull `POSITION` for mesh `Sphere.003`.
2. Keep only **top-skin** triangles — all three vertices at local radius ≥ 1.045. (The land is an extruded shell: outer skin ~1.0531, side walls and underside at 0.82–1.0.) `SURFACE_RADIUS` in `regionPins.ts` comes from this.
3. Convert the target with `model_lon = real_lon + 72` and test point-in-spherical-triangle; walk outward in 1° rings until it lands inside one.
4. **Check the clearance, not just that it is on land.** Walking outward until *any* triangle is hit can land a pin on a 2°-wide islet, which the head then covers completely — the first Moscow candidate did exactly that. Require the point to be ≥ 4° from open water in every direction.
5. Screenshot it. The distortion is local, so being on land in the data does not settle where the pin *looks* like it is.

### Turning a selection to face the camera

Selecting a region slerps `spinGroup.quaternion` over `FOCUS_MS` (700) so its pin comes round to the front. The target is the **shortest arc** carrying the pin direction to `FACE_DIR`, composed onto the current orientation rather than replacing it — so the globe turns the short way and keeps whatever tumble the user has dialled in, instead of snapping upright first.

> **A focused pin does not land at the exact centre of the canvas, and not at the same pixel every time.** The model is centred on its *full* bounding box, which includes asymmetric clouds and aircraft, so the land sphere sits about 19 % of its radius off the spin origin. The parallax puts a focused pin up to ~40 px from the centre depending which way the globe had to turn. Nothing should assume a fixed pixel — ask `__pinScreen()` instead. And note that **closing the card moves it again**, because the axis spring resumes; measure after the close, never before.

### Keyboard and screen readers

A `sr-only` `<ul>` of real `<button>`s, one per region, calls the same selection path. A canvas can't be tabbed into and a raycast can't be triggered without a pointer, so without these the feature simply wouldn't exist for anyone not using a mouse. It also makes the calibration check above possible.

### Reduced motion

`prefers-reduced-motion: reduce` **holds the baked animations as well as the yaw** — a still planet with aircraft circling it would miss the point. Drag, clicking and region selection all still work, so the model stays explorable; the turn-to-face snaps instead of easing, the pin lift is applied without travel, and the axis spring rights the pole in one frame. With the pause button gone this is the only way out of a permanently spinning globe, so don't drop it.

### Frame loop

Hand-rolled timing via `performance.now()`, not `THREE.Clock` — `Clock` is deprecated as of three 0.185 and warns on construction. Delta is clamped to 0.1 s so a backgrounded tab doesn't resume by jumping the spin and the mixer forward by however many seconds it was away.

The loop also owns the yaw, the turn-to-face easing, the pin lift and the hover test. Since the effect runs once with `[]` deps it can't read `selectedId` directly, so two refs bridge the gap: `selectedIndexRef` (read each frame, to know whether to hold the spin and which pin to keep raised) and `pendingFocusRef` (a pin direction left for the loop to pick up and turn toward). `setSelectedId` needs no such treatment — a `useState` setter is identity-stable. **Keep the yaw owned by the loop**; driving it from a React effect as well would give two writers to one value.

## Cleanup

Sets `isActive = false`, cancels the RAF, removes all listeners, stops and uncaches the mixer, removes the canvas from the mount node, then **disposes every geometry, material and texture** via a `scene.traverse`. The material walk enumerates own properties looking for `.isTexture` rather than naming `map`/`normalMap`/etc., so a map this model happens to carry can't be missed — and `Texture.dispose()` is safe to call twice, which matters because glTF materials share texture instances freely. Order matters: dispose *before* `renderer.dispose()`, since disposing against a torn-down GL context is a no-op.

Two StrictMode hazards, both handled:

- The effect captures `mountRef.current` into a local `mountNode` rather than re-reading the ref in cleanup. StrictMode's dev-only mount→cleanup→mount detaches refs *before* running cleanup, so reading the ref there would see `null`, skip `removeChild`, and leave a stale canvas behind a live one.
- **The `isActive` guard is required, not defensive.** The load is async, and `THREE.Cache` holds the ArrayBuffer but *not* the parsed result — so StrictMode's second mount genuinely re-parses, and without the guard the late callback injects a second Earth into the first mount's discarded scene.

Empty dependency array (`[]`) — the scene is built once per mount. The component now holds React state (`selectedId`), but that state must **never** enter this effect's deps: re-running it would tear down and re-download the whole scene on every region click. That is what the two mirror refs above exist to avoid.

## Mobile layout coupling

On a phone the sheet takes the lower 55 % of a 520 px canvas and the globe is centred in it, so the mount div is lifted `-translate-y-[16%]` (below `md:` only) while a region is selected — otherwise only the polar cap clears the card. The transform is applied to the **element**, not the scene, which keeps the raycast honest: NDC is computed from `getBoundingClientRect()`, which already reports post-transform geometry. Note that this also means `boundingBox()` in any test already includes the lift; don't subtract it twice.

## Loading / splash coupling

`markModelReady()` is **the only signal that sets `ready`, and `SplashScreen` blocks its exit on it.** Any path that reaches the end of the mount effect without calling it strands the visitor for the full 25 s `AUTO_DISMISS_MS` — or indefinitely, since `SplashScreen` disables auto-dismiss once `failed` is set. It is therefore called from all three terminal paths: `onLoad`, `onError`, and the early return when WebGL is unavailable.

`reportModelBytes` feeds `GLTFLoader`'s `onProgress` slot, giving the splash a byte-accurate percentage. The loader is constructed with `sharedLoadingManager`, which is what routes a failed or blocked request into the `failed` flag and from there into SplashScreen's Retry button.

## Performance notes

- 4.27 MiB one-time payload, no shadow pass.
- `setPixelRatio(Math.min(window.devicePixelRatio, 2))` caps DPR to bound fragment cost.
- The RAF loop renders unconditionally — there is no visibility gating or on-demand rendering. That's the first knob if the hero ever shows up in a performance profile. Skinning and the mixer run every frame regardless of whether the canvas is scrolled out of view.
