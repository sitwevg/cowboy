import { MAP, TERRAIN_PROB, TERRAIN_DAYS } from '../data/constants';

// Символы клеток для рендера
export const CELL_CHAR = {
  desert:   '·',
  sand:     '░',
  mountain: '▲',
  lake:     'O',
  tavern:   'T',
  saloon:   'S',
  treasure: '*',
};

// Сколько таверн/салунов размещать
const TAVERN_COUNT = 3;
const SALOON_COUNT = 1;

function rnd(n) {
  return Math.floor(Math.random() * n);
}

// Выбрать тип клетки по вероятностям
function randomTerrain() {
  const r = rnd(100);
  let acc = 0;
  for (const [type, prob] of Object.entries(TERRAIN_PROB)) {
    acc += prob;
    if (r < acc) return type;
  }
  return 'desert';
}

// Проверить, что позиция свободна (не вода, не занята спец-клеткой)
function isFree(cells, x, y) {
  const t = cells[y][x];
  return t === 'desert' || t === 'sand' || t === 'mountain';
}

// Найти случайную свободную позицию
function randomFreePos(cells) {
  let x, y;
  let tries = 0;
  do {
    x = rnd(MAP.WIDTH);
    y = rnd(MAP.HEIGHT);
    tries++;
    if (tries > 10000) throw new Error('generateMap: не удалось найти свободную клетку');
  } while (!isFree(cells, x, y));
  return { x, y };
}

export function generateMap() {
  // 1. Заполнить случайным ландшафтом
  const cells = Array.from({ length: MAP.HEIGHT }, () =>
    Array.from({ length: MAP.WIDTH }, () => randomTerrain())
  );

  // Озёра не могут быть шире 1 клетки (просто точечные)
  // (оригинал не задокументирован точно, оставляем как есть)

  // 2. Разместить спец-клетки
  // Старт игрока — левый край, случайная строка, пустыня
  let startX = 0;
  let startY = rnd(MAP.HEIGHT);
  cells[startY][startX] = 'desert'; // стартовая клетка всегда пустыня

  // Клад — правый край ±10, случайная строка, не вода
  let treasureX, treasureY;
  let tries = 0;
  do {
    treasureX = MAP.WIDTH - 1 - rnd(5);
    treasureY = rnd(MAP.HEIGHT);
    tries++;
  } while (cells[treasureY][treasureX] === 'lake' && tries < 500);
  cells[treasureY][treasureX] = 'treasure';

  // Салун — рядом со стартом
  let saloonX, saloonY;
  tries = 0;
  do {
    saloonX = 2 + rnd(5);
    saloonY = rnd(MAP.HEIGHT);
    tries++;
  } while (!isFree(cells, saloonX, saloonY) && tries < 200);
  cells[saloonY][saloonX] = 'saloon';

  // Таверны — случайно по карте
  for (let i = 0; i < TAVERN_COUNT; i++) {
    try {
      const pos = randomFreePos(cells);
      cells[pos.y][pos.x] = 'tavern';
    } catch {}
  }

  // 3. Туман войны
  const fog = Array.from({ length: MAP.HEIGHT }, () =>
    Array(MAP.WIDTH).fill(false)
  );
  revealFog(fog, startX, startY);

  return {
    cells,
    fog,
    playerStart: { x: startX, y: startY },
    treasurePos: { x: treasureX, y: treasureY },
  };
}

// Открыть 3×3 вокруг позиции
export function revealFog(fog, x, y, radius = 1) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < MAP.WIDTH && ny >= 0 && ny < MAP.HEIGHT) {
        fog[ny][nx] = true;
      }
    }
  }
}

// Открыть прямоугольник (карта индейцев)
export function revealRect(fog, x, y, w, h) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < MAP.WIDTH && ny >= 0 && ny < MAP.HEIGHT) {
        fog[ny][nx] = true;
      }
    }
  }
}

// Попытка хода. Вернуть { ok, reason, newState }
export function tryMove(state, dx, dy) {
  const nx = state.pos.x + dx;
  const ny = state.pos.y + dy;

  if (nx < 0 || nx >= MAP.WIDTH || ny < 0 || ny >= MAP.HEIGHT) {
    return { ok: false, reason: 'edge' };
  }

  const terrain = state.map[ny][nx];

  if (terrain === 'lake') {
    return { ok: false, reason: 'lake' };
  }

  const days = TERRAIN_DAYS[terrain] ?? 1;
  const newFog = state.fog.map(row => [...row]);
  revealFog(newFog, nx, ny);

  // км: скорость зависит от вола
  let speed;
  if (state.ox === 'good') speed = 150;
  else if (state.ox === 'thin') speed = 100;
  else speed = 50;

  const newKm = state.km + speed * days;

  const newState = {
    ...state,
    pos: { x: nx, y: ny },
    days: state.days + days,
    km: newKm,
    fog: newFog,
  };

  // Определить следующую фазу
  if (terrain === 'treasure') {
    newState.phase = 'win';
  } else if (terrain === 'tavern' || terrain === 'saloon') {
    newState.phase = 'trading';
  } else {
    newState.phase = 'morning';
  }

  return { ok: true, state: newState, terrain, days };
}
