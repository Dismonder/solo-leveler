import { useEffect, useMemo, useRef, useState, type CSSProperties, type MutableRefObject } from "react";
import { Crosshair, DoorOpen, Shield, Sparkles, Swords, Zap } from "lucide-react";
import { usePlayer } from "../context/PlayerContext";
import { PhaserActionStage } from "./PhaserActionStage";
import { HudMeter } from "./GameHud";
import systemLobbyImage from "../../baza/lobby_test.png";
import hunterIdleGif from "../assets/models/gifs/hunter-idle.gif";
import hunterRunGif from "../assets/models/gifs/hunter-run.gif";
import hunterJumpGif from "../assets/models/gifs/hunter-jump.gif";
import hunterAttackGif from "../assets/models/gifs/hunter-attack.gif";
import {
  createRpgWorldState,
  getRpgNode,
  isRpgNodeUnlocked,
  resolveRpgInteraction,
  RPG_WORLD_NODES,
  updateRpgWorld,
  type RpgDestination,
  type RpgInputState,
  type RpgNodeId,
  type RpgWorldNode,
  type RpgWorldState,
} from "../game/rpg/rpgEngine";

const emptyInput: RpgInputState = { up: false, down: false, left: false, right: false, dash: false };

export function RpgWorld({ onOpen }: { onOpen: (destination: RpgDestination) => void }) {
  const { player } = usePlayer();
  const [world, setWorld] = useState<RpgWorldState>(() => createRpgWorldState());
  const worldRef = useRef(world);
  const inputRef = useRef<RpgInputState>({ ...emptyInput });
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    worldRef.current = world;
  }, [world]);

  const activeNode = useMemo(() => getRpgNode(world.activeNodeId), [world.activeNodeId]);

  useEffect(() => {
    if (!player) return;
    const down = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") inputRef.current.up = true;
      if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") inputRef.current.down = true;
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") inputRef.current.left = true;
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") inputRef.current.right = true;
      if (event.code === "Space" || event.code === "ShiftLeft" || event.code === "ShiftRight") {
        event.preventDefault();
        inputRef.current.dash = true;
      }
      if (event.key.toLowerCase() === "e" || event.key === "Enter") {
        const destination = resolveRpgInteraction(worldRef.current, player.level);
        if (destination) onOpen(destination);
      }
    };

    const up = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") inputRef.current.up = false;
      if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") inputRef.current.down = false;
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") inputRef.current.left = false;
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") inputRef.current.right = false;
      if (event.code === "Space" || event.code === "ShiftLeft" || event.code === "ShiftRight") inputRef.current.dash = false;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [onOpen, player]);

  useEffect(() => {
    if (!player) return;
    const tick = (time: number) => {
      const deltaMs = lastTimeRef.current ? time - lastTimeRef.current : 16;
      lastTimeRef.current = time;
      const next = updateRpgWorld(worldRef.current, inputRef.current, deltaMs, {
        agility: player.stats.AGILITY,
        level: player.level,
      });
      worldRef.current = next;
      setWorld(next);
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [player]);

  if (!player) return null;

  return (
    <div className="flex h-full flex-col bg-black/30 p-3 md:p-4 xl:p-6">
      <div className="sl-frame sl-top-line mb-3 flex flex-col gap-3 p-4 md:mb-4 lg:flex-row lg:items-end lg:justify-between md:p-5">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-700">2D RPG Engine</div>
          <h2 className="mt-1 text-xl font-black uppercase tracking-[0.14em] text-cyan-200 md:text-2xl">Świat Systemu</h2>
          <p className="mt-2 hidden max-w-2xl text-xs uppercase tracking-widest text-zinc-500 sm:block">
            WASD / strzałki = ruch, Shift / Spacja = dash, E / Enter = wejście do aktywnego budynku.
          </p>
        </div>
        <div className="grid min-w-[180px] gap-2 lg:min-w-[220px]">
          <HudMeter label="Stamina" value={world.player.stamina} max={100} tone="cyan" rightLabel={`${Math.floor(world.player.stamina)}%`} />
        </div>
      </div>

      <div className="sl-frame sl-top-line sl-rpg-world-map relative min-h-[430px] flex-1 overflow-hidden bg-[#050816] md:min-h-[640px]">
        <img className="sl-rpg-lobby-bg" src={systemLobbyImage} alt="" draggable={false} />
        <div className="sl-rpg-lobby-vignette" aria-hidden="true" />
        <PhaserActionStage
          model={{
            sceneId: "rpg-world",
            theme: "combat",
            floorHeight: 0,
            portal: false,
            backdropAlpha: 0.08,
            gridAlpha: 0.045,
            actors: [],
          }}
        />

        <HunterGifActor world={world} activeNode={activeNode} />

        <div className="absolute inset-0 z-20 pointer-events-none">
          {RPG_WORLD_NODES.map((node) => (
            <span key={node.id}>
              <WorldNodeMarker
                node={node}
                active={world.activeNodeId === node.id}
                unlocked={isRpgNodeUnlocked(node, player.level)}
                onOpen={() => onOpen(node.destination)}
              />
            </span>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-30 grid gap-2 md:grid-cols-[minmax(220px,1fr)_160px] xl:inset-x-4 xl:bottom-4 xl:grid-cols-[minmax(0,1fr)_240px]">
          <div className="sl-panel bg-black/65 p-3 xl:p-4">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-600">System Target</div>
            <div className="text-lg font-black uppercase tracking-[0.12em] text-zinc-100">
              {activeNode ? activeNode.label : "Brak aktywnego celu"}
            </div>
            <div className="mt-2 text-xs uppercase tracking-widest text-zinc-500">
              {activeNode ? activeNode.summary : "Podejdź do budynku, żeby otworzyć jego panel."}
            </div>
          </div>
          <button
            disabled={!activeNode}
            onClick={() => {
              const destination = resolveRpgInteraction(worldRef.current, player.level);
              if (destination) onOpen(destination);
            }}
            className="pointer-events-auto border border-cyan-500/50 bg-cyan-950/70 px-4 py-3 font-mono text-xs font-black uppercase tracking-widest text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.18)] transition-all hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-35 xl:px-5 xl:py-4"
          >
            <DoorOpen className="mr-2 inline h-4 w-4" />
            Wejdź
          </button>
        </div>

        <TouchControls inputRef={inputRef} />
      </div>
    </div>
  );
}

function HunterGifActor({ world, activeNode }: { world: RpgWorldState; activeNode: RpgWorldNode | null }) {
  const gif = getHunterGif(world, activeNode);
  return (
    <div
      className={`sl-rpg-hunter-gif ${world.player.dashing ? "sl-rpg-hunter-dash" : ""} ${activeNode ? "sl-rpg-hunter-ready" : ""}`}
      style={{
        left: `${world.player.x}%`,
        top: `${world.player.y}%`,
        "--hunter-facing": world.player.facing === "left" ? "-1" : "1",
      } as CSSProperties}
    >
      <img src={gif} alt="" draggable={false} />
    </div>
  );
}

function WorldNodeMarker({
  node,
  active,
  unlocked,
  onOpen,
}: {
  node: RpgWorldNode;
  active: boolean;
  unlocked: boolean;
  onOpen: () => void;
}) {
  const icon = getNodeIcon(node.id);
  return (
    <button
      type="button"
      disabled={!unlocked}
      onClick={onOpen}
      className={`sl-rpg-node sl-rpg-node-${node.tone} ${active ? "sl-rpg-node-active" : ""} ${!unlocked ? "sl-rpg-node-locked" : ""}`}
      style={{ left: `${node.x}%`, top: `${node.y}%`, "--node-radius": `${node.radius}%` } as CSSProperties}
    >
      <span className="sl-rpg-node-ring" />
      <span className="sl-rpg-node-card">
        <span className="sl-rpg-node-icon">{icon}</span>
        <span className="sl-rpg-node-text">
          <span className="sl-rpg-node-label">{node.label}</span>
          <span className="sl-rpg-node-summary">{unlocked ? node.summary : `Wymaga Lv.${node.minLevel}`}</span>
        </span>
      </span>
    </button>
  );
}

function getHunterGif(world: RpgWorldState, activeNode: RpgWorldNode | null) {
  if (world.player.dashing) return hunterJumpGif;
  if (world.player.moving) return hunterRunGif;
  if (activeNode && Math.floor(world.timeMs / 1800) % 2 === 1) return hunterAttackGif;
  return hunterIdleGif;
}

function TouchControls({ inputRef }: { inputRef: MutableRefObject<RpgInputState> }) {
  const setInput = (key: keyof RpgInputState, value: boolean) => {
    inputRef.current[key] = value;
  };

  return (
    <div className="absolute bottom-28 left-4 z-40 grid grid-cols-3 gap-2 md:hidden">
      <div />
      <TouchButton label="↑" onPress={(down) => setInput("up", down)} />
      <div />
      <TouchButton label="←" onPress={(down) => setInput("left", down)} />
      <TouchButton label="Dash" onPress={(down) => setInput("dash", down)} small />
      <TouchButton label="→" onPress={(down) => setInput("right", down)} />
      <div />
      <TouchButton label="↓" onPress={(down) => setInput("down", down)} />
    </div>
  );
}

function TouchButton({ label, onPress, small = false }: { label: string; onPress: (down: boolean) => void; small?: boolean }) {
  return (
    <button
      onPointerDown={() => onPress(true)}
      onPointerUp={() => onPress(false)}
      onPointerLeave={() => onPress(false)}
      className={`pointer-events-auto border border-cyan-500/45 bg-black/70 font-mono font-black uppercase tracking-widest text-cyan-100 ${small ? "h-12 w-16 text-[9px]" : "h-12 w-12 text-base"}`}
    >
      {label}
    </button>
  );
}

function getNodeIcon(id: RpgNodeId) {
  if (id === "skill-tower") return <Zap className="h-4 w-4" />;
  if (id === "dungeon-gate") return <Swords className="h-4 w-4" />;
  if (id === "training-arena") return <Crosshair className="h-4 w-4" />;
  if (id === "weapon-hall") return <Shield className="h-4 w-4" />;
  return <Sparkles className="h-4 w-4" />;
}
