import * as THREE from 'three';
import type { EconomicRegion } from '../types';

/**
 * The map pins standing on the hero globe, one per economic region.
 *
 * These replaced a shader that tinted the land itself. That approach could
 * colour a region's true extent, but it needed the whole nearest-anchor
 * classifier behind it and gave no hint that anything was clickable until you
 * were already hovering. A pin says "press me" without being told.
 *
 * Everything here lives in the **glTF model's local frame**, which is the frame
 * the `pin` vectors were measured in and the one the land sphere is centred on.
 * Parenting the pins to `gltf.scene` therefore needs no matrix composition at
 * all: they inherit the model's centring offset, the wrapper's fit scale and
 * the globe's spin for free, and a pin at `dir * SEATED_RADIUS` lands on the
 * surface exactly.
 */

/** Radius of the land mesh's outer skin, in glTF units. Measured from the .glb. */
const SURFACE_RADIUS = 1.0531;

/**
 * Where a seated pin's tip sits — slightly *under* the surface, so the pin
 * reads as driven into the planet rather than balanced on it.
 */
const SEATED_RADIUS = SURFACE_RADIUS - 0.035;

/**
 * How far a pin rises when hovered or selected, in glTF units (~0.42 world).
 *
 * Deliberately held at this value when the pins were scaled down rather than
 * scaled with them: it is now more than half a pin height of travel, which is
 * what keeps hover legible on a head only ~20px across.
 */
export const PIN_LIFT = 0.14;

/**
 * Scale a pin grows to when hovered or selected.
 *
 * Larger than it looks like it needs to be, because the lift alone is not enough
 * feedback everywhere. A pin near the limb visibly rises out of the surface, but
 * the pin pointing straight at the camera — the one you are most likely to be
 * hovering, since selecting a region turns it to face you — moves almost purely
 * along the view axis, where a lift is nearly invisible. The growth is the part
 * that reads at every orientation.
 */
const HOVER_SCALE = 1.3;

/**
 * Rise/fall rate. Exponential smoothing rather than a fixed-duration tween:
 * frame-rate independent, and interruptible — the pointer can leave halfway up
 * and the pin turns around from wherever it is instead of jumping.
 */
const LIFT_RATE = 12;

/*
 * Pin proportions, glTF units. Total height ~0.25, about 0.75 in world units,
 * which draws a head roughly 20px across on a desktop canvas and 17px on a
 * 375px phone.
 *
 * The ratios are what matter and they are held fixed at any size: the spike is
 * deliberately long and its top radius close to the head's, which is what makes
 * the silhouette read as a *map pin* rather than a mushroom. A short spike much
 * narrower than the head gives a lollipop, and on a globe covered in low-poly
 * trees a lollipop just looks like more scenery.
 */
const SPIKE_LENGTH = 0.15;
const SPIKE_RADIUS = 0.0465;
const HEAD_RADIUS = 0.0585;

/** How far the head sinks into the top of the spike, so the two blend. */
const HEAD_OVERLAP = 0.0165;

/** Head centre, measured from the tip. Also where the hit test aims. */
const HEAD_CENTRE_Y = SPIKE_LENGTH - HEAD_OVERLAP + HEAD_RADIUS;

/**
 * A brightened sibling of the brand red `#B03A40` — same hue, pushed up in
 * value and saturation. The brand red itself is tuned for type and borders on a
 * cream page; at pin size, against the model's greens and blues and under a
 * deliberately soft light rig, it goes muddy.
 */
const BODY_COLOR = 0xe23c42;
const DOT_COLOR = 0xfffdf9;

/** +Y is the pin's own "up"; each pin is rotated so that points along its direction. */
const LOCAL_UP = new THREE.Vector3(0, 1, 0);

export interface RegionPin {
  regionId: string;
  /** Root object — position and scale are driven by `updatePins`. */
  object: THREE.Object3D;
  /** Outward unit direction in model-local space. */
  direction: THREE.Vector3;
  /**
   * World position the hit test measures against, refreshed by `updatePins`.
   *
   * This is where the head sits when the pin is **seated**, not where it is
   * drawn right now. Hit-testing the live head would make the target move the
   * moment you hit it: a pin near the limb lifts largely across the screen, so
   * the cursor that just raised it can end up outside the radius, dropping the
   * pin, which brings the head back under the cursor — a flicker loop. Aiming at
   * the seated position keeps the target still, and the drawn pin never leaves
   * it by more than its own lift.
   */
  hitWorld: THREE.Vector3;
  /** Current rise, in glTF units. */
  lift: number;
}

export interface PinField {
  /** Add this to the glTF scene root. */
  group: THREE.Group;
  pins: RegionPin[];
  dispose(): void;
}

/**
 * Builds one pin per region. Geometry and materials are created once and shared
 * by every pin — seven meshes, three buffers.
 */
export function createRegionPins(regions: EconomicRegion[]): PinField {
  // Cone points +Y by default with its apex up; flip it so the apex is the tip
  // at the bottom, then lift it so that tip sits at the object's origin.
  const spikeGeometry = new THREE.ConeGeometry(SPIKE_RADIUS, SPIKE_LENGTH, 16);
  spikeGeometry.rotateX(Math.PI);
  spikeGeometry.translate(0, SPIKE_LENGTH / 2, 0);

  const headGeometry = new THREE.SphereGeometry(HEAD_RADIUS, 20, 14);
  headGeometry.translate(0, HEAD_CENTRE_Y, 0);

  // The pale centre of a map pin, sunk into the *top* of the head rather than
  // its front. A pin planted radially has no front — it is rotated to stand
  // along its own bit of the globe, so a face-on dot would point somewhere
  // arbitrary. Up the pin's axis is the one direction that always faces away
  // from the planet, and so is visible wherever the pin has been turned.
  const dotGeometry = new THREE.SphereGeometry(HEAD_RADIUS * 0.42, 14, 10);
  dotGeometry.translate(0, HEAD_CENTRE_Y + HEAD_RADIUS * 0.72, 0);

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: BODY_COLOR,
    // Slightly glossier than the model's own materials, so the head catches the
    // key light and holds its brightness at the limb.
    roughness: 0.38,
    metalness: 0,
  });
  const dotMaterial = new THREE.MeshStandardMaterial({
    color: DOT_COLOR,
    roughness: 0.6,
    metalness: 0,
  });

  const group = new THREE.Group();
  const pins: RegionPin[] = [];

  for (const region of regions) {
    const object = new THREE.Group();
    object.name = `pin-${region.id}`;

    for (const [geometry, material] of [
      [spikeGeometry, bodyMaterial],
      [headGeometry, bodyMaterial],
      [dotGeometry, dotMaterial],
    ] as const) {
      const mesh = new THREE.Mesh(geometry, material);
      // Same reasoning as the rest of the model: it is small, always in frame,
      // and the globe's rotation moves it outside whatever bounds three.js
      // computed for it.
      mesh.frustumCulled = false;
      object.add(mesh);
    }

    const direction = new THREE.Vector3(...region.pin).normalize();
    // Stand the pin up along its own radius.
    object.quaternion.setFromUnitVectors(LOCAL_UP, direction);
    object.position.copy(direction).multiplyScalar(SEATED_RADIUS);

    group.add(object);
    pins.push({
      regionId: region.id,
      object,
      direction,
      hitWorld: new THREE.Vector3(),
      lift: 0,
    });
  }

  return {
    group,
    pins,
    dispose() {
      spikeGeometry.dispose();
      headGeometry.dispose();
      dotGeometry.dispose();
      bodyMaterial.dispose();
      dotMaterial.dispose();
    },
  };
}

/**
 * Eases every pin toward its target height and refreshes the cached head
 * position that hit testing reads.
 *
 * `raised` is asked per pin rather than passed as an index so hover and
 * selection can both raise one without this module knowing about either.
 * `instant` skips the easing under reduced motion — the lift is information, so
 * it stays; only the travel goes.
 */
export function updatePins(
  field: PinField,
  delta: number,
  raised: (pin: RegionPin) => boolean,
  instant: boolean
): void {
  const smoothing = 1 - Math.exp(-delta * LIFT_RATE);

  // Ancestors first, once for the whole field. The globe's rotation moved this
  // frame too, so the cached matrixWorld is a frame stale — enough to shift a
  // hit test near a pin's edge on a spinning globe.
  field.group.updateWorldMatrix(true, false);

  for (const pin of field.pins) {
    const target = raised(pin) ? PIN_LIFT : 0;
    pin.lift = instant ? target : pin.lift + (target - pin.lift) * smoothing;

    pin.object.position.copy(pin.direction).multiplyScalar(SEATED_RADIUS + pin.lift);

    const t = pin.lift / PIN_LIFT;
    pin.object.scale.setScalar(1 + (HOVER_SCALE - 1) * t);

    // The head's seated position: along the pin's own axis, which is its
    // direction, at the height the head sits when the pin is down. Deliberately
    // independent of `lift` — see hitWorld. Not the object origin either, which
    // is the buried tip and would put the target low.
    pin.hitWorld
      .copy(pin.direction)
      .multiplyScalar(SEATED_RADIUS + HEAD_CENTRE_Y)
      .applyMatrix4(field.group.matrixWorld);
  }
}
