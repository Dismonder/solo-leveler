export type RpgDestination = "hub" | "stats" | "equipment" | "skills" | "quests" | "combat" | "training" | "history";

export type RpgNodeId =
  | "hunter-base"
  | "skill-tower"
  | "dungeon-gate"
  | "training-arena"
  | "weapon-hall"
  | "mission-hub"
  | "data-vault";

export type RpgInputState = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  dash: boolean;
};

export type RpgWorldNode = {
  id: RpgNodeId;
  label: string;
  summary: string;
  destination: RpgDestination;
  x: number;
  y: number;
  radius: number;
  minLevel: number;
  tone: "cyan" | "violet" | "red" | "gold" | "teal";
};

export type RpgWorldState = {
  player: {
    x: number;
    y: number;
    facing: "left" | "right";
    moving: boolean;
    dashing: boolean;
    stamina: number;
    dashCooldownMs: number;
  };
  timeMs: number;
  activeNodeId: RpgNodeId | null;
  visitedNodeIds: RpgNodeId[];
};

export const RPG_WORLD_NODES: RpgWorldNode[] = [
  {
    id: "hunter-base",
    label: "Hunter Base",
    summary: "Status, atrybuty i profil lowcy.",
    destination: "stats",
    x: 50.6,
    y: 45.2,
    radius: 12,
    minLevel: 1,
    tone: "cyan",
  },
  {
    id: "skill-tower",
    label: "Skill Tower",
    summary: "Odblokowanie i rozwoj umiejetnosci.",
    destination: "skills",
    x: 33.2,
    y: 24.1,
    radius: 10,
    minLevel: 1,
    tone: "violet",
  },
  {
    id: "dungeon-gate",
    label: "Dungeon Gate",
    summary: "Lochy, rajdy i walka turowa.",
    destination: "combat",
    x: 70.5,
    y: 25.6,
    radius: 11,
    minLevel: 1,
    tone: "red",
  },
  {
    id: "training-arena",
    label: "Training Arena",
    summary: "Mini gry, uniki i test refleksu.",
    destination: "training",
    x: 87.7,
    y: 45.2,
    radius: 10,
    minLevel: 1,
    tone: "cyan",
  },
  {
    id: "weapon-hall",
    label: "Weapon Hall",
    summary: "Ekwipunek, relikty i naprawa.",
    destination: "equipment",
    x: 13.6,
    y: 49.8,
    radius: 10,
    minLevel: 1,
    tone: "gold",
  },
  {
    id: "mission-hub",
    label: "Mission Hub",
    summary: "Zadania dzienne i fabularne.",
    destination: "quests",
    x: 45.6,
    y: 73.4,
    radius: 11,
    minLevel: 1,
    tone: "teal",
  },
  {
    id: "data-vault",
    label: "Data Vault",
    summary: "Historia progresu i analiza treningu.",
    destination: "history",
    x: 77.8,
    y: 66.4,
    radius: 9,
    minLevel: 3,
    tone: "teal",
  },
];

export function createRpgWorldState(): RpgWorldState {
  return {
    player: {
      x: 48,
      y: 66,
      facing: "right",
      moving: false,
      dashing: false,
      stamina: 100,
      dashCooldownMs: 0,
    },
    timeMs: 0,
    activeNodeId: null,
    visitedNodeIds: [],
  };
}

export function updateRpgWorld(
  state: RpgWorldState,
  input: RpgInputState,
  deltaMs: number,
  context: { agility: number; level: number }
): RpgWorldState {
  const deltaSeconds = Math.min(0.05, Math.max(0, deltaMs / 1000));
  const next: RpgWorldState = {
    ...state,
    player: { ...state.player },
    visitedNodeIds: [...state.visitedNodeIds],
    timeMs: state.timeMs + deltaMs,
  };

  let dx = Number(input.right) - Number(input.left);
  let dy = Number(input.down) - Number(input.up);
  const moving = dx !== 0 || dy !== 0;
  if (moving) {
    const length = Math.hypot(dx, dy);
    dx /= length;
    dy /= length;
    next.player.facing = dx < -0.05 ? "left" : dx > 0.05 ? "right" : next.player.facing;
  }

  next.player.dashCooldownMs = Math.max(0, next.player.dashCooldownMs - deltaMs);
  const canDash = input.dash && moving && next.player.stamina >= 22 && next.player.dashCooldownMs <= 0;
  next.player.dashing = canDash;
  if (canDash) {
    next.player.stamina = Math.max(0, next.player.stamina - 22);
    next.player.dashCooldownMs = 620;
  } else {
    next.player.stamina = Math.min(100, next.player.stamina + deltaSeconds * (18 + context.agility * 0.12));
  }

  const baseSpeed = 20 + context.agility * 0.18;
  const speed = baseSpeed * (next.player.dashing ? 3.1 : 1);
  next.player.x = clamp(next.player.x + dx * speed * deltaSeconds, 8, 92);
  next.player.y = clamp(next.player.y + dy * speed * deltaSeconds, 18, 88);
  next.player.moving = moving;

  const node = getNearestRpgNode(next, context.level);
  next.activeNodeId = node?.id ?? null;
  if (node && !next.visitedNodeIds.includes(node.id)) {
    next.visitedNodeIds.push(node.id);
  }

  return next;
}

export function getRpgNode(id: RpgNodeId | null | undefined) {
  return id ? RPG_WORLD_NODES.find((node) => node.id === id) ?? null : null;
}

export function getNearestRpgNode(state: RpgWorldState, level: number) {
  let best: RpgWorldNode | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const node of RPG_WORLD_NODES) {
    if (!isRpgNodeUnlocked(node, level)) continue;
    const distance = Math.hypot(state.player.x - node.x, state.player.y - node.y);
    if (distance <= node.radius && distance < bestDistance) {
      best = node;
      bestDistance = distance;
    }
  }
  return best;
}

export function isRpgNodeUnlocked(node: RpgWorldNode, level: number) {
  return level >= node.minLevel;
}

export function resolveRpgInteraction(state: RpgWorldState, level: number): RpgDestination | null {
  return getNearestRpgNode(state, level)?.destination ?? null;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
