// Константы игры WAY.EXE (source: original/game_data.md)

export const MAP = {
  WIDTH: 76,
  HEIGHT: 14,
};

export const PLAYER = {
  START_MONEY: 400,
  START_HP: 100,
  START_MAX_HP: 100,
  BASE_CARRY: 40, // кг
};

// Скорость по местности (дней на шаг)
export const TERRAIN_DAYS = {
  desert: 1,
  sand: 2,
  mountain: 3,
  lake: null, // непроходимо
  tavern: 1,
  saloon: 1,
  treasure: 1,
};

// Скорость движения (км/день)
export const TRANSPORT_SPEED = {
  foot: 50,
  thin_ox: 100,
  good_ox: 150,
};

// Вес предметов (кг)
export const ITEM_WEIGHT = {
  money: 0,
  food: 0.2,
  ammo: 0.05,
  medicine: 0.08,
  clothes: 0.06,
};

// Вероятности типов клеток карты (%)
export const TERRAIN_PROB = {
  desert: 72,
  lake: 9,
  sand: 8,
  mountain: 6,
  tavern: 5,
};

// Цены (покупка у НПС)
export const PRICES_BUY = {
  saloon:  { food: 1,  ammo: 2, medicine: 1, clothes: 1 },
  tavern:  { food: 5,  ammo: 2, medicine: 1, clothes: 1 },
  indians: { food: 2,  ammo: 4, medicine: 2, clothes: 2 },
};

// Цена продажи (одинакова везде)
export const PRICE_SELL = { food: 0.5, ammo: 1, medicine: 0.5, clothes: 0.5 };

// Урон врагов
export const ENEMY = {
  wolf:   { BASE_HP: 14, SPREAD: 5, dmgMin: 3,  dmgMax: 8,  xp: 40  },
  deer:   { BASE_HP: 11, SPREAD: 5, dmgMin: 0,  dmgMax: 0,  xp: 30  },
  bandit: { BASE_HP: 20, SPREAD: 5, dmgMin: 4,  dmgMax: 14, xp: 50  },
  bill:   { BASE_HP: 31, SPREAD: 5, dmgMin: 5,  dmgMax: 19, xp: 100 },
};

// Точность игрока (кольт, %)
export const PLAYER_ACCURACY = {
  0:  { day: 80, night: 60 },
  25: { day: 55, night: 35 },
  50: { day: 30, night: 10 },
};

// Точность врагов (%)
export const ENEMY_ACCURACY = {
  bandit: { 0: { day: 60, night: 55 }, 25: { day: 35, night: 30 }, 50: { day: 20, night: 15 } },
  wolf:   { 0: { day: 70, night: 65 } },
  bill:   { 0: { day: 75, night: 75 }, 25: { day: 55, night: 50 }, 50: { day: 30, night: 25 } },
};

// Шанс обнаружения при сближении (для порта)
export const DETECTION_CHANCE = {
  deer:   { 50: { day: 45, night: 25 }, 25: { day: 70, night: 45 }, 0: { day: 95, night: 75 } },
  bandit: { 50: { day: 15, night:  5 }, 25: { day: 35, night: 20 }, 0: { day: 65, night: 45 } },
};

// Болезни
export const DISEASES = {
  cold:     { dmg: 5  },
  flu:      { dmg: 10 },
  jaundice: { dmg: 15 },
};

// Рационы (еда в день)
export const RATIONS = {
  1: 7,
  2: 5,
  3: 3,
};
