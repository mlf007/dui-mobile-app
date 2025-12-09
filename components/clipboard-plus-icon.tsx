import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ClipboardPlusIconProps {
  size?: number;
  color?: string;
}

export function ClipboardPlusIcon({ size = 24, color = '#FFFFFF' }: ClipboardPlusIconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Ionicons name="clipboard-outline" size={size * 0.85} color={color} style={styles.clipboard} />
      <View style={[styles.plusContainer, { width: size * 0.4, height: size * 0.4 }]}>
        <View style={[styles.plusLine, { width: size * 0.25, height: 2 }]} />
        <View style={[styles.plusLine, { width: 2, height: size * 0.25 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clipboard: {
    position: 'absolute',
  },
  plusContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusLine: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
});

