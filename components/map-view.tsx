import Constants from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

type Region = {
    latitude: number;
    longitude: number;
};

const UNITED_STATES_CENTER: Region = {
  latitude: 39.8283,
  longitude: -98.5795,
};

const SAN_FRANCISCO_CENTER: Region = {
  latitude: 37.7749,
  longitude: -122.4194,
};

const INITIAL_ZOOM = 10.5;
const MIN_ZOOM = 3;
const MAX_ZOOM = 22;
const PITCH = 50;
const BEARING = 30;
const STYLE_URL = 'mapbox://styles/mapbox/dark-v11';

function getMapboxApiKey(): string {
  return (
    Constants.expoConfig?.extra?.mapboxApiKey ||
    process.env.EXPO_PUBLIC_MAPBOX_API_KEY ||
    ''
  );
}

export function MapViewComponent() {
  const apiKey = getMapboxApiKey();
  const isWeb = Platform.OS === 'web';
  const isExpoGo = Constants.appOwnership === 'expo';
  const [mapbox, setMapbox] = useState<any>(null);
  const [nativeError, setNativeError] = useState<string | null>(null);

  useEffect(() => {
    if (isWeb) return;
    if (isExpoGo) {
      setNativeError('Mapbox requires a custom dev build (not Expo Go).');
          return;
        }
    let cancelled = false;
    (async () => {
      try {
        const mod = await import('@rnmapbox/maps');
        if (!cancelled) {
          setMapbox(mod);
        }
      } catch (err: any) {
        if (!cancelled) {
          setNativeError(err?.message || 'Mapbox native module unavailable.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isWeb, isExpoGo]);

  if (!apiKey) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.message}>Mapbox API key missing.</Text>
      </View>
    );
        }

  if (isWeb) {
    return <WebMap apiKey={apiKey} />;
      }

  if (isExpoGo) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.message}>
          Mapbox needs a dev build. Run `npx expo run:ios` or `npx expo run:android`
          and open with Expo Dev Client.
        </Text>
      </View>
    );
  }

  if (nativeError) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.message}>Mapbox error: {nativeError}</Text>
      </View>
    );
    }
    
  if (!mapbox) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.message}>Loading Mapbox…</Text>
      </View>
    );
    }
    
  mapbox.setAccessToken(apiKey);

  return (
    <View style={styles.container}>
      <mapbox.MapView
        style={StyleSheet.absoluteFill}
        styleURL={STYLE_URL}
        rotateEnabled
        scrollEnabled
        zoomEnabled
        pitchEnabled
        logoEnabled={false}
        compassEnabled
      >
        <mapbox.Camera
          centerCoordinate={[SAN_FRANCISCO_CENTER.longitude, SAN_FRANCISCO_CENTER.latitude]}
          zoomLevel={INITIAL_ZOOM}
          minZoomLevel={MIN_ZOOM}
          maxZoomLevel={MAX_ZOOM}
          pitch={PITCH}
          heading={BEARING}
        />

        {/* 3D buildings */}
        <mapbox.FillExtrusionLayer
          id="3d-buildings"
          sourceID="composite"
          sourceLayerID="building"
          minZoomLevel={15}
          style={{
            fillExtrusionColor: '#9bb1ff',
            fillExtrusionOpacity: 0.9,
            fillExtrusionHeight: ['get', 'height'],
            fillExtrusionBase: ['get', 'min_height'],
          }}
        />
      </mapbox.MapView>
    </View>
  );
}

function WebMap({ apiKey }: { apiKey: string }) {
  const containerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let map: any = null;
    let cancelled = false;

    async function initMap() {
      try {
        const mapboxgl = (await import('mapbox-gl')).default;
        mapboxgl.accessToken = apiKey;

        if (!containerRef.current || cancelled) {
          return;
        }

        map = new mapboxgl.Map({
          container: containerRef.current,
          style: STYLE_URL,
          center: [SAN_FRANCISCO_CENTER.longitude, SAN_FRANCISCO_CENTER.latitude],
          zoom: INITIAL_ZOOM,
          minZoom: MIN_ZOOM,
          maxZoom: MAX_ZOOM,
          pitch: PITCH,
          bearing: BEARING,
          antialias: true,
        });

        map.on('load', () => {
          if (cancelled) return;

          // Insert 3D buildings layer above labels
          const layers = map.getStyle().layers;
          const labelLayerId =
            layers?.find((layer: any) => layer.type === 'symbol' && layer.layout?.['text-field'])
              ?.id || undefined;

          if (!map.getLayer('3d-buildings')) {
            map.addLayer(
              {
                id: '3d-buildings',
                source: 'composite',
                'source-layer': 'building',
                filter: ['==', 'extrude', 'true'],
                type: 'fill-extrusion',
                minzoom: 15,
                paint: {
                  'fill-extrusion-color': '#9bb1ff',
                  'fill-extrusion-height': ['get', 'height'],
                  'fill-extrusion-base': ['get', 'min_height'],
                  'fill-extrusion-opacity': 0.9,
                },
              },
              labelLayerId,
            );
          }

          setLoading(false);
        });
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load Mapbox');
          setLoading(false);
        }
      }
    }

            initMap();

          return () => {
      cancelled = true;
      if (map) {
            map.remove();
      }
          };
  }, [apiKey]);

    return (
      <View style={styles.container}>
      <View ref={containerRef} style={styles.webMap} />
      {loading && (
        <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.message}>Loading map…</Text>
          </View>
        )}
      {error && (
        <View style={styles.overlay}>
          <Text style={styles.message}>Map error: {error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0b1626',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    marginTop: 8,
    color: '#d8e8ff',
  },
  webMap: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
});
