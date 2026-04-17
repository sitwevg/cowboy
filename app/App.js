import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { S } from './src/data/strings';

export const DOS = {
  bg: '#000000',
  cyan: '#00AAAA',
  white: '#AAAAAA',
  green: '#00AA00',
  yellow: '#FFFF55',
  red: '#FF5555',
  font: Platform.OS === 'web' ? "'Courier New', monospace" : 'monospace',
};

export default function App() {
  const [screen, setScreen] = useState('splash');

  useEffect(() => {
    if (Platform.OS === 'web') {
      document.body.style.backgroundColor = DOS.bg;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.height = '100%';
      document.body.style.height = '100%';
    }
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      {screen === 'splash' && (
        <SplashScreen onContinue={() => setScreen('menu')} />
      )}
      {screen === 'menu' && (
        <MainMenu onNewGame={() => alert('Скоро!')} />
      )}
    </View>
  );
}

function SplashScreen({ onContinue }) {
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handler = () => onContinue();
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [onContinue]);

  return (
    <TouchableOpacity style={styles.splash} onPress={onContinue} activeOpacity={1}>
      <Text style={[styles.mono, { color: DOS.green, fontSize: 16 }]}>
        {S.TITLE}
      </Text>
      <Text style={[styles.mono, { color: DOS.green, fontSize: 16, marginTop: 8 }]}>
        {S.LINES_OF_CODE}
      </Text>
    </TouchableOpacity>
  );
}

function MainMenu({ onNewGame }) {
  const items = [
    { label: 'Новая игра', action: onNewGame },
    { label: 'Загрузить',  action: null },
    { label: 'Выход',      action: null },
  ];

  return (
    <View style={styles.menuScreen}>
      <View style={styles.menuBox}>
        <Text style={[styles.mono, styles.menuTitle]}>М Е Н Ю</Text>
        {items.map((item, i) => (
          <TouchableOpacity key={i} onPress={item.action || undefined}>
            <Text style={[styles.mono, styles.menuItem, { color: item.action ? DOS.white : '#555' }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
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
