import {
  BleClient,
  ConnectionPriority,
  numberToUUID,
  ScanMode,
  type BleDevice,
  type BleService,
  type ScanResult,
} from "@capacitor-community/bluetooth-le";
import { Capacitor } from "@capacitor/core";

export type XiaomiBandConnectionMode = "native-scan" | "native-dialog" | "web-dialog";

export type XiaomiBandCapabilities = {
  battery: boolean;
  deviceInfo: boolean;
  heartRate: boolean;
  xiaomiPrivate: boolean;
  services: string[];
  characteristicsCount: number;
  rawServices: Array<{
    uuid: string;
    characteristics: string[];
    readable: number;
    notifying: number;
    writable: number;
  }>;
};

export type XiaomiBandSnapshot = {
  id?: string;
  name: string;
  batteryLevel?: number;
  heartRate?: number;
  manufacturer?: string;
  model?: string;
  connected: boolean;
  message: string;
  capabilities?: XiaomiBandCapabilities;
  connectionMode?: XiaomiBandConnectionMode;
  diagnostics?: string[];
  rssi?: number;
};

export type XiaomiBandCandidate = {
  id: string;
  name: string;
  localName?: string;
  rssi?: number;
  serviceUuids: string[];
  matchScore: number;
  matchReasons: string[];
  lastSeenAt: number;
};

export type XiaomiBandScanOptions = {
  timeoutMs?: number;
  onCandidate?: (candidate: XiaomiBandCandidate, candidates: XiaomiBandCandidate[]) => void;
};

export type XiaomiBandConnection = {
  deviceName: string;
  deviceId?: string;
  disconnect: () => void;
};

type BluetoothCharacteristicLike = {
  readValue(): Promise<DataView>;
  startNotifications?(): Promise<BluetoothCharacteristicLike>;
  addEventListener?(type: "characteristicvaluechanged", listener: EventListener): void;
  removeEventListener?(type: "characteristicvaluechanged", listener: EventListener): void;
  value?: DataView;
};

type BluetoothServiceLike = {
  getCharacteristic(characteristic: string): Promise<BluetoothCharacteristicLike>;
};

type BluetoothServerLike = {
  connect(): Promise<BluetoothServerLike>;
  disconnect?(): void;
  getPrimaryService(service: string): Promise<BluetoothServiceLike>;
};

type BluetoothDeviceLike = EventTarget & {
  name?: string;
  gatt?: BluetoothServerLike;
};

type BluetoothRequestOptions = {
  filters: Array<{ namePrefix: string }>;
  optionalServices: string[];
};

type BluetoothNavigator = Navigator & {
  bluetooth?: {
    requestDevice(options: BluetoothRequestOptions): Promise<BluetoothDeviceLike>;
  };
};

const LAST_DEVICE_STORAGE_KEY = "solo-leveler:last-xiaomi-band";

const XIAOMI_BAND_FILTERS = [
  { namePrefix: "Mi Band" },
  { namePrefix: "Mi Smart Band" },
  { namePrefix: "Xiaomi" },
  { namePrefix: "Xiaomi Smart Band" },
  { namePrefix: "Redmi" },
  { namePrefix: "Smart Band" },
  { namePrefix: "Band" },
];

const BATTERY_SERVICE = numberToUUID(0x180f).toLowerCase();
const BATTERY_LEVEL = numberToUUID(0x2a19).toLowerCase();
const DEVICE_INFORMATION_SERVICE = numberToUUID(0x180a).toLowerCase();
const MANUFACTURER_NAME = numberToUUID(0x2a29).toLowerCase();
const MODEL_NUMBER = numberToUUID(0x2a24).toLowerCase();
const HEART_RATE_SERVICE = numberToUUID(0x180d).toLowerCase();
const HEART_RATE_MEASUREMENT = numberToUUID(0x2a37).toLowerCase();
const XIAOMI_PRIVATE_SERVICES = [numberToUUID(0xfee0).toLowerCase(), numberToUUID(0xfee1).toLowerCase()];

const WEB_OPTIONAL_SERVICES = [
  "battery_service",
  "device_information",
  "heart_rate",
  ...XIAOMI_PRIVATE_SERVICES,
];

const NATIVE_OPTIONAL_SERVICES = [
  BATTERY_SERVICE,
  DEVICE_INFORMATION_SERVICE,
  HEART_RATE_SERVICE,
  ...XIAOMI_PRIVATE_SERVICES,
];

let nativeBleInitialized = false;

export function isNativeBluetoothAvailable() {
  return Capacitor.getPlatform() === "android";
}

export function isWebBluetoothAvailable() {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

export function isWearableBluetoothAvailable() {
  return isNativeBluetoothAvailable() || isWebBluetoothAvailable();
}

export function getSavedXiaomiBandCandidate(): XiaomiBandCandidate | null {
  if (typeof localStorage === "undefined") return null;

  try {
    const raw = localStorage.getItem(LAST_DEVICE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as XiaomiBandCandidate;
    if (!parsed.id || !parsed.name) return null;
    return {
      ...parsed,
      lastSeenAt: parsed.lastSeenAt || Date.now(),
      matchReasons: parsed.matchReasons?.length ? parsed.matchReasons : ["Ostatnio połączona opaska"],
      serviceUuids: parsed.serviceUuids || [],
    };
  } catch {
    return null;
  }
}

function saveXiaomiBandCandidate(candidate: XiaomiBandCandidate) {
  if (typeof localStorage === "undefined") return;

  try {
    localStorage.setItem(LAST_DEVICE_STORAGE_KEY, JSON.stringify(candidate));
  } catch {
    // Brak zapisu nie może przerywać połączenia BLE.
  }
}

function unique(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[]));
}

function normalizeUuid(uuid: string) {
  const lower = uuid.toLowerCase();
  if (/^[0-9a-f]{4}$/.test(lower)) {
    return numberToUUID(Number.parseInt(lower, 16)).toLowerCase();
  }
  return lower;
}

function shortUuid(uuid: string) {
  const normalized = normalizeUuid(uuid);
  const match = /^0000([0-9a-f]{4})-0000-1000-8000-00805f9b34fb$/.exec(normalized);
  return match ? match[1].toUpperCase() : normalized;
}

function readUtf8(value: DataView) {
  return new TextDecoder().decode(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength)).replace(/\0/g, "").trim();
}

function parseHeartRate(value: DataView) {
  if (value.byteLength < 2) return undefined;
  const flags = value.getUint8(0);
  const isUint16 = (flags & 0x1) === 0x1;
  return isUint16 && value.byteLength >= 3 ? value.getUint16(1, true) : value.getUint8(1);
}

async function ensureNativeBleReady() {
  if (!nativeBleInitialized) {
    await BleClient.initialize({ androidNeverForLocation: true });
    nativeBleInitialized = true;
  }

  if (!(await BleClient.isEnabled())) {
    await BleClient.requestEnable();
  }

  try {
    await BleClient.setDisplayStrings({
      scanning: "Skanowanie opasek...",
      cancel: "Anuluj",
      availableDevices: "Dostępne urządzenia",
      noDeviceFound: "Nie znaleziono opaski",
    });
  } catch {
    // Tłumaczenia dialogu są wygodne, ale połączenie BLE nie może od nich zależeć.
  }
}

function buildCandidateScore(name: string, serviceUuids: string[], rssi?: number) {
  const reasons: string[] = [];
  let score = 0;
  const lowerName = name.toLowerCase();

  if (/mi\s*smart\s*band|xiaomi\s*smart\s*band/i.test(name)) {
    score += 90;
    reasons.push("nazwa Xiaomi Smart Band");
  } else if (/mi\s*band/i.test(name)) {
    score += 86;
    reasons.push("nazwa Mi Band");
  } else if (/xiaomi|redmi/i.test(name)) {
    score += 72;
    reasons.push("nazwa Xiaomi/Redmi");
  } else if (/\bsmart\s*band\b|\bband\b/i.test(name)) {
    score += 46;
    reasons.push("nazwa typu Smart Band");
  }

  if (serviceUuids.some((uuid) => XIAOMI_PRIVATE_SERVICES.includes(uuid))) {
    score += 60;
    reasons.push("prywatna usługa Xiaomi/Huami FEE0/FEE1");
  }

  if (serviceUuids.includes(HEART_RATE_SERVICE)) {
    score += 12;
    reasons.push("standard tętna BLE");
  }
  if (serviceUuids.includes(BATTERY_SERVICE)) {
    score += 8;
    reasons.push("standard baterii BLE");
  }
  if (serviceUuids.includes(DEVICE_INFORMATION_SERVICE)) {
    score += 6;
    reasons.push("standard informacji urządzenia");
  }

  if (rssi !== undefined) {
    if (rssi >= -55) {
      score += 14;
      reasons.push("bardzo bliski sygnał");
    } else if (rssi >= -72) {
      score += 8;
      reasons.push("stabilny sygnał");
    } else if (rssi <= -92) {
      score -= 10;
      reasons.push("słaby sygnał");
    }
  }

  if (!lowerName || lowerName === "nieznana opaska ble") score -= 8;

  return { score, reasons };
}

function getScanServiceUuids(result: ScanResult) {
  return unique([
    ...(result.uuids || []),
    ...Object.keys(result.serviceData || {}),
    ...(result.device.uuids || []),
  ]).map(normalizeUuid);
}

function toCandidate(result: ScanResult): XiaomiBandCandidate {
  const serviceUuids = getScanServiceUuids(result);
  const name = result.device.name || result.localName || "Nieznana opaska BLE";
  const { score, reasons } = buildCandidateScore(`${name} ${result.localName || ""}`, serviceUuids, result.rssi);

  return {
    id: result.device.deviceId,
    name,
    localName: result.localName,
    rssi: result.rssi,
    serviceUuids,
    matchScore: score,
    matchReasons: reasons.length ? reasons : ["ogólne urządzenie BLE"],
    lastSeenAt: Date.now(),
  };
}

function sortCandidates(candidates: Iterable<XiaomiBandCandidate>) {
  return Array.from(candidates).sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return (b.rssi ?? -999) - (a.rssi ?? -999);
  });
}

function mergeCandidate(previous: XiaomiBandCandidate | undefined, next: XiaomiBandCandidate) {
  if (!previous) return next;

  const serviceUuids = unique([...previous.serviceUuids, ...next.serviceUuids]).map(normalizeUuid);
  const reasons = unique([...previous.matchReasons, ...next.matchReasons]);
  const strongestRssi =
    previous.rssi === undefined ? next.rssi : next.rssi === undefined ? previous.rssi : Math.max(previous.rssi, next.rssi);

  return {
    ...previous,
    ...next,
    name: next.name !== "Nieznana opaska BLE" ? next.name : previous.name,
    localName: next.localName || previous.localName,
    rssi: strongestRssi,
    serviceUuids,
    matchScore: Math.max(previous.matchScore, next.matchScore),
    matchReasons: reasons,
    lastSeenAt: Date.now(),
  };
}

export async function scanXiaomiBands(options: XiaomiBandScanOptions = {}) {
  if (!isNativeBluetoothAvailable()) {
    throw new Error("Skanowanie listy opasek jest dostępne w aplikacji Android. W przeglądarce użyj szybkiego połączenia.");
  }

  await ensureNativeBleReady();

  const timeoutMs = Math.max(2500, Math.min(options.timeoutMs ?? 7000, 12000));
  const candidates = new Map<string, XiaomiBandCandidate>();

  try {
    await BleClient.requestLEScan(
      {
        optionalServices: NATIVE_OPTIONAL_SERVICES,
        allowDuplicates: false,
        scanMode: ScanMode.SCAN_MODE_LOW_LATENCY,
      },
      (result) => {
        const candidate = toCandidate(result);
        if (candidate.matchScore < 18) return;

        const merged = mergeCandidate(candidates.get(candidate.id), candidate);
        candidates.set(candidate.id, merged);
        options.onCandidate?.(merged, sortCandidates(candidates.values()));
      }
    );

    await new Promise((resolve) => window.setTimeout(resolve, timeoutMs));
  } finally {
    await BleClient.stopLEScan().catch(() => undefined);
  }

  return sortCandidates(candidates.values());
}

async function tryReadNativeCharacteristic(deviceId: string, serviceId: string, characteristicId: string) {
  try {
    return await BleClient.read(deviceId, serviceId, characteristicId, { timeout: 3500 });
  } catch {
    return null;
  }
}

async function tryReadNativeRssi(deviceId: string) {
  try {
    return await BleClient.readRssi(deviceId);
  } catch {
    return undefined;
  }
}

async function tryGetNativeServices(deviceId: string) {
  try {
    const services = await BleClient.getServices(deviceId);
    if (services.length) return services;
  } catch {
    // Część opasek potrzebuje jawnego discovery po pierwszym połączeniu.
  }

  try {
    await BleClient.discoverServices(deviceId);
    return await BleClient.getServices(deviceId);
  } catch {
    return [];
  }
}

function getServiceUuids(services: BleService[], advertisedServices: string[] = []) {
  return unique([...services.map((service) => service.uuid), ...advertisedServices]).map(normalizeUuid);
}

function buildCapabilities(services: BleService[], advertisedServices: string[] = []): XiaomiBandCapabilities {
  const serviceUuids = getServiceUuids(services, advertisedServices);
  const rawServices = services.map((service) => {
    const characteristics = service.characteristics || [];
    return {
      uuid: normalizeUuid(service.uuid),
      characteristics: characteristics.map((characteristic) => normalizeUuid(characteristic.uuid)),
      readable: characteristics.filter((characteristic) => characteristic.properties?.read).length,
      notifying: characteristics.filter((characteristic) => characteristic.properties?.notify || characteristic.properties?.indicate).length,
      writable: characteristics.filter((characteristic) => characteristic.properties?.write || characteristic.properties?.writeWithoutResponse).length,
    };
  });

  return {
    battery: serviceUuids.includes(BATTERY_SERVICE),
    deviceInfo: serviceUuids.includes(DEVICE_INFORMATION_SERVICE),
    heartRate: serviceUuids.includes(HEART_RATE_SERVICE),
    xiaomiPrivate: serviceUuids.some((uuid) => XIAOMI_PRIVATE_SERVICES.includes(uuid)),
    services: serviceUuids,
    characteristicsCount: rawServices.reduce((sum, service) => sum + service.characteristics.length, 0),
    rawServices,
  };
}

function getCapabilityDiagnostics(capabilities: XiaomiBandCapabilities, servicesLoaded: boolean) {
  const diagnostics: string[] = [];

  if (!servicesLoaded) {
    diagnostics.push("Nie udało się pobrać pełnej listy usług GATT; używam danych z reklamy BLE.");
  }
  if (capabilities.battery) diagnostics.push("Bateria: standard BLE 0x180F wykryty.");
  if (capabilities.heartRate) {
    diagnostics.push("Tętno: standard BLE 0x180D wykryty.");
  } else {
    diagnostics.push("Tętno: brak standardowej usługi BLE lub model wymaga uruchomienia pomiaru z opaski/aplikacji producenta.");
  }
  if (capabilities.xiaomiPrivate) {
    diagnostics.push("Wykryto prywatne UUID Xiaomi/Huami FEE0/FEE1; pełne dane mogą wymagać autoryzacji producenta.");
  }
  if (capabilities.characteristicsCount > 0) {
    diagnostics.push(`GATT: ${capabilities.services.length} usług i ${capabilities.characteristicsCount} charakterystyk dostępnych do diagnostyki.`);
  }

  return diagnostics;
}

async function connectNativeDevice(
  candidate: XiaomiBandCandidate,
  mode: XiaomiBandConnectionMode,
  onSnapshot: (snapshot: XiaomiBandSnapshot) => void,
  onDisconnect?: () => void
): Promise<XiaomiBandConnection> {
  await ensureNativeBleReady();

  const deviceName = candidate.name || "Xiaomi / Mi Band";
  const snapshot: XiaomiBandSnapshot = {
    id: candidate.id,
    name: deviceName,
    connected: true,
    connectionMode: mode,
    rssi: candidate.rssi,
    message: "Łączę z opaską przez Android BLE.",
  };

  let disconnected = false;
  let heartNotifications = false;

  const handleDisconnect = () => {
    if (disconnected) return;
    disconnected = true;
    onSnapshot({
      ...snapshot,
      connected: false,
      message: "Opaska rozłączona.",
    });
    onDisconnect?.();
  };

  await BleClient.disconnect(candidate.id).catch(() => undefined);
  await BleClient.connect(candidate.id, handleDisconnect, { timeout: 15000, skipDescriptorDiscovery: false });

  try {
    await BleClient.requestConnectionPriority(candidate.id, ConnectionPriority.CONNECTION_PRIORITY_HIGH);
  } catch {
    // Priorytet połączenia jest tylko optymalizacją na Androidzie.
  }

  snapshot.message = "Połączono. Sprawdzam usługi i dane opaski.";
  onSnapshot({ ...snapshot });

  const [services, rssi] = await Promise.all([tryGetNativeServices(candidate.id), tryReadNativeRssi(candidate.id)]);
  const capabilities = buildCapabilities(services, candidate.serviceUuids);
  const diagnostics = getCapabilityDiagnostics(capabilities, services.length > 0);

  snapshot.capabilities = capabilities;
  snapshot.diagnostics = diagnostics;
  snapshot.rssi = rssi ?? candidate.rssi;

  const [battery, manufacturer, model] = await Promise.all([
    tryReadNativeCharacteristic(candidate.id, BATTERY_SERVICE, BATTERY_LEVEL),
    tryReadNativeCharacteristic(candidate.id, DEVICE_INFORMATION_SERVICE, MANUFACTURER_NAME),
    tryReadNativeCharacteristic(candidate.id, DEVICE_INFORMATION_SERVICE, MODEL_NUMBER),
  ]);

  if (battery && battery.byteLength > 0) snapshot.batteryLevel = battery.getUint8(0);
  if (manufacturer) snapshot.manufacturer = readUtf8(manufacturer);
  if (model) snapshot.model = readUtf8(model);

  if (capabilities.heartRate) {
    try {
      await BleClient.startNotifications(
        candidate.id,
        HEART_RATE_SERVICE,
        HEART_RATE_MEASUREMENT,
        (value) => {
          const heartRate = parseHeartRate(value);
          if (!heartRate) return;
          snapshot.heartRate = heartRate;
          snapshot.message = "Tętno zsynchronizowane przez BLE.";
          onSnapshot({ ...snapshot });
        },
        { timeout: 5000 }
      );
      heartNotifications = true;
      snapshot.message = "Połączono. Bateria i tętno są gotowe, jeśli opaska wysyła pomiar.";
    } catch {
      snapshot.message = "Połączono. Usługa tętna jest widoczna, ale opaska nie rozpoczęła notyfikacji.";
      snapshot.diagnostics = unique([
        ...(snapshot.diagnostics || []),
        "Jeśli tętno jest puste, uruchom pomiar na opasce albo zezwól na tętno w aplikacji producenta.",
      ]);
    }
  } else {
    snapshot.message = "Połączono. Standardowa bateria/info działa, tętno zależy od modelu opaski.";
  }

  saveXiaomiBandCandidate(candidate);
  onSnapshot({ ...snapshot });

  void BleClient.requestConnectionPriority(candidate.id, ConnectionPriority.CONNECTION_PRIORITY_BALANCED).catch(() => undefined);

  return {
    deviceName,
    deviceId: candidate.id,
    disconnect: () => {
      disconnected = true;
      if (heartNotifications) {
        void BleClient.stopNotifications(candidate.id, HEART_RATE_SERVICE, HEART_RATE_MEASUREMENT).catch(() => undefined);
      }
      void BleClient.disconnect(candidate.id).catch(() => undefined);
    },
  };
}

async function connectNativeXiaomiBandDialog(
  onSnapshot: (snapshot: XiaomiBandSnapshot) => void,
  onDisconnect?: () => void
) {
  await ensureNativeBleReady();

  const device = await BleClient.requestDevice({
    optionalServices: NATIVE_OPTIONAL_SERVICES,
    scanMode: ScanMode.SCAN_MODE_LOW_LATENCY,
  });

  return connectNativeDevice(toCandidateFromBleDevice(device), "native-dialog", onSnapshot, onDisconnect);
}

function toCandidateFromBleDevice(device: BleDevice): XiaomiBandCandidate {
  const serviceUuids = unique(device.uuids || []).map(normalizeUuid);
  const name = device.name || "Xiaomi / Mi Band";
  const { score, reasons } = buildCandidateScore(name, serviceUuids);

  return {
    id: device.deviceId,
    name,
    serviceUuids,
    matchScore: Math.max(score, 30),
    matchReasons: reasons.length ? reasons : ["wybrane ręcznie w dialogu BLE"],
    lastSeenAt: Date.now(),
  };
}

export async function connectXiaomiBandCandidate(
  candidate: XiaomiBandCandidate,
  onSnapshot: (snapshot: XiaomiBandSnapshot) => void,
  onDisconnect?: () => void
) {
  if (!isNativeBluetoothAvailable()) {
    throw new Error("Połączenie z wybranej listy jest dostępne w aplikacji Android.");
  }

  return connectNativeDevice(candidate, "native-scan", onSnapshot, onDisconnect);
}

async function connectNativeXiaomiBand(
  onSnapshot: (snapshot: XiaomiBandSnapshot) => void,
  onDisconnect?: () => void
): Promise<XiaomiBandConnection> {
  const saved = getSavedXiaomiBandCandidate();
  if (saved) {
    onSnapshot({
      id: saved.id,
      name: saved.name,
      connected: true,
      connectionMode: "native-scan",
      message: `Próbuję wrócić do ostatniej opaski: ${saved.name}.`,
    });

    try {
      return await connectNativeDevice(saved, "native-scan", onSnapshot, onDisconnect);
    } catch {
      onSnapshot({
        id: saved.id,
        name: saved.name,
        connected: false,
        connectionMode: "native-scan",
        message: "Ostatnia opaska nie odpowiedziała. Skanuję urządzenia w pobliżu.",
      });
    }
  }

  const candidates = await scanXiaomiBands({ timeoutMs: 4500 });
  const bestCandidate = candidates[0];

  if (bestCandidate && bestCandidate.matchScore >= 28) {
    return connectNativeDevice(bestCandidate, "native-scan", onSnapshot, onDisconnect);
  }

  onSnapshot({
    name: "Xiaomi / Mi Band",
    connected: false,
    connectionMode: "native-dialog",
    message: "Nie znalazłem pewnej opaski automatycznie. Otwieram ręczny wybór BLE.",
  });

  return connectNativeXiaomiBandDialog(onSnapshot, onDisconnect);
}

async function tryReadWebCharacteristic(
  server: BluetoothServerLike,
  serviceId: string,
  characteristicId: string
) {
  try {
    const service = await server.getPrimaryService(serviceId);
    const characteristic = await service.getCharacteristic(characteristicId);
    return characteristic.readValue();
  } catch {
    return null;
  }
}

async function connectWebXiaomiBand(
  onSnapshot: (snapshot: XiaomiBandSnapshot) => void,
  onDisconnect?: () => void
): Promise<XiaomiBandConnection> {
  const bluetooth = (navigator as BluetoothNavigator).bluetooth;
  if (!bluetooth) {
    throw new Error("Bluetooth opaski nie jest dostępny w tej przeglądarce.");
  }

  const device = await bluetooth.requestDevice({
    filters: XIAOMI_BAND_FILTERS,
    optionalServices: WEB_OPTIONAL_SERVICES,
  });

  if (!device.gatt) {
    throw new Error("Wybrane urządzenie nie udostępnia profilu Bluetooth GATT.");
  }

  const deviceName = device.name || "Xiaomi Band";
  const server = await device.gatt.connect();
  const snapshot: XiaomiBandSnapshot = {
    name: deviceName,
    connected: true,
    connectionMode: "web-dialog",
    message: "Połączono. Pobieram dostępne dane zegarka.",
  };

  let disconnected = false;
  let heartCharacteristic: BluetoothCharacteristicLike | null = null;
  let handleHeartRate: EventListener | null = null;

  const handleDisconnect = () => {
    if (disconnected) return;
    disconnected = true;
    onSnapshot({
      ...snapshot,
      connected: false,
      message: "Zegarek rozłączony.",
    });
    onDisconnect?.();
  };

  device.addEventListener("gattserverdisconnected", handleDisconnect);

  const [battery, manufacturer, model] = await Promise.all([
    tryReadWebCharacteristic(server, "battery_service", "battery_level"),
    tryReadWebCharacteristic(server, "device_information", "manufacturer_name_string"),
    tryReadWebCharacteristic(server, "device_information", "model_number_string"),
  ]);

  const capabilities: XiaomiBandCapabilities = {
    battery: Boolean(battery),
    deviceInfo: Boolean(manufacturer || model),
    heartRate: false,
    xiaomiPrivate: false,
    services: [],
    characteristicsCount: 0,
    rawServices: [],
  };

  if (battery) snapshot.batteryLevel = battery.getUint8(0);
  if (manufacturer) snapshot.manufacturer = readUtf8(manufacturer);
  if (model) snapshot.model = readUtf8(model);

  try {
    const service = await server.getPrimaryService("heart_rate");
    const characteristic = await service.getCharacteristic("heart_rate_measurement");
    handleHeartRate = (event) => {
      const target = event.target as unknown as BluetoothCharacteristicLike;
      if (!target.value) return;
      const heartRate = parseHeartRate(target.value);
      if (!heartRate) return;
      snapshot.heartRate = heartRate;
      snapshot.message = "Tętno zsynchronizowane przez Bluetooth.";
      onSnapshot({ ...snapshot });
    };

    heartCharacteristic = characteristic;
    characteristic.addEventListener?.("characteristicvaluechanged", handleHeartRate);
    await characteristic.startNotifications?.();
    capabilities.heartRate = true;
    snapshot.message = "Połączono. Bateria i tętno są gotowe, jeśli opaska wysyła pomiar.";
  } catch {
    snapshot.message = "Połączono. Ten model nie udostępnił standardowego pomiaru tętna.";
  }

  snapshot.capabilities = capabilities;
  snapshot.diagnostics = getCapabilityDiagnostics(capabilities, true);
  onSnapshot({ ...snapshot });

  return {
    deviceName,
    disconnect: () => {
      disconnected = true;
      if (heartCharacteristic && handleHeartRate) {
        heartCharacteristic.removeEventListener?.("characteristicvaluechanged", handleHeartRate);
      }
      device.removeEventListener("gattserverdisconnected", handleDisconnect);
      device.gatt?.disconnect?.();
    },
  };
}

export async function connectXiaomiBand(
  onSnapshot: (snapshot: XiaomiBandSnapshot) => void,
  onDisconnect?: () => void
): Promise<XiaomiBandConnection> {
  if (isNativeBluetoothAvailable()) {
    return connectNativeXiaomiBand(onSnapshot, onDisconnect);
  }

  return connectWebXiaomiBand(onSnapshot, onDisconnect);
}

export function formatXiaomiBandServices(services: string[] = []) {
  if (!services.length) return "brak listy usług";
  return services.map(shortUuid).join(" / ");
}
