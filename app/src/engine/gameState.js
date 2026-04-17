import { PLAYER, MAP } from '../data/constants';

export function createInitialState() {
  return {
    // Прогресс
    days: 0,
    km: 0,
    // Позиция
    pos: { x: 0, y: 0 }, // задаётся при генерации карты
    // Инвентарь
    money: PLAYER.START_MONEY,
    food: 0,
    ammo: 0,
    medicine: 0,
    clothes: 0,
    // Здоровье
    hp: PLAYER.START_HP,
    maxHp: PLAYER.START_MAX_HP,
    // Вол
    ox: null, // null | 'thin' | 'good'
    // Патроны в барабане
    chamber: 6,
    weaponInHand: 'colt', // 'colt' | 'knife'
    // Прокачка
    level: 0,
    xp: 0,
    skills: {
      immunity: 0,
      stealth: 0,
      sniper: 0,
      maxLoad: 0,
      damage: 0,
      regen: 0,
      extraXp: 0,
      vitality: 0,
      toughness: 0,
    },
    // Статистика
    banditsKilled: 0,
    billKilled: false,
    // Карта
    map: null,       // Array[HEIGHT][WIDTH] — тип клетки
    fog: null,       // Array[HEIGHT][WIDTH] — boolean (открыто/нет)
    // Флаги
    indiansBanned: false,
    ration: 2,       // 1/2/3
    isDay: true,
    // Фаза игры
    phase: 'splash', // splash | map | morning | event | combat | trading | levelup | win | lose
  };
}
