import { Image } from 'expo-image';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './themed-text';

const PHONE_NUMBER = '8444384786'; // (844) 4-DUI STOP

/**
 * Header image component for ParallaxScrollView
 * Displays Meehan Law Firm logo and call-to-action
 */
export function MeehanHeaderImage() {
  const handleCall = () => {
    Linking.openURL(`tel:${PHONE_NUMBER}`);
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/fav.png')}
        style={styles.logo}
        contentFit="contain"
        transition={200}
      />
      <TouchableOpacity onPress={handleCall} style={styles.callContainer}>
        <ThemedText style={styles.callText} lightColor="#FFFFFF" darkColor="#FFFFFF">
          Got Arrested? call{' '}
          <ThemedText style={styles.callTextHighlight} lightColor="#FF6B35" darkColor="#FF6B35">
            24/7
          </ThemedText>
        </ThemedText>
        <ThemedText style={styles.phoneText} lightColor="#FFFFFF" darkColor="#FFFFFF">
          (844) 4-{' '}
          <ThemedText style={styles.phoneTextHighlight} lightColor="#FF6B35" darkColor="#FF6B35">
            DUI
          </ThemedText>{' '}
          STOP
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  logo: {
    width: 50,
    height: 50,
  },
  callContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  callText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 2,
  },
  callTextHighlight: {
    fontSize: 14,
    fontWeight: '600',
  },
  phoneText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
    letterSpacing: 0.5,
  },
  phoneTextHighlight: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

