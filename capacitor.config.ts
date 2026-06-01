import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.damia.sololeveler",
  appName: "Solo Leveler",
  webDir: "dist",
  loggingBehavior: "none",
  server: {
    androidScheme: "https",
  },
  plugins: {
    BluetoothLe: {
      displayStrings: {
        scanning: "Skanowanie opasek...",
        cancel: "Anuluj",
        availableDevices: "Dostępne urządzenia",
        noDeviceFound: "Nie znaleziono opaski",
      },
    },
  },
};

export default config;
