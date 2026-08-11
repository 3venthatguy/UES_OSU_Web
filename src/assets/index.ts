// UES Asset Folder System Registry
export const ASSETS = {
  logo: {
    jpeg: '/assets/logo/logo.jpeg',
  },
  // Officer headshots are not listed here — they resolve from an officer's id
  // against src/assets/profiles/. See src/lib/profilePhotos.ts.
  events: {
    caseCompKickoff: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=600',
    fedReservePanel: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=600',
    econometricsWorkshop: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=600',
    networkingNight: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=600',
  },
  models: {
    // The hero's cartoon Earth, and its only 3D asset. Self-contained glTF 2.0
    // binary: geometry and all six textures live in the .glb's binary chunk, so
    // this is the single network request the hero waits on — no sibling texture
    // folder is needed, and shipping one would be dead weight.
    //
    // Carries two ~30s animation clips (orbiting planes, drifting clouds, rigged
    // whale tails) that EarthModel plays through an AnimationMixer.
    earthCartoonGlb: '/assets/earth-cartoon/earth-cartoon.glb',
  },
} as const;
