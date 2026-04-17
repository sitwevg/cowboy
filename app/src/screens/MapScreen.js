import {
  View, Text, TouchableOpacity, StyleSheet,
  PanResponder, Platform, useWindowDimensions,
} from 'react-native';
import { useRef, useState, useCallback, useEffect } from 'react';
import { DOS } from '../data/theme';
import { MAP, TRANSPORT_SPEED } from '../data/constants';
import { CELL_CHAR, tryMove } from '../engine/map';
import { S } from '../data/strings';

const CELL_SIZES = [9, 11, 13, 16];
const DEFAULT_ZOOM = 1;

// Цвета символов на сером фоне (как в DOS)
const CELL_COLOR = {
  desert:   '#888888', // почти не видно на сером — пустыня = пробел
  sand:     '#AA5500',
  mountain: '#FF55FF', // magenta
  lake:     '#00AAAA', // cyan
  tavern:   '#00AAAA',
  saloon:   '#00AAAA',
  treasure: '#FFFF55',
};

const MAP_BG = '#AAAAAA'; // серый DOS-фон карты

export default function MapScreen({ state, onMove, onMenu }) {
  const { width, height } = useWindowDimensions();
  const [zoomIdx, setZoomIdx] = useState(DEFAULT_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const cellSize = CELL_SIZES[zoomIdx];

  // Высота секций
  const STATUS_H = 24;
  const LEGEND_H = 44;
  const MAP_H = height - STATUS_H - LEGEND_H;

  // Ширина: левый столбец зума, основная карта, мини-карта справа
  const ZOOM_W = 24;
  const MINI_W = Math.min(80, width * 0.18);
  const MAP_W = width - ZOOM_W - MINI_W;

  const visW = Math.floor(MAP_W / cellSize);
  const visH = Math.floor(MAP_H / cellSize);

  const panRef = useRef({ x: 0, y: 0 });
  const panStart = useRef(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 3 || Math.abs(gs.dy) > 3,
      onPanResponderGrant: (_, gs) => {
        panStart.current = { dx: gs.dx, dy: gs.dy, pan: { ...panRef.current } };
      },
      onPanResponderMove: (_, gs) => {
        if (!panStart.current) return;
        const cs = CELL_SIZES[zoomIdx];
        const dxC = Math.round((gs.dx - panStart.current.dx) / cs);
        const dyC = Math.round((gs.dy - panStart.current.dy) / cs);
        panRef.current = {
          x: panStart.current.pan.x - dxC,
          y: panStart.current.pan.y - dyC,
        };
        setPan({ ...panRef.current });
      },
      onPanResponderRelease: () => { panStart.current = null; },
    })
  ).current;

  const handleMove = useCallback((dx, dy) => {
    const result = tryMove(state, dx, dy);
    if (!result.ok) return;
    setPan({ x: 0, y: 0 });
    panRef.current = { x: 0, y: 0 };
    onMove(result);
  }, [state, onMove]);

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

  const speed = state.ox === 'good' ? TRANSPORT_SPEED.good_ox
              : state.ox === 'thin' ? TRANSPORT_SPEED.thin_ox
              : TRANSPORT_SPEED.foot;

  const centerX = state.pos.x + pan.x;
  const centerY = state.pos.y + pan.y;
  const startCol = Math.round(centerX - visW / 2);
  const startRow = Math.round(centerY - visH / 2);

  // Мини-карта: сжатое отображение всей карты
  const miniCellW = Math.max(1, Math.floor(MINI_W / MAP.WIDTH));
  const miniCellH = Math.max(1, Math.floor((MAP_H * 0.6) / MAP.HEIGHT));

  return (
    <View style={styles.root}>
      {/* Статус-строка */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>{'Дней в пути : ' + state.days}</Text>
        <Text style={styles.statusText}>{'Пройдено км. : ' + state.km}</Text>
        <Text style={styles.statusText}>{'Скорость : ' + speed + ' км/ч'}</Text>
        <TouchableOpacity onPress={onMenu}>
          <Text style={[styles.statusText, { color: DOS.yellow }]}>ESC</Text>
        </TouchableOpacity>
      </View>

      {/* Основная область */}
      <View style={[styles.mapArea, { height: MAP_H }]}>
        {/* Зум */}
        <View style={[styles.zoomCol, { height: MAP_H }]}>
          <TouchableOpacity style={styles.zoomBtn}
            onPress={() => setZoomIdx(i => Math.min(i + 1, CELL_SIZES.length - 1))}>
            <Text style={styles.zoomText}>+</Text>
          </TouchableOpacity>
          <View style={{ height: 6 }} />
          <TouchableOpacity style={styles.zoomBtn}
            onPress={() => setZoomIdx(i => Math.max(i - 1, 0))}>
            <Text style={styles.zoomText}>−</Text>
          </TouchableOpacity>
        </View>

        {/* Карта с заголовком */}
        <View style={{ flex: 1 }}>
          {/* Заголовок К А Р Т А */}
          <View style={styles.mapHeader}>
            <View style={styles.mapHeaderLine} />
            <Text style={styles.mapHeaderText}>К А Р Т А</Text>
            <View style={styles.mapHeaderLine} />
          </View>

          {/* Сетка клеток */}
          <View
            style={[styles.mapGrid, { backgroundColor: MAP_BG }]}
            {...panResponder.panHandlers}
          >
            {Array.from({ length: visH }, (_, row) => {
              const mapRow = startRow + row;
              return (
                <View key={row} style={{ flexDirection: 'row' }}>
                  {Array.from({ length: visW }, (_, col) => {
                    const mapCol = startCol + col;
                    const inBounds = mapCol >= 0 && mapCol < MAP.WIDTH &&
                                     mapRow >= 0 && mapRow < MAP.HEIGHT;
                    if (!inBounds) {
                      return <View key={col} style={{ width: cellSize, height: cellSize, backgroundColor: '#000' }} />;
                    }
                    const isPlayer = mapCol === state.pos.x && mapRow === state.pos.y;
                    const revealed = state.fog[mapRow][mapCol];
                    const terrain = state.map[mapRow][mapCol];

                    if (!revealed) {
                      return <View key={col} style={{ width: cellSize, height: cellSize, backgroundColor: '#000' }} />;
                    }

                    let char = ' ';
                    let color = CELL_COLOR[terrain] ?? '#888';

                    if (isPlayer) {
                      char = '☻';
                      color = DOS.red;
                    } else if (terrain !== 'desert') {
                      char = CELL_CHAR[terrain] ?? ' ';
                    }

                    return (
                      <Text
                        key={col}
                        style={{
                          width: cellSize,
                          height: cellSize,
                          fontSize: cellSize - 2,
                          color,
                          fontFamily: DOS.font,
                          backgroundColor: MAP_BG,
                          textAlign: 'center',
                        }}
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

        {/* Мини-карта */}
        <View style={[styles.miniMapCol, { width: MINI_W, height: MAP_H }]}>
          <Text style={styles.miniTitle}>карта</Text>
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            {state.map.map((row, ry) => (
              <View key={ry} style={{ flexDirection: 'row' }}>
                {row.map((terrain, cx) => {
                  const isPlayer = cx === state.pos.x && ry === state.pos.y;
                  const revealed = state.fog[ry][cx];
                  let bg = '#000';
                  if (revealed) {
                    if (isPlayer)       bg = DOS.red;
                    else if (terrain === 'lake')    bg = '#005555';
                    else if (terrain === 'mountain') bg = '#550055';
                    else if (terrain === 'tavern' || terrain === 'saloon') bg = '#555500';
                    else if (terrain === 'treasure') bg = DOS.yellow;
                    else if (terrain === 'sand')    bg = '#553300';
                    else                            bg = '#555555';
                  }
                  return (
                    <View key={cx} style={{ width: miniCellW, height: miniCellH, backgroundColor: bg }} />
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Легенда */}
      <View style={styles.legendBlock}>
        <View style={styles.sectionHeader}>
          <View style={styles.headerLine} />
          <Text style={styles.sectionTitle}>У С Л О В Н Ы Е  О Б О З Н А Ч Е Н И Я</Text>
          <View style={styles.headerLine} />
        </View>
        <View style={styles.legendRow}>
          <Text style={styles.legendItem}>
            <Text style={{ color: '#888' }}>·</Text>
            <Text style={{ color: DOS.white }}> – Пустыня   </Text>
            <Text style={{ color: '#FF55FF' }}>▲</Text>
            <Text style={{ color: DOS.white }}> – Гора   </Text>
            <Text style={{ color: DOS.cyan }}>T</Text>
            <Text style={{ color: DOS.white }}> – Таверна   </Text>
            <Text style={{ color: DOS.yellow }}>*</Text>
            <Text style={{ color: DOS.white }}> – Клад!</Text>
          </Text>
        </View>
        <View style={styles.legendRow}>
          <Text style={styles.legendItem}>
            <Text style={{ color: '#AA5500' }}>░</Text>
            <Text style={{ color: DOS.white }}> – Зыбучие пески   </Text>
            <Text style={{ color: DOS.cyan }}>O</Text>
            <Text style={{ color: DOS.white }}> – Озеро   </Text>
            <Text style={{ color: DOS.cyan }}>S</Text>
            <Text style={{ color: DOS.white }}> – Салун</Text>
          </Text>
        </View>
      </View>

      {/* Навигация */}
      <View style={styles.navBlock}>
        <View style={styles.sectionHeader}>
          <View style={styles.headerLine} />
          <Text style={styles.sectionTitle}>Н А В И Г А Ц И Я</Text>
          <View style={styles.headerLine} />
        </View>
        <Text style={[styles.navText, { color: DOS.white }]}>
          Куда поедем добрый молодец? Управление, клавишами курсора, ESC – Меню
        </Text>
      </View>

      {/* Навигационные кнопки */}
      <View style={styles.navCluster} pointerEvents="box-none">
        <TouchableOpacity onPress={() => handleMove(0, -1)} style={styles.navBtn}>
          <Text style={styles.navBtnText}>↑</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={() => handleMove(-1, 0)} style={styles.navBtn}>
            <Text style={styles.navBtnText}>←</Text>
          </TouchableOpacity>
          <View style={styles.navBtn} />
          <TouchableOpacity onPress={() => handleMove(1, 0)} style={styles.navBtn}>
            <Text style={styles.navBtnText}>→</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => handleMove(0, 1)} style={styles.navBtn}>
          <Text style={styles.navBtnText}>↓</Text>
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
    height: 24,
  },
  statusText: {
    color: DOS.white,
    fontFamily: DOS.font,
    fontSize: 10,
  },
  mapArea: {
    flexDirection: 'row',
  },
  zoomCol: {
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: '#333',
  },
  zoomBtn: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: DOS.cyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomText: {
    color: DOS.cyan,
    fontFamily: DOS.font,
    fontSize: 13,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 14,
  },
  mapHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: DOS.cyan,
  },
  mapHeaderText: {
    color: DOS.cyan,
    fontFamily: DOS.font,
    fontSize: 10,
    paddingHorizontal: 4,
    letterSpacing: 1,
  },
  mapGrid: {
    flex: 1,
    overflow: 'hidden',
  },
  miniMapCol: {
    borderLeftWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  miniTitle: {
    color: '#555',
    fontFamily: DOS.font,
    fontSize: 8,
    paddingVertical: 2,
  },
  legendBlock: {
    borderTopWidth: 1,
    borderColor: DOS.cyan,
    paddingHorizontal: 4,
    paddingBottom: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 14,
  },
  headerLine: {
    flex: 1,
    height: 1,
    backgroundColor: DOS.cyan,
  },
  sectionTitle: {
    color: DOS.cyan,
    fontFamily: DOS.font,
    fontSize: 9,
    paddingHorizontal: 4,
    letterSpacing: 1,
  },
  legendRow: {
    paddingLeft: 4,
  },
  legendItem: {
    fontFamily: DOS.font,
    fontSize: 10,
  },
  navBlock: {
    borderTopWidth: 1,
    borderColor: DOS.cyan,
    paddingHorizontal: 4,
    paddingBottom: 2,
  },
  navText: {
    fontFamily: DOS.font,
    fontSize: 10,
    paddingLeft: 4,
  },
  navCluster: {
    position: 'absolute',
    right: 90,
    bottom: 8,
    alignItems: 'center',
  },
  navBtn: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: DOS.cyan,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DOS.bg,
  },
  navBtnText: {
    color: DOS.cyan,
    fontFamily: DOS.font,
    fontSize: 16,
  },
});
