import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Battery, Bluetooth, CheckCircle, Crosshair, HeartPulse, Plus, Search, Signal, Smartphone, Watch, X } from 'lucide-react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { playClickSound, playKeyboardSound } from '../utils/audio';
import {
  createMotionTrackerState,
  formatTrackedValue,
  getBaseline,
  getBaselineVector,
  getMotionMagnitude,
  MOTION_TRACKER_PROFILES,
  processMotionSample,
  TrackableExerciseId,
  MotionSample,
} from '../sensors/motionTracking';
import { getTrackedCommitValue, shouldConfirmTrackerClose } from './motionTrackerClose';
import { getPhoneMotionAvailability, PhoneMotionSession, startPhoneMotionSensor } from '../sensors/phoneMotionSensor';
import {
  connectXiaomiBandCandidate,
  connectXiaomiBand,
  formatXiaomiBandServices,
  isNativeBluetoothAvailable,
  isWearableBluetoothAvailable,
  scanXiaomiBands,
  XiaomiBandCapabilities,
  XiaomiBandCandidate,
  XiaomiBandConnection,
  XiaomiBandSnapshot,
} from '../services/xiaomiBandService';
import { createWearableSampleFromXiaomiSnapshot } from '../game/wearableAnalysis';
import type { WearableSample } from '../types';

interface MotionTrackerProps {
  exerciseId: TrackableExerciseId;
  exerciseName: string;
  onAddReps: (reps: number) => void;
  onClose: () => void;
  onWearableSample?: (sample: WearableSample) => void;
}

export function MotionTracker({ exerciseId, exerciseName, onAddReps, onClose, onWearableSample }: MotionTrackerProps) {
  const profile = MOTION_TRACKER_PROFILES[exerciseId];
  const [phoneActive, setPhoneActive] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const [reps, setReps] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);
  const [sensorMessage, setSensorMessage] = useState("Czeka na uruchomienie sensora.");
  const [sensorMagnitude, setSensorMagnitude] = useState(0);
  const [sensorSource, setSensorSource] = useState("Nie sprawdzono");
  const [sampleCount, setSampleCount] = useState(0);
  const [watchSnapshot, setWatchSnapshot] = useState<XiaomiBandSnapshot | null>(null);
  const [watchMessage, setWatchMessage] = useState<string | null>(null);
  const [watchConnecting, setWatchConnecting] = useState(false);
  const [watchScanning, setWatchScanning] = useState(false);
  const [watchCandidates, setWatchCandidates] = useState<XiaomiBandCandidate[]>([]);
  const [closeConfirm, setCloseConfirm] = useState(false);

  const trackerStateRef = useRef(createMotionTrackerState());
  const calibrationSamplesRef = useRef<MotionSample[]>([]);
  const calibrationEndsAtRef = useRef(0);
  const calibratingRef = useRef(false);
  const lastUiUpdateRef = useRef(0);
  const phoneSessionRef = useRef<PhoneMotionSession | null>(null);
  const sensorTimeoutRef = useRef<number | null>(null);
  const profileRef = useRef(profile);
  const watchConnectionRef = useRef<XiaomiBandConnection | null>(null);
  const submittedRef = useRef(false);
  const requestCloseRef = useRef<() => void>(() => {});
  const lastWatchSampleRef = useRef<{ at: number; heartRate?: number; batteryLevel?: number; connected?: boolean }>({ at: 0 });

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    let cancelled = false;
    void getPhoneMotionAvailability().then((availability) => {
      if (cancelled) return;
      setSensorSource(availability.details ? `${availability.label} · ${availability.details}` : availability.label);
      if (!availability.available) setSensorMessage('Sensor telefonu niedostępny. Ręczne wpisy nadal działają.');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const stopPhoneSensor = () => {
    phoneSessionRef.current?.stop();
    phoneSessionRef.current = null;
    setPhoneActive(false);
    setCalibrating(false);
    calibratingRef.current = false;
    setSensorMessage('Sensor zatrzymany. Uruchom go ponownie przed kolejną serią.');
    if (sensorTimeoutRef.current) {
      window.clearTimeout(sensorTimeoutRef.current);
      sensorTimeoutRef.current = null;
    }
  };

  const registerDetectedRep = (delta: number) => {
    setReps((value) => Number((value + delta).toFixed(4)));
    playKeyboardSound();
    setPulse(true);
    window.setTimeout(() => setPulse(false), 180);
  };

  const handlePhoneSample = (sample: MotionSample) => {
    if (sensorTimeoutRef.current) {
      window.clearTimeout(sensorTimeoutRef.current);
      sensorTimeoutRef.current = null;
    }

    setSampleCount((value) => value + 1);

    const now = Date.now();
    if (now - lastUiUpdateRef.current > 120) {
      setSensorMagnitude(getMotionMagnitude(sample));
      lastUiUpdateRef.current = now;
    }

    if (calibratingRef.current) {
      calibrationSamplesRef.current.push(sample);
      if (now < calibrationEndsAtRef.current) return;

      const baseline = getBaseline(calibrationSamplesRef.current);
      const baselineVector = getBaselineVector(calibrationSamplesRef.current);
      trackerStateRef.current = createMotionTrackerState(baseline, sample.timestamp, baselineVector);
      calibratingRef.current = false;
      setCalibrating(false);
      setSensorMessage(`Sensor aktywny. Baza: ${baseline.toFixed(2)} m/s². ${profileRef.current.placementHint}`);
      return;
    }

    const result = processMotionSample(trackerStateRef.current, profileRef.current, sample);
    trackerStateRef.current = result.state;

    if (result.delta > 0) registerDetectedRep(result.delta);
  };

  const requestPhoneAccess = async () => {
    playClickSound();
    setError(null);
    stopPhoneSensor();

    calibrationSamplesRef.current = [];
    calibrationEndsAtRef.current = Date.now() + 1400;
    calibratingRef.current = true;
    trackerStateRef.current = createMotionTrackerState();
    setSampleCount(0);
    setCalibrating(true);
    setSensorMessage('Kalibracja: trzymaj telefon stabilnie przez chwilę.');

    sensorTimeoutRef.current = window.setTimeout(() => {
      setError('Sensor nie wysłał próbek. Na telefonie sprawdź uprawnienia i uruchom ponownie sensor.');
      stopPhoneSensor();
    }, 2600);

    try {
      phoneSessionRef.current = await startPhoneMotionSensor(handlePhoneSample, { intervalMs: 32 });
      setPhoneActive(true);
      setSensorSource(phoneSessionRef.current.label);
    } catch (error) {
      stopPhoneSensor();
      setError(error instanceof Error ? error.message : 'Nie udało się uruchomić sensora telefonu.');
    }
  };

  const updateWatchSnapshot = (snapshot: XiaomiBandSnapshot) => {
    setWatchSnapshot(snapshot);
    setWatchMessage(snapshot.message);

    const sample = createWearableSampleFromXiaomiSnapshot(snapshot);
    if (!sample || !onWearableSample) return;

    const previous = lastWatchSampleRef.current;
    const now = Date.now();
    const metricChanged =
      previous.heartRate !== snapshot.heartRate ||
      previous.batteryLevel !== snapshot.batteryLevel ||
      previous.connected !== snapshot.connected;

    if (metricChanged || now - previous.at > 15000) {
      lastWatchSampleRef.current = {
        at: now,
        heartRate: snapshot.heartRate,
        batteryLevel: snapshot.batteryLevel,
        connected: snapshot.connected,
      };
      onWearableSample(sample);
    }
  };

  const scanWatch = async () => {
    playClickSound();
    setWatchMessage(null);
    setWatchCandidates([]);

    if (!isNativeBluetoothAvailable()) {
      setWatchMessage('Skanowanie listy działa w APK Android. W przeglądarce użyj szybkiego połączenia.');
      return;
    }

    setWatchScanning(true);
    try {
      const candidates = await scanXiaomiBands({
        timeoutMs: 7000,
        onCandidate: (_candidate, candidates) => setWatchCandidates(candidates),
      });
      setWatchCandidates(candidates);
      setWatchMessage(candidates.length ? `Znaleziono ${candidates.length} pasujące urządzenie.` : 'Nie znaleziono opaski w pobliżu.');
    } catch (error) {
      setWatchMessage(error instanceof Error ? error.message : 'Nie udało się przeskanować opasek.');
    } finally {
      setWatchScanning(false);
    }
  };

  const connectWatchCandidate = async (candidate: XiaomiBandCandidate) => {
    playClickSound();
    setWatchMessage(null);
    setWatchConnecting(true);

    try {
      watchConnectionRef.current?.disconnect();
      watchConnectionRef.current = await connectXiaomiBandCandidate(
        candidate,
        updateWatchSnapshot,
        () => setWatchConnecting(false)
      );
    } catch (error) {
      setWatchMessage(error instanceof Error ? error.message : 'Nie udało się połączyć z wybraną opaską.');
    } finally {
      setWatchConnecting(false);
    }
  };

  const connectWatch = async () => {
    playClickSound();
    setWatchMessage(null);

    if (!isNativeBluetoothAvailable() && !window.isSecureContext) {
      setWatchMessage('Bluetooth w przeglądarce wymaga HTTPS albo localhost.');
      return;
    }

    if (!isWearableBluetoothAvailable()) {
      setWatchMessage('Bluetooth opaski nie jest dostępny na tym urządzeniu.');
      return;
    }

    setWatchConnecting(true);
    try {
      watchConnectionRef.current?.disconnect();
      watchConnectionRef.current = await connectXiaomiBand(
        updateWatchSnapshot,
        () => setWatchConnecting(false)
      );
    } catch (error) {
      setWatchMessage(error instanceof Error ? error.message : 'Nie udało się połączyć zegarka.');
    } finally {
      setWatchConnecting(false);
    }
  };

  const disconnectWatch = () => {
    playClickSound();
    watchConnectionRef.current?.disconnect();
    watchConnectionRef.current = null;
    setWatchSnapshot((snapshot) => snapshot ? { ...snapshot, connected: false, message: 'Rozłączono ręcznie.' } : snapshot);
    setWatchMessage('Rozłączono ręcznie.');
  };

  const addManual = (amount: number) => {
    playKeyboardSound();
    setReps((value) => Number((value + amount).toFixed(4)));
    setPulse(true);
    window.setTimeout(() => setPulse(false), 180);
  };

  const commitWorkout = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    stopPhoneSensor();
    watchConnectionRef.current?.disconnect();
    watchConnectionRef.current = null;
    const value = getTrackedCommitValue(exerciseId, reps);
    if (value > 0) onAddReps(value);
    onClose();
  };

  const discardWorkout = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    stopPhoneSensor();
    watchConnectionRef.current?.disconnect();
    watchConnectionRef.current = null;
    onClose();
  };

  const requestClose = () => {
    playClickSound();
    if (shouldConfirmTrackerClose(exerciseId, reps)) {
      stopPhoneSensor();
      setCloseConfirm(true);
      return;
    }
    discardWorkout();
  };

  const finishWorkout = () => {
    playClickSound();
    commitWorkout();
  };

  requestCloseRef.current = requestClose;

  useEffect(() => {
    let cancelled = false;
    let nativeBackListener: PluginListenerHandle | null = null;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        requestCloseRef.current();
      }
    };

    if (Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('App')) {
      void CapacitorApp.addListener('backButton', () => requestCloseRef.current()).then((listener) => {
        if (cancelled) {
          void listener.remove();
          return;
        }
        nativeBackListener = listener;
      });
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelled = true;
      window.removeEventListener('keydown', handleKeyDown);
      void nativeBackListener?.remove();
      stopPhoneSensor();
      watchConnectionRef.current?.disconnect();
      watchConnectionRef.current = null;
    };
  }, []);

  const manualSmallStep = exerciseId === 'runningKm' ? 0.1 : 1;
  const manualBigStep = exerciseId === 'runningKm' ? 1 : 10;
  const watchCapabilities = watchSnapshot?.capabilities ? formatWatchCapabilities(watchSnapshot.capabilities) : null;

  return (
    <div className="sl-modal-backdrop fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={requestClose}>
      <motion.div
        onClick={(event) => event.stopPropagation()}
        initial={{ y: 50, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="sl-modal flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col items-center overflow-hidden overflow-y-auto rounded-[22px] border shadow-[0_0_40px_color-mix(in_srgb,var(--theme-accent)_22%,transparent)] custom-scrollbar"
      >
        <div className="flex w-full items-center justify-between border-b border-[var(--theme-border)] bg-[var(--theme-input)] p-4">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[var(--theme-accent-text)]">
            <Activity className="w-4 h-4" /> [Synchronizacja Sensora]
          </h2>
          <button onClick={requestClose} className="sl-icon-button rounded-full p-2 transition-colors active:scale-95">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 w-full flex flex-col items-center justify-center">
          <h3 className="mb-2 text-center text-xl font-black uppercase tracking-widest text-[var(--theme-text-strong)]">
            {exerciseName}
          </h3>
          <p className="sl-muted text-center text-[10px] uppercase tracking-[0.18em]">
            {profile.label} · {profile.unit}
          </p>
          <p className="sl-input mt-3 rounded-xl px-3 py-2 text-center text-[10px] font-bold uppercase tracking-widest leading-relaxed">
            {profile.placementHint}
          </p>

          <div className="mt-6 grid w-full grid-cols-1 gap-3">
            <button
              onClick={requestPhoneAccess}
              disabled={phoneActive}
              className="sl-button-primary flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:cursor-not-allowed"
            >
              <Smartphone className="w-4 h-4" /> {phoneActive ? 'Sensor telefonu działa' : 'Uruchom sensor telefonu'}
            </button>

            {phoneActive && (
              <button
                onClick={stopPhoneSensor}
                className="sl-button-secondary flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-black uppercase tracking-widest transition-all active:scale-95"
              >
                <X className="w-4 h-4" /> Zatrzymaj sensor
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={connectWatch}
                disabled={watchConnecting || watchScanning}
                className="sl-button-secondary flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-55"
              >
                <Bluetooth className="w-4 h-4" /> {watchConnecting ? 'Łączenie...' : 'Auto BLE'}
              </button>
              <button
                onClick={scanWatch}
                disabled={watchConnecting || watchScanning}
                className="sl-button-secondary flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-55"
              >
                <Search className="w-4 h-4" /> {watchScanning ? 'Skan...' : 'Skanuj'}
              </button>
            </div>

            {watchSnapshot?.connected && (
              <button
                onClick={disconnectWatch}
                className="sl-button-secondary flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-black uppercase tracking-widest transition-all active:scale-95"
              >
                <X className="w-4 h-4" /> Rozłącz opaskę
              </button>
            )}
          </div>

          {error && (
            <div className="sl-alert-danger mt-4 w-full rounded-xl p-3 text-center text-[10px] font-bold uppercase tracking-widest text-[var(--theme-danger-text)]">
              {error}
            </div>
          )}

          <div className="mt-6 flex w-full flex-col items-center">
            <div className={`relative flex h-44 w-44 items-center justify-center rounded-full border-2 transition-colors duration-300 ${pulse ? 'border-[var(--theme-accent)] bg-[var(--theme-accent-soft)]' : 'border-[var(--theme-border)] bg-[var(--theme-input)]'}`}>
              <div className="absolute inset-0 m-auto h-3/4 w-3/4 rounded-full border border-[var(--theme-border)]" />
              <div className="absolute inset-0 m-auto h-1/2 w-1/2 rounded-full border border-[var(--theme-border)]" />
              <Crosshair className={`absolute h-full w-full p-2 text-[var(--theme-icon)] opacity-10 transition-transform duration-1000 ${pulse ? 'rotate-90' : 'rotate-0'}`} />

              <div className="z-10 flex flex-col items-center justify-center drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]">
                <span className="font-mono text-5xl font-black text-[var(--theme-text-strong)]">{formatTrackedValue(reps, profile)}</span>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[var(--theme-accent-text)]">{profile.unit}</span>
              </div>
            </div>

            <div className="mt-4 w-full grid grid-cols-2 gap-2">
              <button
                onClick={() => addManual(manualSmallStep)}
                className="sl-button-secondary flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" /> +{manualSmallStep}
              </button>
              <button
                onClick={() => addManual(manualBigStep)}
                className="sl-button-secondary flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" /> +{manualBigStep}
              </button>
            </div>
          </div>

          <div className="mt-5 grid w-full gap-2 text-[10px] uppercase tracking-widest">
            <div className="sl-input rounded-xl p-3 text-[var(--theme-muted)]">
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <span>{calibrating ? 'Kalibracja telefonu' : sensorMessage}</span>
                  <span className="font-mono text-[var(--theme-accent-text)]">{sensorMagnitude.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-[var(--theme-muted)] opacity-70">
                  <span>Źródło: {sensorSource}</span>
                  <span>{sampleCount} próbek</span>
                </div>
              </div>
            </div>

            <div className="sl-input rounded-xl p-3 text-[var(--theme-muted)]">
              {watchSnapshot ? (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2 text-[var(--theme-accent-text)]">
                      <Watch className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{watchSnapshot.name}</span>
                    </span>
                    <span className={watchSnapshot.connected ? 'text-[var(--theme-success-text)]' : 'text-[var(--theme-muted)]'}>{watchSnapshot.connected ? 'Online' : 'Offline'}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <span className="flex items-center gap-1"><Battery className="h-3.5 w-3.5" /> {watchSnapshot.batteryLevel ?? '--'}%</span>
                    <span className="flex items-center gap-1"><HeartPulse className="h-3.5 w-3.5" /> {watchSnapshot.heartRate ?? '--'} bpm</span>
                    <span className="flex items-center gap-1"><Signal className="h-3.5 w-3.5" /> {watchSnapshot.rssi ?? '--'} dBm</span>
                  </div>

                  <div className="grid gap-1 text-[var(--theme-muted)] opacity-80">
                    <span>{watchSnapshot.model || watchSnapshot.manufacturer || watchMessage}</span>
                    {watchCapabilities && <span>Usługi: {watchCapabilities}</span>}
                    {watchSnapshot.capabilities?.characteristicsCount ? (
                      <span>Charakterystyki GATT: {watchSnapshot.capabilities.characteristicsCount}</span>
                    ) : null}
                    {watchSnapshot.capabilities?.services?.length ? (
                      <span>UUID: {formatXiaomiBandServices(watchSnapshot.capabilities.services)}</span>
                    ) : null}
                  </div>

                  {watchSnapshot.diagnostics?.length ? (
                    <div className="grid gap-1 border-t border-[var(--theme-border)] pt-2 text-[9px] leading-relaxed text-[var(--theme-muted)]">
                      {watchSnapshot.diagnostics.slice(0, 4).map((diagnostic) => (
                        <span key={diagnostic}>- {diagnostic}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <span>{watchMessage || 'Zegarek opcjonalny: Android BLE wykryje opaskę, pokaże baterię/tętno i zdiagnozuje usługi, jeżeli model je udostępnia.'}</span>
              )}

              {watchCandidates.length > 0 && (
                <div className="mt-3 grid gap-2 border-t border-[var(--theme-border)] pt-3">
                  <span className="sl-kicker text-[9px] font-black uppercase tracking-[0.22em]">Wykryte zegarki i sensory BLE</span>
                  {watchCandidates.slice(0, 4).map((candidate) => (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => connectWatchCandidate(candidate)}
                      disabled={watchConnecting}
                      className="sl-stat-tile grid gap-1 rounded-xl p-2 text-left text-[9px] uppercase tracking-widest active:scale-[0.99] disabled:opacity-50"
                    >
                      <span className="flex items-center justify-between gap-2 text-[var(--theme-accent-text)]">
                        <span className="truncate">{candidate.name}</span>
                        <span>{candidate.rssi ?? '--'} dBm</span>
                      </span>
                      <span className="text-[var(--theme-muted)]">Score {candidate.matchScore} · {candidate.matchReasons.slice(0, 2).join(' · ')}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="w-full mt-6">
            <button
              onClick={finishWorkout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--theme-success)_42%,transparent)] bg-[color-mix(in_srgb,var(--theme-success)_20%,transparent)] py-3 text-xs font-black uppercase tracking-widest text-[var(--theme-success-text)] transition-all active:scale-95"
            >
              <CheckCircle className="w-4 h-4" /> Zakończ Ćwiczenie
            </button>
          </div>
        </div>

        {closeConfirm && (
          <div className="sl-modal-backdrop absolute inset-0 z-20 flex items-center justify-center p-4">
            <div className="sl-modal w-full rounded-2xl border p-5 shadow-[0_0_36px_color-mix(in_srgb,var(--theme-accent)_25%,transparent)]">
              <h3 className="text-lg font-black uppercase tracking-widest text-[var(--theme-text-strong)]">Zapisać wynik?</h3>
              <p className="sl-muted mt-2 text-sm leading-relaxed">
                Sensor ma wynik {formatTrackedValue(reps, profile)} {profile.unit}. Dodaj go do dzisiejszego celu albo anuluj serię.
              </p>
              <div className="mt-5 grid gap-2">
                <button
                  type="button"
                  onClick={commitWorkout}
                  className="min-h-12 rounded-xl border border-[color-mix(in_srgb,var(--theme-success)_42%,transparent)] bg-[color-mix(in_srgb,var(--theme-success)_20%,transparent)] px-4 py-3 text-xs font-black uppercase tracking-widest text-[var(--theme-success-text)] active:scale-[0.98]"
                >
                  Dodaj wynik
                </button>
                <button
                  type="button"
                  onClick={discardWorkout}
                  className="min-h-12 rounded-xl border border-[color-mix(in_srgb,var(--theme-danger)_38%,transparent)] bg-[color-mix(in_srgb,var(--theme-danger)_14%,transparent)] px-4 py-3 text-xs font-black uppercase tracking-widest text-[var(--theme-danger-text)] active:scale-[0.98]"
                >
                  Anuluj wynik
                </button>
                <button
                  type="button"
                  onClick={() => setCloseConfirm(false)}
                  className="sl-button-secondary min-h-12 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest active:scale-[0.98]"
                >
                  Wróć do sensora
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function formatWatchCapabilities(capabilities: XiaomiBandCapabilities) {
  const labels = [
    capabilities.battery ? 'Bateria' : null,
    capabilities.deviceInfo ? 'Info' : null,
    capabilities.heartRate ? 'Tętno' : null,
    capabilities.xiaomiPrivate ? 'Xiaomi private' : null,
  ].filter(Boolean);

  return labels.length ? labels.join(' / ') : 'brak standardowych usług';
}
