import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { S } from './src/data/strings';
import { createInitialState } from './src/engine/gameState';
import { generateMap } from './src/engine/map';
import MapScreen from './src/screens/MapScreen';

export const DOS = {
  bg:     '#000000',
  cyan:   '#00AAAA',
  white:  '#AAAAAA',
  green:  '#00AA00',
  yellow: '#FFFF55',
  red:    '#FF5555',
  font:   Platform.OS === 'web' ? "'Courier New', monospace" : 'monospace',
};

export default function App() {
  const [screen, setScreen] = useState('splash');
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      document.body.style.backgroundColor = DOS.bg;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.height = '100%';
      document.body.style.height = '100%';
    }
  }, []);

  function startNewGame() {
    const { cells, fog, playerStart } = generateMap();
    const state = {
      ...createInitialState(),
      map: cells,
      fog,
      pos: playerStart,
      phase: 'map',
    };
    setGameState(state);
    setScreen('game');
  }

  const handleMove = useCallback((result) => {
    setGameState(result.state);
    // Фазы morning/trading/win будут роутиться в Фазе 2
  }, []);

  const handleMenu = useCallback(() => {
    setScreen('menu');
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      {screen === 'splash' && (
        <SplashScreen onContinue={() => setScreen('menu')} />
      )}

      {screen === 'menu' && (
        <MainMenu
          onNewGame={startNewGame}
          onResume={gameState ? () => setScreen('game') : null}
        />
      )}

      {screen === 'game' && gameState && (
        <MapScreen
          state={gameState}
          onMove={handleMove}
          onMenu={handleMenu}
        />
      )}
    </View>
  );
}

function SplashScreen({ onContinue }) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = () => onContinue();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onContinue]);

  return (
    <TouchableOpacity style={styles.splash} onPress={onContinue} activeOpacity={1}>
      <Text style={[styles.mono, { color: DOS.green, fontSize: 16 }]}>
        {S.TITLE}
      </Text>
      <Text style={[styles.mono, { color: DOS.green, fontSize: 16, marginTop: 8 }]}>
        {S.LINES_OF_CODE}
      </Text>
      <Text style={[styles.mono, { color: DOS.white, fontSize: 12, marginTop: 24 }]}>
        {S.PRESS_ANY_KEY}
      </Text>
    </TouchableOpacity>
  );
}

function MainMenu({ onNewGame, onResume }) {
  const items = [
    { label: 'Новая игра',  action: onNewGame },
    { label: 'Продолжить', action: onResume  },
    { label: 'Выход',      action: null      },
  ];

  return (
    <View style={styles.menuScreen}>
      <View style={styles.menuBox}>
        <Text style={[styles.mono, styles.menuTitle]}>М Е Н Ю</Text>
        {items.map((item, i) => {
          const active = !!item.action;
          return (
            <TouchableOpacity key={i} onPress={item.action || undefined} disabled={!active}>
              <Text style={[styles.mono, styles.menuItem, { color: active ? DOS.white : '#555' }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DOS.bg,
  },
  mono: {
    fontFamily: DOS.font,
  },
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DOS.bg,
  },
  menuScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DOS.bg,
  },
  menuBox: {
    borderWidth: 1,
    borderColor: DOS.cyan,
    paddingHorizontal: 32,
    paddingVertical: 16,
    minWidth: 240,
  },
  menuTitle: {
    color: DOS.cyan,
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
    letterSpacing: 2,
  },
  menuItem: {
    paddingVertical: 6,
    fontSize: 14,
  },
});
