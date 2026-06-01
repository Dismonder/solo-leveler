import { useEffect, useRef } from "react";
import { getGlobalFrameTraceBuffer } from "../gameRuntime/performanceTrace";
import { summarizeFrameDeltas, type FrameStatsSummary } from "../services/frameStats";
import { getPerformanceStatus, type HunterPerformanceStatus } from "../services/performanceService";

type FpsOverlayProps = {
  enabled: boolean;
  mode?: "app" | "game";
};

export function FpsOverlay({ enabled, mode = "app" }: FpsOverlayProps) {
  const rafRef = useRef<number | null>(null);
  const framesRef = useRef<number[]>([]);
  const lastFrameRef = useRef(0);
  const lastPaintRef = useRef(0);
  const mountedRef = useRef(false);
  const nativeStatusRef = useRef<HunterPerformanceStatus | null>(null);
  const fpsTextRef = useRef<HTMLSpanElement>(null);
  const avgTextRef = useRef<HTMLSpanElement>(null);
  const minTextRef = useRef<HTMLSpanElement>(null);
  const frameTextRef = useRef<HTMLSpanElement>(null);
  const p95TextRef = useRef<HTMLSpanElement>(null);
  const dropTextRef = useRef<HTMLSpanElement>(null);
  const hzTextRef = useRef<HTMLSpanElement>(null);
  const gameModeTextRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!enabled) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      framesRef.current = [];
      return;
    }

    mountedRef.current = true;
    let nativePoll: number | null = null;

    const writeNativeStatus = (status: HunterPerformanceStatus | null) => {
      nativeStatusRef.current = status;
      const hz = status?.refreshRate || status?.currentRefreshRate || 0;
      const targetHz = status?.targetRefreshRate || 120;
      if (hzTextRef.current) hzTextRef.current.textContent = `${Math.round(hz)}/${Math.round(targetHz)}Hz`;
      if (gameModeTextRef.current) gameModeTextRef.current.textContent = status?.gameMode ? ` · ${status.gameMode}` : "";
    };

    const refreshNativeStatus = () => {
      void getPerformanceStatus().then((status) => {
        if (!mountedRef.current) return;
        writeNativeStatus(status);
      });
    };

    writeNativeStatus(nativeStatusRef.current);
    refreshNativeStatus();
    nativePoll = window.setInterval(refreshNativeStatus, 5000);

    const tick = (now: number) => {
      if (!lastFrameRef.current) {
        lastFrameRef.current = now;
        lastPaintRef.current = now;
      } else {
        const delta = now - lastFrameRef.current;
        lastFrameRef.current = now;
        if (delta > 0 && delta < 1000) {
          framesRef.current.push(delta);
          if (framesRef.current.length > 360) {
            framesRef.current.splice(0, framesRef.current.length - 360);
          }
        }
      }

      if (now - lastPaintRef.current >= 250) {
        lastPaintRef.current = now;
        const samples = framesRef.current;
        if (samples.length > 0) {
          const hz = nativeStatusRef.current?.refreshRate || nativeStatusRef.current?.currentRefreshRate || 120;
          const stats = summarizeFrameDeltas(samples, hz);
          const globalWithStats = globalThis as typeof globalThis & { __soloFpsStats?: FrameStatsSummary };
          globalWithStats.__soloFpsStats = stats;
          getGlobalFrameTraceBuffer().push({
            timestamp: now,
            fps: stats.fps,
            averageFps: stats.averageFps,
            minFps: stats.minFps,
            frameMs: stats.latestMs,
            p95Ms: stats.p95Ms,
            p99Ms: stats.p99Ms,
            stutters25: stats.stutters25,
            stutters33: stats.stutters33,
            mode,
          });

          if (fpsTextRef.current) fpsTextRef.current.textContent = `FPS ${Math.round(stats.fps)}`;
          if (avgTextRef.current) avgTextRef.current.textContent = `AVG ${Math.round(stats.averageFps)}`;
          if (minTextRef.current) minTextRef.current.textContent = `LOW ${Math.round(stats.minFps)}`;
          if (frameTextRef.current) frameTextRef.current.textContent = `${stats.latestMs.toFixed(1)}ms`;
          if (p95TextRef.current) p95TextRef.current.textContent = `P95 ${stats.p95Ms.toFixed(1)}`;
          if (dropTextRef.current) dropTextRef.current.textContent = `DROP ${stats.stutters25}/${stats.stutters33}`;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      mountedRef.current = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (nativePoll !== null) window.clearInterval(nativePoll);
      rafRef.current = null;
      framesRef.current = [];
      lastFrameRef.current = 0;
      lastPaintRef.current = 0;
    };
  }, [enabled, mode]);

  if (!enabled) return null;

  const positionClass =
    mode === "game"
      ? "left-[max(8px,env(safe-area-inset-left))] top-[calc(env(safe-area-inset-top)+8px)]"
      : "left-1/2 top-[calc(env(safe-area-inset-top)+8px)] -translate-x-1/2";

  return (
    <div
      className={`pointer-events-none fixed ${positionClass} z-[1200] max-w-[calc(100vw-16px)] rounded-full border border-[var(--theme-border)] bg-[color-mix(in_srgb,var(--theme-bg)_92%,transparent)] px-2.5 py-1 font-mono text-[8px] font-black uppercase tracking-widest text-[var(--theme-text-strong)] transform-gpu`}
      style={{ contain: "layout paint style", willChange: "transform" }}
      aria-hidden="true"
    >
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        <span ref={fpsTextRef} className="text-[var(--theme-accent-text)]">FPS 0</span>
        <span ref={avgTextRef} className="text-[var(--theme-muted)]">AVG 0</span>
        <span ref={minTextRef} className="text-[var(--theme-muted)]">LOW 0</span>
        <span ref={frameTextRef} className="text-[var(--theme-muted)]">0.0ms</span>
        <span ref={p95TextRef} className="text-[var(--theme-muted)]">P95 0.0</span>
        <span ref={dropTextRef} className="text-[var(--theme-muted)]">DROP 0/0</span>
        <span ref={hzTextRef} className="text-[var(--theme-muted)]">0/120Hz</span>
        <span ref={gameModeTextRef} className="text-[var(--theme-muted)]" />
      </div>
    </div>
  );
}
