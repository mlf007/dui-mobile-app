import Constants from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

type Region = {
  latitude: number;
  longitude: number;
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

// Lazily require WebView only on native
let NativeWebView: any = null;
if (Platform.OS !== 'web') {
  try {
    NativeWebView = require('react-native-webview').WebView;
  } catch {
    NativeWebView = null;
  }
}

export function MapViewComponent() {
  const apiKey = getMapboxApiKey();
  const isWeb = Platform.OS === 'web';

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

  if (!NativeWebView) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.message}>WebView not available.</Text>
      </View>
    );
  }

  const html = generateMobileHTML(apiKey);

  return (
    <View style={styles.container}>
      <NativeWebView
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://api.mapbox.com' }}
        style={StyleSheet.absoluteFill}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        mixedContentMode="always"
        onError={(e: any) => {
          console.warn('WebView Mapbox error', e?.nativeEvent);
        }}
      />
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

function generateMobileHTML(apiKey: string): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />
    <link href="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css" rel="stylesheet" />
    <script src="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js"></script>
    <style>
      html, body, #map {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      (function () {
        function init() {
          if (!window.mapboxgl) return;

          mapboxgl.accessToken = '${apiKey}';

          var map = new mapboxgl.Map({
            container: 'map',
            style: '${STYLE_URL}',
            center: [${SAN_FRANCISCO_CENTER.longitude}, ${SAN_FRANCISCO_CENTER.latitude}],
            zoom: ${INITIAL_ZOOM},
            minZoom: ${MIN_ZOOM},
            maxZoom: ${MAX_ZOOM},
            pitch: ${PITCH},
            bearing: ${BEARING},
            antialias: true
          });

          map.on('load', function () {
            var layers = map.getStyle().layers;
            var labelLayerId = null;
            for (var i = 0; i < layers.length; i++) {
              var layer = layers[i];
              if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
                labelLayerId = layer.id;
                break;
              }
            }

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
                    'fill-extrusion-opacity': 0.9
                  }
                },
                labelLayerId || undefined
              );
            }
          });
        }

        if (window.mapboxgl) {
          init();
        } else {
          var interval = setInterval(function () {
            if (window.mapboxgl) {
              clearInterval(interval);
              init();
            }
          }, 100);
          setTimeout(function () {
            clearInterval(interval);
          }, 10000);
        }
      })();
    </script>
  </body>
</html>
`;
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
