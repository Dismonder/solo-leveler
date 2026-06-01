import { Capacitor, registerPlugin } from "@capacitor/core";

type HunterOrientationPlugin = {
  lockPortrait: () => Promise<void>;
  lockLandscape: () => Promise<void>;
  unlock: () => Promise<void>;
};

const HunterOrientation = registerPlugin<HunterOrientationPlugin>("HunterOrientation");

export function isNativeOrientationAvailable() {
  return Capacitor.getPlatform() === "android";
}

export async function lockAppPortrait() {
  if (!isNativeOrientationAvailable()) return;
  try {
    await HunterOrientation.lockPortrait();
  } catch {
    // Orientation is a UX enhancement; gameplay must still work if the native bridge is unavailable.
  }
}

export async function lockAppLandscape() {
  if (!isNativeOrientationAvailable()) return;
  try {
    await HunterOrientation.lockLandscape();
  } catch {
    // Orientation is a UX enhancement; gameplay must still work if the native bridge is unavailable.
  }
}

export async function unlockAppOrientation() {
  if (!isNativeOrientationAvailable()) return;
  try {
    await HunterOrientation.unlock();
  } catch {
    // Orientation is a UX enhancement; gameplay must still work if the native bridge is unavailable.
  }
}
