import { View, Text, StyleSheet } from 'react-native';
import { DOS } from '../../App';

// Рамка в DOS-стиле с заголовком
// props: title, children, style, titleColor
export default function DosBox({ title, children, style, titleColor }) {
  return (
    <View style={[styles.box, style]}>
      {title ? (
        <Text style={[styles.title, { color: titleColor ?? DOS.cyan, fontFamily: DOS.font }]}>
          {'╔' + '═'.repeat(2) + ' ' + title + ' ' + '═'.repeat(2) + '╗'}
        </Text>
      ) : null}
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

// Простая горизонтальная линия-разделитель
export function DosLine({ color }) {
  return (
    <Text style={{ color: color ?? DOS.cyan, fontFamily: DOS.font, fontSize: 11 }}>
      {'─'.repeat(40)}
    </Text>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: DOS.cyan,
  },
  title: {
    fontSize: 11,
    letterSpacing: 0,
    paddingHorizontal: 4,
    marginTop: -1,
  },
  inner: {
    padding: 4,
  },
});
