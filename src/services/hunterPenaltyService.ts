import { Capacitor, registerPlugin } from "@capacitor/core";
import type { PenaltyIntensity } from "../types";

export type PenaltyPermissionStatus = {
  android: boolean;
  wallpaperAvailable: boolean;
  galleryPermissionGranted?: boolean;
  canWriteSettings: boolean;
  message: string;
};

type HunterPenaltyPlugin = {
  getStatus(): Promise<PenaltyPermissionStatus>;
  requestGalleryPermission(): Promise<PenaltyPermissionStatus>;
  setPenaltyWallpaper(options: { seed: string; intensity: PenaltyIntensity }): Promise<{ applied: boolean; message: string }>;
  canWriteSettings(): Promise<{ canWriteSettings: boolean; message: string }>;
  openWriteSettings(): Promise<{ opened: boolean; message: string }>;
  setFontScale(options: { scale: number }): Promise<{ applied: boolean; scale?: number; message: string }>;
  restoreFontScale(): Promise<{ restored: boolean; scale?: number; message: string }>;
};

const HunterPenalty = registerPlugin<HunterPenaltyPlugin>("HunterPenalty");

function isNativePenaltyAvailable() {
  return Capacitor.getPlatform() === "android" && Capacitor.isPluginAvailable("HunterPenalty");
}

export async function getPenaltyPermissionStatus(): Promise<PenaltyPermissionStatus> {
  if (!isNativePenaltyAvailable()) {
    return {
      android: false,
      wallpaperAvailable: false,
      galleryPermissionGranted: false,
      canWriteSettings: false,
      message: "Psoty telefonowe działają tylko w aplikacji Android. Web używa kar w aplikacji.",
    };
  }

  return HunterPenalty.getStatus();
}

export async function requestGalleryWallpaperAccess(): Promise<PenaltyPermissionStatus> {
  if (!isNativePenaltyAvailable()) {
    return {
      android: false,
      wallpaperAvailable: false,
      galleryPermissionGranted: false,
      canWriteSettings: false,
      message: "Galeria tapet jest dostępna tylko w aplikacji Android.",
    };
  }

  return HunterPenalty.requestGalleryPermission();
}

export async function setPenaltyWallpaper(seed: string, intensity: PenaltyIntensity) {
  if (!isNativePenaltyAvailable()) {
    return { applied: false, message: "Tapeta systemowa jest dostępna tylko w aplikacji Android." };
  }

  return HunterPenalty.setPenaltyWallpaper({ seed, intensity });
}

export async function checkWriteSettings() {
  if (!isNativePenaltyAvailable()) {
    return { canWriteSettings: false, message: "Zmiana czcionki wymaga aplikacji Android." };
  }

  return HunterPenalty.canWriteSettings();
}

export async function openWriteSettings() {
  if (!isNativePenaltyAvailable()) {
    return { opened: false, message: "Specjalny ekran WRITE_SETTINGS jest dostępny tylko na Androidzie." };
  }

  return HunterPenalty.openWriteSettings();
}

export async function setPenaltyFontScale(scale: number) {
  if (!isNativePenaltyAvailable()) {
    return { applied: false, message: "Zmiana czcionki telefonu jest dostępna tylko na Androidzie." };
  }

  return HunterPenalty.setFontScale({ scale });
}

export async function restorePenaltyFontScale() {
  if (!isNativePenaltyAvailable()) {
    return { restored: false, message: "Brak natywnej czcionki do przywrócenia w webie." };
  }

  return HunterPenalty.restoreFontScale();
}
