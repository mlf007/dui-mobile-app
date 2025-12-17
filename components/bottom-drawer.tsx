import { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface BottomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

export function BottomDrawer({ isOpen, onClose, children }: BottomDrawerProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(1000);
  const opacity = useSharedValue(0);
  const startY = useSharedValue(0);

  const closeDrawer = () => {
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      // Ensure drawer opens from bottom
      translateY.value = 1000;
      opacity.value = 0;
      // Small delay to ensure state is set
      requestAnimationFrame(() => {
        translateY.value = withTiming(0, { duration: 300 });
        opacity.value = withTiming(1, { duration: 300 });
      });
    } else {
      translateY.value = withTiming(1000, { duration: 300 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isOpen]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      // Only allow dragging down
      if (event.translationY > 0) {
        translateY.value = startY.value + event.translationY;
      }
    })
    .onEnd((event) => {
      // If dragged down more than 100px, close the drawer
      if (event.translationY > 100 || translateY.value > 200) {
        translateY.value = withTiming(1000, { duration: 300 });
        opacity.value = withTiming(0, { duration: 200 });
        runOnJS(closeDrawer)();
      } else {
        // Snap back to open position
        translateY.value = withTiming(0, { duration: 300 });
      }
    });

  const drawerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  if (!isOpen && translateY.value === 1000) {
    return null;
  }

  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          overlayStyle,
          { paddingBottom: insets.bottom },
        ]}
        pointerEvents={isOpen ? 'auto' : 'none'}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      {/* Drawer */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.drawer,
            drawerStyle,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Content */}
          <ThemedView style={styles.content}>
            {children || (
              <View style={styles.defaultContent}>
                <ThemedText type="title" style={styles.title}>
                  Menu
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                  Drawer content goes here
                </ThemedText>
              </View>
            )}
          </ThemedView>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
  },
  drawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  defaultContent: {
    paddingVertical: 20,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.7,
  },
});

