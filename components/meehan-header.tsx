import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

const LOGO_URL = 'https://cdn.prod.website-files.com/668db2607224f56857ad5d85/66ac964485eaa20383644e2f_Group%20206.png';

export function MeehanHeader() {
  return (
    <ThemedView style={styles.header} lightColor="#1a3a5c" darkColor="#1a3a5c">
      <View style={styles.headerContent}>
        <Image
          source={{ uri: LOGO_URL }}
          style={styles.logo}
          contentFit="contain"
          transition={200}
        />
        <View style={styles.textContainer}>
          <ThemedText style={styles.meehanText} lightColor="#FFFFFF" darkColor="#FFFFFF">
            Meehan
          </ThemedText>
          <View style={styles.lawFirmContainer}>
            <ThemedText style={styles.lawText} lightColor="#FFFFFF" darkColor="#FFFFFF">
              Law
            </ThemedText>
            <ThemedText style={styles.firmText} lightColor="#FF6B35" darkColor="#FF6B35">
              {' '}Firm
            </ThemedText>
          </View>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    width: 60,
    height: 60,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  meehanText: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  lawFirmContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  lawText: {
    fontSize: 16,
    fontWeight: '500',
  },
  firmText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

