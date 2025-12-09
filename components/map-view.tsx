import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// For mobile, we'll use WebView to render Leaflet
let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').WebView;
  } catch (error) {
    console.log('react-native-webview not available');
  }
}

import type { Checkpoint } from '@/lib/types/checkpoint';

interface MapViewComponentProps {
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  checkpoints?: Checkpoint[];
  onMarkerClick?: (checkpoint: Checkpoint) => void;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  showsCompass?: boolean;
  showsScale?: boolean;
  showsBuildings?: boolean;
  showsTraffic?: boolean;
  mapType?: 'standard' | 'satellite' | 'hybrid' | 'terrain' | 'mutedStandard';
  pitchEnabled?: boolean;
  rotateEnabled?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  zoomControlEnabled?: boolean;
}

const DEFAULT_REGION = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

// Generate Leaflet HTML with dark mode and markers
function generateLeafletHTML(
  latitude: number,
  longitude: number,
  zoom: number,
  checkpoints: Checkpoint[] = [],
  onMarkerClick?: (checkpoint: Checkpoint) => void,
  darkMode: boolean = true
): string {
  // Serialize checkpoints for HTML
  const checkpointsJson = JSON.stringify(checkpoints);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
     integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
     crossorigin=""/>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    #map {
      width: 100%;
      height: 100%;
      background: ${darkMode ? '#1a1a1a' : '#f5f5f5'};
    }
    ${darkMode ? `
    /* Dark mode styles */
    .leaflet-container {
      background: #1a1a1a !important;
    }
    .leaflet-tile-container img {
      filter: brightness(0.6) invert(1) hue-rotate(180deg) contrast(0.8);
    }
    .leaflet-control-zoom a {
      background-color: #2d2d2d !important;
      color: #ffffff !important;
      border: 1px solid #444 !important;
    }
    .leaflet-control-zoom a:hover {
      background-color: #3d3d3d !important;
    }
    .leaflet-control-attribution {
      background-color: rgba(0, 0, 0, 0.7) !important;
      color: #ccc !important;
    }
    ` : ''}
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
     integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
     crossorigin=""></script>
  <script>
    // Initialize map
    var map = L.map('map', {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      dragging: true,
      touchZoom: true
    }).setView([${latitude}, ${longitude}], ${zoom});

    // Add tile layer - using CartoDB dark matter for dark mode, or OpenStreetMap for light
    ${darkMode 
      ? `L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19
        }).addTo(map);`
      : `L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(map);`
    }

    // Handle map events
    map.on('moveend', function() {
      var center = map.getCenter();
      var zoom = map.getZoom();
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'mapMove',
          latitude: center.lat,
          longitude: center.lng,
          zoom: zoom
        }));
      }
    });

    // Ready
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'mapReady'
      }));
    }
  </script>
</body>
</html>
  `;
}

export function MapViewComponent({
  initialRegion = DEFAULT_REGION,
  checkpoints = [],
  onMarkerClick,
  showsUserLocation = true,
  showsMyLocationButton = true,
  showsCompass = true,
  showsScale = true,
  showsBuildings = true,
  showsTraffic = false,
  mapType = 'standard',
  pitchEnabled = true,
  rotateEnabled = true,
  scrollEnabled = true,
  zoomEnabled = true,
  zoomControlEnabled = true,
}: MapViewComponentProps) {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const webViewRef = useRef<any>(null);

  // Less zoom by default (was 13, now 10 for wider view)
  const zoom = Math.max(10, Math.round(13 - Math.log2(initialRegion.latitudeDelta)) - 3);
  const darkMode = true; // Always use dark mode

  // For web, use Leaflet directly
  if (Platform.OS === 'web') {
    useEffect(() => {
      // Load Leaflet CSS and JS dynamically
      if (typeof document !== 'undefined') {
        // Load Leaflet CSS
        if (!document.querySelector('link[href*="leaflet"]')) {
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
          cssLink.crossOrigin = '';
          document.head.appendChild(cssLink);
        }

        // Load Leaflet JS
        if (!document.querySelector('script[src*="leaflet"]')) {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
          script.crossOrigin = '';
          script.onload = () => setLeafletLoaded(true);
          document.head.appendChild(script);
        } else {
          setLeafletLoaded(true);
        }
      }
    }, []);

    useEffect(() => {
      if (leafletLoaded && typeof window !== 'undefined' && (window as any).L) {
        const L = (window as any).L;
        const mapId = 'leaflet-map-' + Date.now();
        
        // Create map container
        const container = document.getElementById('leaflet-map-container');
        if (container) {
          container.innerHTML = `<div id="${mapId}" style="width: 100%; height: 100%;"></div>`;
          
          const map = L.map(mapId, {
            zoomControl: true,
            attributionControl: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
          }).setView([initialRegion.latitude, initialRegion.longitude], Math.max(10, zoom));
          
          // Use CartoDB dark matter for dark mode
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19,
          }).addTo(map);

          // Dark mode styles
          const style = document.createElement('style');
          style.textContent = `
            .leaflet-container {
              background: #1a1a1a !important;
            }
            .leaflet-control-zoom a {
              background-color: #2d2d2d !important;
              color: #ffffff !important;
              border: 1px solid #444 !important;
            }
            .leaflet-control-zoom a:hover {
              background-color: #3d3d3d !important;
            }
            .leaflet-control-attribution {
              background-color: rgba(0, 0, 0, 0.7) !important;
              color: #ccc !important;
            }
          `;
          document.head.appendChild(style);

          setIsLoading(false);
        }
      }
    }, [leafletLoaded, initialRegion, zoom]);

    // For web, we need to use HTML elements
    const LeafletContainer = Platform.OS === 'web' && typeof window !== 'undefined' 
      ? ({ children, ...props }: any) => {
          const React = require('react');
          return React.createElement('div', { id: 'leaflet-map-container', style: { width: '100%', height: '100%' }, ...props }, children);
        }
      : View;

    return (
      <View style={styles.container}>
        <LeafletContainer />
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FF6B35" />
          </View>
        )}
      </View>
    );
  }

  // For iOS/Android, use WebView with Leaflet
  if (!WebView) {
    return (
      <View style={[styles.container, styles.placeholder]}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.placeholderText}>
          Installing WebView library...{'\n'}
          Please run: npm install react-native-webview
        </Text>
      </View>
    );
  }

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapReady') {
        setIsLoading(false);
      }
    } catch (e) {
      // Ignore parse errors
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: generateLeafletHTML(initialRegion.latitude, initialRegion.longitude, zoom, darkMode) }}
        style={styles.map}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        bounces={false}
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF6B35" />
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
  },
  map: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a3a5c',
  },
  placeholderText: {
    color: '#FFFFFF',
    marginTop: 16,
    textAlign: 'center',
    fontSize: 14,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 58, 92, 0.3)',
  },
});
