export type Point = { x: number; y: number };
export type GrassTile = Point & { id: number; w: number; h: number; stepGrass?: number; assetId?: string };
export type GrassPatch = { id: number; tiles: GrassTile[]; center: Point };
type HuntEnemy = Point & { id: number; hp: number; spawnX?: number; spawnY?: number; grassPatchId?: number };
type CanWalk = (point: Point) => boolean;

export const GRASS_SEARCH_RADIUS = 420;
export const GRASS_SPOT_RADIUS = 160;
export const GRASS_ENGAGE_RADIUS = 260;
export const GRASS_ARRIVAL_RADIUS = 1;
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

// Os objetos são ancorados na BASE do sprite; trainerPos é o CENTRO do
// treinador, com os pés 28px abaixo. Ir a tile.y deixa o personagem FORA.
export function grassTileCenter(tile: GrassTile, feetOffset = 28): Point {
  return { x: tile.x, y: tile.y - tile.h * 0.47 + 8 - feetOffset };
}

export function isOnGrassTile(tile: GrassTile, point: Point, feetOffset = 28, padding = 0): boolean {
  const feet = point.y + feetOffset;
  return Math.abs(point.x - tile.x) <= tile.w * 0.44 + padding
    && feet >= tile.y - tile.h * 0.74 + 8 - padding
    && feet <= tile.y - tile.h * 0.20 + 14 + padding;
}

export function isInGrassPatch(patch: GrassPatch, point: Point, padding = 0, feetOffset = 28): boolean {
  return patch.tiles.some((tile) => isOnGrassTile(tile, point, feetOffset, padding));
}

export function buildGrassPatches(objects: GrassTile[]): GrassPatch[] {
  const tiles = objects.filter((tile) =>
    (tile.stepGrass || /^mato_(verde|azul|rosa|roxo)$/.test(tile.assetId ?? ""))
    && Number.isFinite(tile.x) && Number.isFinite(tile.y) && tile.w > 0 && tile.h > 0);
  const used = new Set<number>();
  const patches: GrassPatch[] = [];
  for (let i = 0; i < tiles.length; i++) {
    if (used.has(i)) continue;
    const group: GrassTile[] = [];
    const stack = [i];
    used.add(i);
    while (stack.length) {
      const current = tiles[stack.pop()!];
      group.push(current);
      const p = grassTileCenter(current);
      for (let j = 0; j < tiles.length; j++) {
        if (used.has(j)) continue;
        const other = tiles[j], q = grassTileCenter(other);
        // Respeita o tamanho editado (40, 45, 48px...), não um raio fixo de 46.
        if (Math.abs(p.x - q.x) <= (current.w + other.w) / 2 + 6
          && Math.abs(p.y - q.y) <= (current.h + other.h) / 2 + 6) {
          used.add(j);
          stack.push(j);
        }
      }
    }
    const centers = group.map((tile) => grassTileCenter(tile));
    const average = {
      x: centers.reduce((sum, p) => sum + p.x, 0) / centers.length,
      y: centers.reduce((sum, p) => sum + p.y, 0) / centers.length,
    };
    const center = centers.reduce((best, p) => distance(p, average) < distance(best, average) ? p : best);
    patches.push({ id: Math.min(...group.map((tile) => tile.id)), tiles: group, center });
  }
  return patches;
}

export function nearestGrassPatch(patches: GrassPatch[], point: Point, radius: number): GrassPatch | null {
  let best: GrassPatch | null = null, bestDistance = radius;
  for (const patch of patches) {
    for (const tile of patch.tiles) {
      const d = isOnGrassTile(tile, point) ? 0 : distance(grassTileCenter(tile), point);
      if (d <= bestDistance) { best = patch; bestDistance = d; }
    }
  }
  return best;
}

export function walkableSegment(from: Point, to: Point, canWalk: CanWalk): boolean {
  const steps = Math.max(1, Math.ceil(distance(from, to) / 3));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    if (!canWalk({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t })) return false;
  }
  return true;
}

// Busca LOCAL e limitada: só ao escolher/recalcular um destino, nunca por frame.
// Contorna uma árvore/quina sem atravessar paredes nem buscar uma volta pelo mapa.
export function findGrassPath(from: Point, to: Point, canWalk: CanWalk): Point[] | null {
  if (!canWalk(to)) return null;
  if (walkableSegment(from, to, canWalk)) return [to];
  const step = 16, margin = 128;
  const minX = Math.min(from.x, to.x) - margin, maxX = Math.max(from.x, to.x) + margin;
  const minY = Math.min(from.y, to.y) - margin, maxY = Math.max(from.y, to.y) + margin;
  type Node = Point & { key: string; cost: number; score: number; parent?: Node };
  const open: Node[] = [];
  const costs = new Map<string, number>();
  const walkCache = new Map<string, boolean>();
  const push = (node: Node) => {
    let i = open.length;
    open.push(node);
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (open[parent].score <= node.score) break;
      open[i] = open[parent]; i = parent;
    }
    open[i] = node;
  };
  const pop = (): Node => {
    const first = open[0], last = open.pop()!;
    if (open.length) {
      let i = 0;
      while (i * 2 + 1 < open.length) {
        let child = i * 2 + 1;
        if (child + 1 < open.length && open[child + 1].score < open[child].score) child++;
        if (last.score <= open[child].score) break;
        open[i] = open[child]; i = child;
      }
      open[i] = last;
    }
    return first;
  };
  push({ ...from, key: "0,0", cost: 0, score: distance(from, to) });
  costs.set("0,0", 0);
  let visited = 0;
  while (open.length && visited++ < 4096) {
    const node = pop();
    if (node.cost !== costs.get(node.key)) continue;
    if (distance(node, to) <= step * 1.5 && walkableSegment(node, to, canWalk)) {
      const path: Point[] = [to];
      let current: Node | undefined = node;
      while (current?.parent) { path.push({ x: current.x, y: current.y }); current = current.parent; }
      path.reverse();
      // Suaviza só segmentos comprovadamente livres (sem cortar quinas).
      const smooth: Point[] = [];
      let start = from, index = 0;
      while (index < path.length) {
        let farthest = index;
        for (let j = index + 1; j < path.length; j++) {
          if (!walkableSegment(start, path[j], canWalk)) break;
          farthest = j;
        }
        smooth.push(path[farthest]); start = path[farthest]; index = farthest + 1;
      }
      return smooth;
    }
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const x = node.x + dx * step, y = node.y + dy * step;
        if (x < minX || x > maxX || y < minY || y > maxY) continue;
        const key = `${Math.round((x - from.x) / step)},${Math.round((y - from.y) / step)}`;
        const cost = node.cost + Math.hypot(dx, dy) * step;
        if (cost > 720 || cost >= (costs.get(key) ?? Infinity)) continue;
        let walk = walkCache.get(key);
        if (walk === undefined) { walk = canWalk({ x, y }); walkCache.set(key, walk); }
        if (!walk || !walkableSegment(node, { x, y }, canWalk)) continue;
        // Diagonal não corta uma parede entre dois passos cardinais.
        if (dx && dy && (!canWalk({ x, y: node.y }) || !canWalk({ x: node.x, y }))) continue;
        costs.set(key, cost);
        push({ x, y, key, cost, score: cost + distance({ x, y }, to), parent: node });
      }
    }
  }
  return null;
}

export type GrassHuntState = {
  patchId: number | null;
  center: Point | null;
  entered: boolean;
  targetId: number | null;
  waypoint: number;
  route: Point[];
  destination: Point | null;
  progress: Point | null;
  progressAt: number;
  retryAt: number;
};
export function createGrassHuntState(): GrassHuntState {
  return { patchId: null, center: null, entered: false, targetId: null, waypoint: 0,
    route: [], destination: null, progress: null, progressAt: 0, retryAt: 0 };
}

export function grassHuntEnemies<T extends HuntEnemy>(
  state: GrassHuntState, patches: GrassPatch[], enemies: T[], trainer: Point, canWalk?: CanWalk,
): T[] {
  const patch = patches.find((p) => p.id === state.patchId), center = state.center;
  if (!state.entered || !patch || !center || !isInGrassPatch(patch, trainer)
    || distance(trainer, center) > GRASS_SPOT_RADIUS + 12) return [];
  return enemies.filter((enemy) => {
    if (enemy.hp <= 0 || distance(enemy, trainer) > GRASS_ENGAGE_RADIUS) return false;
    // Qualquer inimigo próximo e alcançável deve ser combatido — inclusive
    // Slime, spawn do editor ou Pokémon que nasceu em outro canteiro. Antes o
    // filtro exigia `grassPatchId === patch.id` e ignorava alvos ao lado.
    return !canWalk || walkableSegment(trainer, enemy, canWalk);
  });
}

type HuntAction = { kind: "walk"; point: Point } | { kind: "battle"; targetId: number } | { kind: "wait" };
export function tickGrassHunt(
  state: GrassHuntState,
  input: { patches: GrassPatch[]; position: Point; enemies: HuntEnemy[]; canWalk: CanWalk; now: number },
): HuntAction {
  const { patches, position, enemies, canWalk, now } = input;
  if (now < state.retryAt) return { kind: "wait" };
  let patch = patches.find((p) => p.id === state.patchId);
  if (state.patchId === null) {
    patch = nearestGrassPatch(patches, position, GRASS_SEARCH_RADIUS) ?? undefined;
    if (!patch) return { kind: "wait" };
    state.patchId = patch.id; // não troca de canteiro, nem se o caminho estiver bloqueado
  }
  if (!patch) return { kind: "wait" };
  if (!state.center) {
    const points = patch.tiles.map((tile) => grassTileCenter(tile)).filter(canWalk);
    if (!points.length) { state.retryAt = now + 1000; return { kind: "wait" }; }
    const entry = points.reduce((best, p) => distance(p, position) < distance(best, position) ? p : best);
    const local = points.filter((p) => distance(p, entry) <= GRASS_SPOT_RADIUS);
    const average = { x: local.reduce((s, p) => s + p.x, 0) / local.length,
      y: local.reduce((s, p) => s + p.y, 0) / local.length };
    const choices = local.filter((p) => distance(p, position) <= GRASS_SEARCH_RADIUS)
      .sort((a, b) => distance(a, average) - distance(b, average));
    for (const center of choices.slice(0, 8)) {
      const path = findGrassPath(position, center, canWalk);
      if (!path) continue;
      state.center = center; state.route = path; state.destination = center;
      state.progress = position; state.progressAt = now;
      break;
    }
    if (!state.center) { state.retryAt = now + 1000; return { kind: "wait" }; }
  }
  const center = state.center;
  if (!state.entered && distance(position, center) <= GRASS_ARRIVAL_RADIUS && isInGrassPatch(patch, position)) {
    state.entered = true; state.route = []; state.destination = null;
  }
  if (state.entered && (distance(position, center) > GRASS_SPOT_RADIUS + 12 || !isInGrassPatch(patch, position, 12))) {
    state.entered = false; state.route = []; state.destination = null;
  }
  const targets = grassHuntEnemies(state, patches, enemies, position, canWalk);
  const target = targets.find((e) => e.id === state.targetId)
    ?? targets.sort((a, b) => distance(a, position) - distance(b, position))[0];
  state.targetId = target?.id ?? null;
  if (target) {
    state.route = []; state.destination = null;
    return { kind: "battle", targetId: target.id };
  }
  while (state.route.length && distance(position, state.route[0]) <= GRASS_ARRIVAL_RADIUS) state.route.shift();
  if (state.route.length) {
    if (!state.progress || distance(position, state.progress) >= 2) {
      state.progress = position; state.progressAt = now;
    } else if (now - state.progressAt > 900) {
      state.route = []; state.destination = null; state.retryAt = now + 250;
      if (state.entered) state.waypoint++;
      return { kind: "wait" };
    }
    return { kind: "walk", point: state.route[0] };
  }
  const patrolWalk: CanWalk = (p) => canWalk(p) && distance(p, center) <= GRASS_SPOT_RADIUS + 8
    && isInGrassPatch(patch!, p, 10);
  const points = patch.tiles.map((tile) => grassTileCenter(tile))
    .filter((p) => distance(p, center) <= GRASS_SPOT_RADIUS && canWalk(p));
  if (!points.length) { state.retryAt = now + 1000; return { kind: "wait" }; }
  const minX = Math.min(...points.map((p) => p.x)), maxX = Math.max(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y)), maxY = Math.max(...points.map((p) => p.y));
  const nearest = (p: Point) => points.reduce((best, q) => distance(q, p) < distance(best, p) ? q : best);
  const waypoints = [center, nearest({ x: minX, y: minY }), nearest({ x: maxX, y: minY }),
    nearest({ x: maxX, y: maxY }), nearest({ x: minX, y: maxY })];
  // Mesmo um tile isolado tem uma pequena patrulha interna, não vira um alvo de raio 40.
  if (points.length === 1) {
    waypoints.push({ x: center.x - 8, y: center.y }, { x: center.x + 8, y: center.y },
      { x: center.x, y: center.y - 6 }, { x: center.x, y: center.y + 6 });
  }
  for (let attempt = 0; attempt < waypoints.length; attempt++) {
    const destination = state.entered ? waypoints[state.waypoint++ % waypoints.length] : center;
    if (distance(position, destination) <= GRASS_ARRIVAL_RADIUS) continue;
    const route = findGrassPath(position, destination, state.entered ? patrolWalk : canWalk);
    if (!route) continue;
    state.route = route; state.destination = destination;
    state.progress = position; state.progressAt = now;
    return { kind: "walk", point: route[0] };
  }
  state.retryAt = now + 1000;
  return { kind: "wait" };
}
