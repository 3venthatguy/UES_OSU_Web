import * as THREE from 'three';
import { useSyncExternalStore } from 'react';

/**
 * Ready/progress store for the hero 3D scene.
 *
 * EarthModel fetches a single self-contained ~4.1 MiB .glb, so both halves of
 * this module are live: `reportModelBytes` drives a real byte-accurate progress
 * bar during the download, and `markModelReady` carries the "hero is ready"
 * signal to SplashScreen, which blocks its exit on it.
 *
 * This is loading telemetry, not application state — the app itself stays
 * prop-driven (see docs/STATE_AND_FORMS.md).
 */

// Load-bearing: it keeps StrictMode's double-invoked mount effect replaying the
// .glb from memory instead of re-fetching several megabytes.
THREE.Cache.enabled = true;

/** Progress is held below completion until the model is actually in the scene. */
const MAX_BEFORE_READY = 0.99;

export interface AssetLoadState {
  /** 0..1, monotonic non-decreasing. */
  progress: number;
  /** True once the parsed model has been added to the scene graph. */
  ready: boolean;
  /** True if any asset request errored. */
  failed: boolean;
}

let modelFraction = 0;
let ready = false;
let failed = false;

let snapshot: AssetLoadState = { progress: 0, ready: false, failed: false };
const listeners = new Set<() => void>();

const emit = () => {
  listeners.forEach((listener) => listener());
};

const recompute = () => {
  const capped = ready ? 1 : Math.min(modelFraction, MAX_BEFORE_READY);

  // Never move backwards: cache hits and StrictMode replays would otherwise make
  // the bar jump around.
  const progress = Math.max(snapshot.progress, capped);

  if (progress === snapshot.progress && ready === snapshot.ready && failed === snapshot.failed) {
    return;
  }

  snapshot = { progress, ready, failed };
  emit();
};

/**
 * Pass this to every loader whose bytes should count toward the splash.
 *
 * EarthModel's GLTFLoader is constructed with it, which is what routes a failed
 * or blocked .glb request into the `failed` flag below — and from there into
 * SplashScreen's Retry button.
 */
export const sharedLoadingManager = new THREE.LoadingManager();

// LoadingManager fires onProgress for failed items too (itemError is followed by
// itemEnd), so a request that 404s or is blocked would otherwise be credited as
// complete and drive the bar to 100% on a broken load.
const erroredUrls = new Set<string>();

sharedLoadingManager.onProgress = (url) => {
  if (erroredUrls.has(url)) return;

  // Progress normally arrives byte-by-byte via reportModelBytes; this fires once
  // the item is done, closing it out in case Content-Length was missing.
  modelFraction = 1;
  recompute();
};

sharedLoadingManager.onError = (url) => {
  erroredUrls.add(url);
  failed = true;
  recompute();
};

/**
 * Byte-accurate progress for the .glb, fed from GLTFLoader's onProgress slot.
 * `total` is 0 when the response has no Content-Length (some hosts omit it when
 * compressing) — in that case we leave the bar to the splash's stall-creep rather
 * than reporting a fraction we can't compute.
 */
export function reportModelBytes(loaded: number, total: number): void {
  if (total <= 0) return;
  modelFraction = Math.max(modelFraction, Math.min(loaded / total, 1));
  recompute();
}

/**
 * Called once the hero model is parsed and in the scene graph — or has provably
 * failed to get there. EarthModel calls it from its GLTFLoader onLoad, from its
 * onError, and from its early return when WebGL is unavailable.
 *
 * This is the only signal that sets `ready`, and SplashScreen blocks its exit on
 * it, so any code path that can reach the end of the mount effect without
 * calling this strands the visitor behind the curtain for the full
 * AUTO_DISMISS_MS (and in the error state, indefinitely — SplashScreen disables
 * auto-dismiss when `failed` is set).
 */
export function markModelReady(): void {
  ready = true;
  modelFraction = 1;
  recompute();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => snapshot;

/** Subscribe a component to hero asset load progress. */
export function useAssetLoad(): AssetLoadState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
