import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Battery,
  BatteryCharging,
  Bluetooth,
  CheckCircle2,
  ChevronRight,
  HeartPulse,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Watch,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import {
  connectXiaomiBandCandidate,
  formatXiaomiBandServices,
  getSavedXiaomiBandCandidate,
  getSignalStrength,
  getWearableDeviceCategory,
  isNativeBluetoothAvailable,
  isWearableBluetoothAvailable,
  scanXiaomiBands,
  type XiaomiBandCandidate,
  type XiaomiBandConnection,
  type XiaomiBandSnapshot,
} from "../services/xiaomiBandService";
import { createWearableSampleFromXiaomiSnapshot } from "../game/wearableAnalysis";
import type { WearableSample } from "../types";

interface WearableHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWearableSample?: (sample: WearableSample) => void;
}

export function WearableHubModal({
  isOpen,
  onClose,
  onWearableSample,
}: WearableHubModalProps) {
  const [scanning, setScanning] = useState(false);
  const [candidates, setCandidates] = useState<XiaomiBandCandidate[]>([]);
  const [snapshot, setSnapshot] = useState<XiaomiBandSnapshot | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [liveBpmHistory, setLiveBpmHistory] = useState<number[]>([72, 74, 75, 73, 76, 78, 80, 79, 77, 81]);
  const [pulseTick, setPulseTick] = useState(false);

  const connectionRef = useRef<XiaomiBandConnection | null>(null);
  const savedCandidate = getSavedXiaomiBandCandidate();

  // Load initial candidate / auto connect if available
  useEffect(() => {
    if (!isOpen) return;

    if (savedCandidate) {
      setCandidates([savedCandidate]);
    }
  }, [isOpen]);

  // Handle heart rate waveform simulation / stream
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setPulseTick((prev) => !prev);
      if (snapshot?.heartRate) {
        setLiveBpmHistory((prev) => [...prev.slice(-19), snapshot.heartRate!]);
      } else {
        // Ambient rhythm for radar visual
        setLiveBpmHistory((prev) => {
          const last = prev[prev.length - 1] || 72;
          const variance = (Math.random() - 0.5) * 3;
          const next = Math.max(60, Math.min(130, Math.round(last + variance)));
          return [...prev.slice(-19), next];
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, snapshot?.heartRate]);

  const startScan = async () => {
    setScanning(true);
    setStatusMessage("Skanowanie pasma Bluetooth Low Energy...");
    try {
      await scanXiaomiBands({
        timeoutMs: 9000,
        onCandidate: (candidate, all) => {
          setCandidates(all);
        },
      });
      setStatusMessage("Zakończono skanowanie BLE.");
    } catch (err: any) {
      setStatusMessage(err?.message || "Błąd podczas skanowania urządzeń.");
    } finally {
      setScanning(false);
    }
  };

  const handleConnect = async (candidate: XiaomiBandCandidate) => {
    setConnecting(true);
    setStatusMessage(`Łączenie z ${candidate.name}...`);
    try {
      if (connectionRef.current) {
        connectionRef.current.disconnect();
        connectionRef.current = null;
      }

      const conn = await connectXiaomiBandCandidate(candidate, (nextSnapshot) => {
        setSnapshot(nextSnapshot);
        if (nextSnapshot.heartRate || nextSnapshot.batteryLevel !== undefined) {
          const sample = createWearableSampleFromXiaomiSnapshot(nextSnapshot);
          onWearableSample?.(sample);
        }
      });
      connectionRef.current = conn;
      setStatusMessage(`Pomyślnie połączono z ${conn.deviceName}`);
    } catch (err: any) {
      setStatusMessage(`Błąd połączenia: ${err?.message || "Nieznany błąd"}`);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    if (connectionRef.current) {
      connectionRef.current.disconnect();
      connectionRef.current = null;
    }
    setSnapshot(null);
    setStatusMessage("Rozłączono urządzenie.");
  };

  if (!isOpen) return null;

  const currentBpm = snapshot?.heartRate || (snapshot?.connected ? 75 : null);
  const signal = snapshot?.rssi !== undefined ? getSignalStrength(snapshot.rssi) : null;
  const isConnected = Boolean(snapshot?.connected);
  const activeDeviceCategory = snapshot?.name ? getWearableDeviceCategory(snapshot.name) : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative flex flex-col w-full max-w-lg max-h-[90vh] overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 shadow-[0_0_40px_rgba(6,182,212,0.2)] text-cyan-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-cyan-500/20 px-5 py-4 bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-950/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <Bluetooth className="h-5 w-5 text-cyan-400 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-400">
                  SYSTEM ŁOWCY · TELEMETRIA BLE
                </p>
                <h2 className="text-base font-black tracking-tight text-slate-100">
                  Centrum Urządzeń Wearables
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800/80 text-slate-300 transition hover:bg-slate-700 active:scale-95"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Live Kardiomonitor (ECG & Heart Rate) */}
            <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-950/80 p-4 shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HeartPulse className="h-5 w-5 text-rose-500 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-200">
                    Kardiomonitor Tętna Łowcy
                  </span>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                    isConnected
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
                >
                  {isConnected ? "Strumień aktywny" : "Czeka na sensor"}
                </span>
              </div>

              {/* Heart rate big number & ECG wave */}
              <div className="mt-3 grid grid-cols-12 gap-3 items-center">
                <div className="col-span-4 flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-center">
                  <span className="text-3xl font-black font-mono text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                    {currentBpm ? currentBpm : "--"}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    BPM / PULS
                  </span>
                </div>

                {/* SVG ECG Waveform */}
                <div className="col-span-8 flex flex-col justify-center h-20 overflow-hidden rounded-xl border border-cyan-500/20 bg-slate-900/50 p-2">
                  <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="ecgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
                        <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="1" />
                      </linearGradient>
                    </defs>
                    <polyline
                      fill="none"
                      stroke="url(#ecgGrad)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={liveBpmHistory
                        .map((bpm, idx) => {
                          const x = (idx / (liveBpmHistory.length - 1)) * 200;
                          const y = 50 - ((bpm - 50) / 100) * 40;
                          return `${x},${Math.max(5, Math.min(55, y))}`;
                        })
                        .join(" ")}
                    />
                  </svg>
                  <div className="flex justify-between items-center px-1 text-[8px] font-mono text-cyan-400/60 uppercase">
                    <span>min: {Math.min(...liveBpmHistory)}</span>
                    <span className="animate-pulse">● LIVE ECG</span>
                    <span>max: {Math.max(...liveBpmHistory)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Connected Device Card */}
            {snapshot && isConnected && (
              <div className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-slate-950 via-emerald-950/20 to-slate-950 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-950/50">
                      <Watch className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-100">{snapshot.name}</h3>
                        <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[9px] font-black text-emerald-300 border border-emerald-500/30">
                          {activeDeviceCategory?.label || "Aktywne"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        ID: {snapshot.id || "BLE Connected"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="rounded-xl border border-rose-500/40 bg-rose-950/30 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-900/40"
                  >
                    Rozłącz
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-2 rounded-xl bg-slate-900/80 p-2 border border-slate-800">
                    <Battery className="h-4 w-4 text-emerald-400" />
                    <div>
                      <p className="text-[9px] font-bold uppercase text-slate-400">Bateria</p>
                      <p className="text-xs font-black text-slate-200">
                        {snapshot.batteryLevel !== undefined ? `${snapshot.batteryLevel}%` : "Odczyt..."}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-slate-900/80 p-2 border border-slate-800">
                    <Radio className="h-4 w-4 text-cyan-400" />
                    <div>
                      <p className="text-[9px] font-bold uppercase text-slate-400">Sygnał BLE</p>
                      <p className="text-xs font-black text-slate-200">
                        {signal ? `${signal.quality} (${snapshot.rssi} dBm)` : "Stabilny"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Radar BLE Scanner List */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className={`h-4 w-4 text-cyan-400 ${scanning ? "animate-spin" : ""}`} />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                    Wykryte Urządzenia BLE
                  </span>
                </div>
                <button
                  type="button"
                  onClick={startScan}
                  disabled={scanning}
                  className="flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-950/60 px-3 py-1.5 text-xs font-bold text-cyan-300 transition hover:bg-cyan-900/60 disabled:opacity-50 active:scale-95"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${scanning ? "animate-spin" : ""}`} />
                  {scanning ? "Skanowanie..." : "Skanuj BLE"}
                </button>
              </div>

              {candidates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400">
                  <Search className="h-8 w-8 text-slate-600 mb-2" />
                  <p className="text-xs font-medium">Brak urządzeń w zasięgu.</p>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-xs">
                    Włącz Bluetooth w zegarku/opasce i kliknij „Skanuj BLE”, aby nawiązać połączenie.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {candidates.map((cand) => {
                    const devCat = getWearableDeviceCategory(cand.name, cand.serviceUuids);
                    const devSignal = getSignalStrength(cand.rssi);
                    const isCurrent = snapshot?.id === cand.id && isConnected;

                    return (
                      <div
                        key={cand.id}
                        className={`flex items-center justify-between rounded-xl border p-3 transition ${
                          isCurrent
                            ? "border-emerald-500/40 bg-emerald-950/20"
                            : "border-slate-800/80 bg-slate-900/60 hover:border-cyan-500/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800">
                            {devCat.category === "chest_strap" ? (
                              <HeartPulse className="h-4 w-4 text-rose-400" />
                            ) : devCat.category === "watch" ? (
                              <Watch className="h-4 w-4 text-cyan-400" />
                            ) : (
                              <Smartphone className="h-4 w-4 text-amber-400" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-slate-200">{cand.name}</p>
                              <span className="rounded bg-cyan-950/80 border border-cyan-800 px-1.5 py-0.2 text-[8px] font-bold text-cyan-300">
                                {devCat.label}
                              </span>
                            </div>
                            <p className="text-[9px] text-slate-400">
                              Sygnał: {devSignal.quality} {cand.rssi ? `(${cand.rssi} dBm)` : ""}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleConnect(cand)}
                          disabled={connecting || isCurrent}
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
                            isCurrent
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "border border-cyan-400/50 bg-cyan-950/80 text-cyan-200 hover:bg-cyan-900"
                          }`}
                        >
                          {isCurrent ? "Połączono" : connecting ? "Łączenie..." : "Połącz"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Status message */}
            {statusMessage && (
              <p className="text-center text-[10px] font-medium text-cyan-300/80">
                {statusMessage}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-800/80 px-5 py-3 bg-slate-950/80 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Sensory telemetryczne BLE aktywne</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950 to-slate-900 px-4 py-2 text-xs font-black uppercase tracking-wider text-cyan-200 hover:brightness-110 active:scale-95"
            >
              Zamknij
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
