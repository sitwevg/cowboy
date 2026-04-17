import { Platform } from 'react-native';

export const DOS = {
  bg:     '#000000',
  cyan:   '#00AAAA',
  white:  '#AAAAAA',
  green:  '#00AA00',
  yellow: '#FFFF55',
  red:    '#FF5555',
  font:   Platform.OS === 'web' ? "'Courier New', monospace" : 'monospace',
};
