import type { PluginListenerHandle } from "@capacitor/core";
import { Capacitor, registerPlugin } from "@capacitor/core";
import type { MotionSample } from "./motionTracking";

type MotionVector = {
  x?: number | null;
  y?: number | null;
  z?: number | null;
};

type NativeMotionSample = {
  source: "android-native";
  timestamp: number;
  interval?: number;
  acceleration?: MotionVector;
  accelerationIncludingGravity?: MotionVector;
};

type NativeSensorInfo = {
  available: boolean;
  name?: string;
  vendor?: string;
  resolution?: number;
  maximumRange?: number;
  minDelay?: number;
};

type NativeStartResult = {
  active: boolean;
  source: "android-native";
  intervalMs: number;
  sensorName?: string;
};

type HunterMotionPlugin = {
  isAvailable(): Promise<NativeSensorInfo>;
  start(options: { intervalMs: number; delayUs: number }): Promise<NativeStartResult>;
  stop(): Promise<void>;
  addListener(eventName: "sample", listenerFunc: (sample: NativeMotionSample) => void): Promise<PluginListenerHandle>;
  addListener(eventName: "accuracy", listenerFunc: (event: { accuracy: number; source: string }) => void): Promise<PluginListenerHandle>;
};

type WebDeviceMotionEventConstructor = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export type PhoneMotionSource = "android-native" | "web-devicemotion";

export type PhoneMotionSample = MotionSample & {
  source: PhoneMotionSource;
  intervalMs?: number;
  linearMagnitude?: number;
};

export type PhoneMotionAvailability = {
  available: boolean;
  source: PhoneMotionSource | "none";
  label: string;
  details?: string;
};

export type PhoneMotionSession = {
  source: PhoneMotionSource;
  label: string;
  stop: () => void;
};

const HunterMotion = registerPlugin<HunterMotionPlugin>("HunterMotion");

function isNativeHunterMotionAvailable() {
  return Capacitor.getPlatform() === "android" && Capacitor.isPluginAvailable("HunterMotion");
}

function getWebDeviceMotionConstructor() {
  if (typeof window === "undefined" || !("DeviceMotionEvent" in window)) return null;
  return DeviceMotionEvent as WebDeviceMotionEventConstructor;
}

function normalizeVector(vector?: MotionVector | null) {
  if (!vector) return null;
  return {
    x: Number(vector.x || 0),
    y: Number(vector.y || 0),
    z: Number(vector.z || 0),
  };
}

function vectorMagnitude(vector?: MotionVector | null) {
  const normalized = normalizeVector(vector);
  if (!normalized) return undefined;
  return Math.sqrt(normalized.x * normalized.x + normalized.y * normalized.y + normalized.z * normalized.z);
}

export async function getPhoneMotionAvailability(): Promise<PhoneMotionAvailability> {
  if (isNativeHunterMotionAvailable()) {
    try {
      const info = await HunterMotion.isAvailable();
      return {
        available: info.available,
        source: info.available ? "android-native" : "none",
        label: info.available ? "Android sensor" : "Brak akcelerometru",
        details: info.name ? `${info.name}${info.vendor ? ` / ${info.vendor}` : ""}` : undefined,
      };
    } catch {
      return {
        available: false,
        source: "none",
        label: "Sensor Android niedostępny",
      };
    }
  }

  return {
    available: getWebDeviceMotionConstructor() !== null,
    source: getWebDeviceMotionConstructor() ? "web-devicemotion" : "none",
    label: getWebDeviceMotionConstructor() ? "Web DeviceMotion" : "Brak sensora telefonu",
  };
}

export async function startPhoneMotionSensor(
  onSample: (sample: PhoneMotionSample) => void,
  options: { intervalMs?: number } = {}
): Promise<PhoneMotionSession> {
  const intervalMs = options.intervalMs ?? 32;

  if (isNativeHunterMotionAvailable()) {
    const info = await HunterMotion.isAvailable();
    if (!info.available) {
      throw new Error("Ten telefon nie udostępnia akcelerometru.");
    }

    const listener = await HunterMotion.addListener("sample", (event) => {
      const gravity = normalizeVector(event.accelerationIncludingGravity) || normalizeVector(event.acceleration);
      if (!gravity) return;

      onSample({
        x: gravity.x,
        y: gravity.y,
        z: gravity.z,
        timestamp: event.timestamp || Date.now(),
        source: "android-native",
        intervalMs: event.interval,
        linearMagnitude: vectorMagnitude(event.acceleration),
      });
    });

    let result: NativeStartResult;
    try {
      result = await HunterMotion.start({
        intervalMs,
        delayUs: Math.max(10000, intervalMs * 1000),
      });
    } catch (error) {
      await listener.remove();
      throw error;
    }

    return {
      source: "android-native",
      label: result.sensorName || "Android native sensor",
      stop: () => {
        void listener.remove();
        void HunterMotion.stop();
      },
    };
  }

  const MotionEventConstructor = getWebDeviceMotionConstructor();
  if (!MotionEventConstructor) {
    throw new Error("To urządzenie nie udostępnia akcelerometru przeglądarce.");
  }

  if (typeof MotionEventConstructor.requestPermission === "function") {
    const permission = await MotionEventConstructor.requestPermission();
    if (permission !== "granted") {
      throw new Error("Brak zgody na użycie czujników ruchu telefonu.");
    }
  }

  const handleMotion = (event: DeviceMotionEvent) => {
    const source = event.accelerationIncludingGravity || event.acceleration;
    if (!source) return;

    onSample({
      x: source.x || 0,
      y: source.y || 0,
      z: source.z || 0,
      timestamp: Date.now(),
      source: "web-devicemotion",
      intervalMs: event.interval || undefined,
      linearMagnitude: vectorMagnitude(event.acceleration),
    });
  };

  window.addEventListener("devicemotion", handleMotion, { passive: true });

  return {
    source: "web-devicemotion",
    label: "Web DeviceMotion",
    stop: () => window.removeEventListener("devicemotion", handleMotion),
  };
}
