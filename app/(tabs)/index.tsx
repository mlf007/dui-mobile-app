import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapViewComponent } from '@/components/map-view';
import { MeehanHeaderImage } from '@/components/meehan-header-image';
import { useCheckpoints } from '@/hooks/use-checkpoints';
import type { Checkpoint } from '@/lib/types/checkpoint';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { checkpoints, loading } = useCheckpoints();
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);

  const handleMarkerClick = (checkpoint: Checkpoint) => {
    setSelectedCheckpoint(checkpoint);
  };

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top, height: 70 + insets.top }]}>
        <MeehanHeaderImage />
      </View>
      
      {/* Full Screen Map */}
      <View style={styles.mapContainer}>
        <MapViewComponent
          initialRegion={{
            latitude: 36.7783,
            longitude: -119.4179,
            latitudeDelta: 5.0,
            longitudeDelta: 5.0,
          }}
          checkpoints={checkpoints}
          onMarkerClick={handleMarkerClick}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          showsScale={true}
          showsBuildings={true}
          pitchEnabled={true}
          rotateEnabled={true}
          scrollEnabled={true}
          zoomEnabled={true}
          zoomControlEnabled={true}
          mapType="standard"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a3a5c',
  },
  header: {
    backgroundColor: '#1a3a5c',
    width: '100%',
    zIndex: 10,
  },
  mapContainer: {
    flex: 1,
    width: '100%',
  },
});
