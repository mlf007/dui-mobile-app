import { useCheckpoints } from '@/hooks/use-checkpoints';
import type { Checkpoint } from '@/lib/types/checkpoint';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomDrawer } from './bottom-drawer';
import { CheckpointList } from './checkpoint-list';

const PHONE_NUMBER = '8444384786'; // (844) 4-DUI STOP

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  
  // Fetch checkpoints
  const { checkpoints, loading } = useCheckpoints();
  
  // Animation for icon rotation
  const rotation = useSharedValue(0);

  const handleCall = () => {
    Linking.openURL(`tel:${PHONE_NUMBER}`);
  };

  const handleCenterButton = () => {
    const newState = !isDrawerOpen;
    setIsDrawerOpen(newState);
    // Animate icon rotation without bounce
    rotation.value = withTiming(newState ? 180 : 0, {
      duration: 300,
    });
  };

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  // Find routes by name
  const callRoute = state.routes.find(r => r.name === 'test-api');

  const renderTab = (route: (typeof state.routes)[0], index: number) => {
    if (!route) return null;
    const { options } = descriptors[route.key];
    const isFocused = state.index === index;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    const onLongPress = () => {
      navigation.emit({
        type: 'tabLongPress',
        target: route.key,
      });
    };

    // Custom icons based on route name
    let iconName: keyof typeof Ionicons.glyphMap = 'home';
    if (route.name === 'first-aid') {
      iconName = 'clipboard-outline';
    } else if (route.name === 'test-api') {
      iconName = 'call';
    }

    // Special rendering for call button (test-api route)
    if (route.name === 'test-api') {
      return (
        <TouchableOpacity
          key={route.key}
          accessibilityRole="button"
          accessibilityState={isFocused ? { selected: true } : {}}
          accessibilityLabel={options.tabBarAccessibilityLabel}
          testID={options.tabBarTestID}
          onPress={handleCall}
          onLongPress={onLongPress}
          style={styles.callBanner}
          activeOpacity={0.8}>
          <View style={styles.callBannerContent}>
            <View style={styles.callIconContainer}>
              <Ionicons name="call" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.callTextContainer}>
              <Text style={styles.callBannerText}>
                Got arrested. Call us Now.
              </Text>
              <View style={styles.callPhoneRow}>
                <Text style={styles.callBannerPhone}>(844) 4-</Text>
                <Text style={styles.callBannerPhoneHighlight}>DUI</Text>
                <Text style={styles.callBannerPhone}> STOP</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        testID={options.tabBarTestID}
        onPress={onPress}
        onLongPress={onLongPress}
        style={styles.bottomTab}>
        <Ionicons
          name={iconName}
          size={24}
          color={isFocused ? '#FF6B35' : '#9BA1A6'}
        />
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.tabBarBlur}>
          <View style={styles.tabBar}>
          {/* First button - Menu (moved to first position) */}
          <View style={styles.centerButtonContainer}>
            <TouchableOpacity
              style={styles.centerButton}
              onPress={handleCenterButton}
              activeOpacity={0.7}>
              <Animated.View style={iconAnimatedStyle}>
                <Ionicons
                  name={isDrawerOpen ? 'close' : 'menu'}
                  size={24}
                  color="#FFFFFF"
                />
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Second tab - Call Banner */}
          {callRoute && renderTab(callRoute, state.routes.findIndex(r => r.name === 'test-api'))}

          {/* Last tab - First Aid (styled like menu button) */}
          <View style={styles.centerButtonContainer}>
            <TouchableOpacity
              style={styles.centerButton}
              onPress={() => {
                router.push('/first-aid-modal');
              }}
              activeOpacity={0.7}>
              <Image
                source={require('@/assets/images/MEDICAL.png')}
                style={styles.medicalIcon}
                contentFit="contain"
              />
            </TouchableOpacity>
          </View>
          </View>
        </View>
      </View>

      {/* Bottom Drawer */}
      <BottomDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          rotation.value = withTiming(0, {
            duration: 300,
          });
        }}>
        <View style={styles.drawerContentWrapper}>
          <Text style={styles.drawerTitle}>DUI Checkpoints</Text>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search city, county..."
              placeholderTextColor="#9BA1A6"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
              onPress={() => setActiveTab('upcoming')}
              activeOpacity={0.7}>
              <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
                Upcoming
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'past' && styles.tabActivePast]}
              onPress={() => setActiveTab('past')}
              activeOpacity={0.7}>
              <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActivePast]}>
                Past
              </Text>
            </TouchableOpacity>
          </View>

          {/* Checkpoint List - Using FlatList for better scrolling */}
          <CheckpointList
            checkpoints={checkpoints}
            loading={loading}
            searchQuery={searchQuery}
            activeTab={activeTab}
            onSearchChange={setSearchQuery}
            onCheckpointSelect={(checkpoint) => {
              setSelectedCheckpoint(checkpoint);
              // Close drawer on mobile after selection
              setIsDrawerOpen(false);
              rotation.value = withTiming(0, { duration: 300 });
            }}
            selectedCheckpoint={selectedCheckpoint}
          />
        </View>
      </BottomDrawer>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  tabBarBlur: {
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...Platform.select({
      ios: {
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
      },
      android: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        elevation: 8,
      },
    }),
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 64,
    maxHeight: 64,
  },
  bottomTab: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
  },
  centerButtonContainer: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
  },
  centerButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  callBanner: {
    flex: 1,
    backgroundColor: '#1a3a5c',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    minHeight: 56,
    maxHeight: 56,
    justifyContent: 'center',
  },
  callBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  callIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  callTextContainer: {
    flex: 1,
    gap: 3,
  },
  callBannerText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: 12,
  },
  callPhoneRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  callBannerPhone: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    lineHeight: 15,
  },
  callBannerPhoneHighlight: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B35',
    letterSpacing: 0.2,
    lineHeight: 15,
  },
  medicalIcon: {
    width: 24,
    height: 24,
  },
  drawerContentWrapper: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    marginTop: 4,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabActive: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  tabActivePast: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabTextActivePast: {
    color: '#FFFFFF',
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
});

