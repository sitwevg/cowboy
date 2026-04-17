import {
  View, Text, TouchableOpacity, StyleSheet,
  PanResponder, Platform, useWindowDimensions,
} from 'react-native';
import { useRef, useState, useCallback, useEffect } from 'react';
import { DOS } from '../../App';
import { MAP, TRANSPORT_SPEED } from '../data/constants';
import { CELL_CHAR, tryMove } from '../engine/map';
import { S } from '../data/strings';

const CELL_SIZES = [10, 12, 14, 16];
const DEFAULT_ZOOM = 1; // индекс в CELL_SIZES

const TERRAIN_COLOR = {
  desert:   DOS.white,
  sand:     '#AA5500',
  mountain: '#5555FF',
  lake:     DOS.cyan,
  tavern:   DOS.yellow,
  saloon:   DOS.yellow,
  treasure: DOS.yellow,
};

export default function MapScreen({ state, onMove, onMenu }) {
  const { width, height } = useWindowDimensions();
  const [zoomIdx, setZoomIdx] = useState(DEFAULT_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 }); // смещение viewport от игрока
  const cellSize = CELL_SIZES[zoomIdx];

  // Количество видимых клеток по размеру экрана
  // Оставляем ~40px сверху для статуса, ~60px снизу для легенды
  const MAP_AREA_W = width - 32;   // 32px под зум-кнопки слева
  const MAP_AREA_H = height - 100; // 40 статус + 60 легенда
  const visW = Math.floor(MAP_AREA_W / cellSize);
  const visH = Math.floor(MAP_AREA_H / cellSize);

  // Центр viewport = игрок + pan
  const centerX = state.pos.x + pan.x;
  const centerY = state.pos.y + pan.y;
  const startCol = Math.round(centerX - visW / 2);
  const startRow = Math.round(centerY - visH / 2);

  // Pan через PanResponder
  const panRef = useRef({ x: 0, y: 0 });
  const panStart = useRef(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, gs) => {
        panStart.current = { dx: gs.dx, dy: gs.dy, pan: { ...panRef.current } };
      },
      onPanResponderMove: (_, gs) => {
        if (!panStart.current) return;
        const cellSizeNow = CELL_SIZES[zoomIdx];
        const dxCells = Math.round((gs.dx - panStart.current.dx) / cellSizeNow);
        const dyCells = Math.round((gs.dy - panStart.current.dy) / cellSizeNow);
        panRef.current = {
          x: panStart.current.pan.x - dxCells,
          y: panStart.current.pan.y - dyCells,
        };
        setPan({ ...panRef.current });
      },
      onPanResponderRelease: () => { panStart.current = null; },
    })
  ).current;

  // Сброс pan при движении игрока
  const handleMove = useCallback((dx, dy) => {
    const result = tryMove(state, dx, dy);
    if (!result.ok) return;
    setPan({ x: 0, y: 0 });
    panRef.current = { x: 0, y: 0 };
    onMove(result);
  }, [state, onMove]);

  // Клавиатура (web)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (e) => {
      if (e.key === 'ArrowUp')    handleMove(0, -1);
      if (e.key === 'ArrowDown')  handleMove(0,  1);
      if (e.key === 'ArrowLeft')  handleMove(-1, 0);
      if (e.key === 'ArrowRight') handleMove( 1, 0);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleMove]);

  // Скорость для статус-бара
  const speed = state.ox === 'good' ? TRANSPORT_SPEED.good_ox
              : state.ox === 'thin' ? TRANSPORT_SPEED.thin_ox
              : TRANSPORT_SPEED.foot;

  return (
    <View style={styles.root}>
      {/* Статус-строка */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {'Дней в пути : ' + state.days}
        </Text>
        <Text style={styles.statusText}>
          {'Пройдено км. : ' + state.km}
        </Text>
        <Text style={styles.statusText}>
          {'Скорость : ' + speed + ' км/ч'}
        </Text>
        <TouchableOpacity onPress={onMenu} style={styles.menuBtn}>
          <Text style={[styles.statusText, { color: DOS.yellow }]}>МЕНЮ</Text>
        </TouchableOpacity>
      </View>

      {/* Основная область */}
      <View style={styles.body}>
        {/* Зум-кнопки */}
        <View style={styles.zoomCol}>
          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={() => setZoomIdx(i => Math.min(i + 1, CELL_SIZES.length - 1))}
          >
            <Text style={styles.zoomText}>+</Text>
          </TouchableOpacity>
          <View style={styles.zoomBtnGap} />
          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={() => setZoomIdx(i => Math.max(i - 1, 0))}
          >
            <Text style={styles.zoomText}>−</Text>
          </TouchableOpacity>
        </View>

        {/* Карта */}
        <View style={styles.mapWrap} {...panResponder.panHandlers}>
          {Array.from({ length: visH }, (_, row) => {
            const mapRow = startRow + row;
            return (
              <View key={row} style={styles.mapRow}>
                {Array.from({ length: visW }, (_, col) => {
                  const mapCol = startCol + col;
                  const inBounds = mapCol >= 0 && mapCol < MAP.WIDTH &&
                                   mapRow >= 0 && mapRow < MAP.HEIGHT;

                  if (!inBounds) {
                    return <Text key={col} style={[styles.cell, { fontSize: cellSize, color: '#111' }]}> </Text>;
                  }

                  const isPlayer = mapCol === state.pos.x && mapRow === state.pos.y;
                  const revealed = state.fog[mapRow][mapCol];
                  const terrain = state.map[mapRow][mapCol];

                  let char = ' ';
                  let color = '#333';

                  if (isPlayer) {
                    char = '@';
                    color = DOS.white;
                  } else if (revealed) {
                    char = CELL_CHAR[terrain] ?? '?';
                    color = TERRAIN_COLOR[terrain] ?? DOS.white;
                  } else {
                    char = '▓';
                    color = '#1a1a1a';
                  }

                  return (
                    <Text
                      key={col}
                      style={[styles.cell, { fontSize: cellSize, color }]}
                    >
                      {char}
                    </Text>
                  );
                })}
              </View>
            );
          })}
        </View>
      </View>

      {/* Легенда */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>
          · Пустыня  ░ Пески  ▲ Гора  O Озеро  T Таверна  S Салун  * Клад  @ Ты
        </Text>
        <Text style={[styles.legendText, { color: DOS.cyan, marginTop: 2 }]}>
          {S.MAP_PROMPT.split('\n')[0]}
        </Text>
      </View>

      {/* Навигационные кнопки */}
      <View style={styles.navCluster} pointerEvents="box-none">
        <TouchableOpacity onPress={() => handleMove(0, -1)} style={styles.navBtn}>
          <Text style={styles.navText}>↑</Text>
        </TouchableOpacity>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => handleMove(-1, 0)} style={styles.navBtn}>
            <Text style={styles.navText}>←</Text>
          </TouchableOpacity>
          <View style={[styles.navBtn, { backgroundColor: 'transparent', borderWidth: 0 }]} />
          <TouchableOpacity onPress={() => handleMove(1, 0)} style={styles.navBtn}>
            <Text style={styles.navText}>→</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => handleMove(0, 1)} style={styles.navBtn}>
          <Text style={styles.navText}>↓</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DOS.bg,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: DOS.cyan,
    paddingHorizontal: 8,
    paddingVertical: 3,
    height: 28,
  },
  statusText: {
    color: DOS.white,
    fontFamily: DOS.font,
    fontSize: 11,
  },
  menuBtn: {
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: DOS.yellow,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  zoomCol: {
    width: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: '#333',
  },
  zoomBtnGap: {
    height: 8,
  },
  zoomBtn: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: DOS.cyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomText: {
    color: DOS.cyan,
    fontFamily: DOS.font,
    fontSize: 14,
    lineHeight: 18,
  },
  mapWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  mapRow: {
    flexDirection: 'row',
  },
  cell: {
    fontFamily: DOS.font,
  },
  legend: {
    borderTopWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  legendText: {
    color: '#666',
    fontFamily: DOS.font,
    fontSize: 10,
  },
  navCluster: {
    position: 'absolute',
    right: 16,
    bottom: 70,
    alignItems: 'center',
  },
  navRow: {
    flexDirection: 'row',
  },
  navBtn: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: DOS.cyan,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DOS.bg,
  },
  navText: {
    color: DOS.cyan,
    fontFamily: DOS.font,
    fontSize: 18,
  },
});
