import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Checkpoint } from '@/lib/types/checkpoint';
import Constants from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

// For mobile, we'll use @rnmapbox/maps
let Mapbox: any = null;
let MapView: any = null;
let PointAnnotation: any = null;
let Camera: any = null;
let setAccessToken: any = null;

if (Platform.OS !== 'web') {
  try {
    const mapbox = require('@rnmapbox/maps');
    Mapbox = mapbox;
    MapView = mapbox.MapView;
    PointAnnotation = mapbox.PointAnnotation;
    Camera = mapbox.Camera;
    setAccessToken = mapbox.setAccessToken;
  } catch (error) {
    console.log('@rnmapbox/maps not available');
  }
}

// For mobile, we'll use WebView to render Mapbox GL JS
let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').WebView;
  } catch (error) {
    console.log('react-native-webview not available');
  }
}

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

// California, USA default location
const DEFAULT_REGION = {
  latitude: 36.7783,
  longitude: -119.4179,
  latitudeDelta: 5.0,
  longitudeDelta: 5.0,
};

// Get Mapbox API key from environment
function getMapboxApiKey(): string {
  return (
    Constants.expoConfig?.extra?.mapboxApiKey ||
    process.env.EXPO_PUBLIC_MAPBOX_API_KEY ||
    ''
  );
}

// Generate Mapbox GL JS HTML for WebView (mobile) and web
function generateMapboxHTML(
  latitude: number,
  longitude: number,
  zoom: number,
  checkpoints: Checkpoint[] = [],
  onMarkerClick?: (checkpoint: Checkpoint) => void,
  darkMode: boolean = true,
  apiKey: string = ''
): string {
  const checkpointsJson = JSON.stringify(checkpoints);
  // Use HTTPS URLs for Android compatibility instead of mapbox:// protocol
  const mapboxStyle = darkMode
    ? 'https://api.mapbox.com/styles/v1/mapbox/dark-v11'
    : 'https://api.mapbox.com/styles/v1/mapbox/light-v11';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link href="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css" rel="stylesheet" />
  <script src="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js"></script>
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
    }
    .mapboxgl-popup-content {
      padding: 12px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .mapboxgl-popup-content h3 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
    }
    .mapboxgl-popup-content p {
      margin: 4px 0;
      font-size: 14px;
      color: #666;
    }
    .dui-marker {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #FF3B30;
      border: 3px solid #FFFFFF;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: white;
      font-size: 18px;
      position: relative;
    }
    .dui-marker::before {
      content: '⚠';
    }
    .dui-marker.today {
      background-color: #FF6B35;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    // Wait for Mapbox GL JS to load
    (function() {
      function initMap() {
        if (!window.mapboxgl) {
          console.error('Mapbox GL JS not available');
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'mapError',
              error: 'Mapbox GL JS failed to load'
            }));
          }
          return;
        }
        
        try {
          mapboxgl.accessToken = '${apiKey}';
    
    const map = new mapboxgl.Map({
      container: 'map',
      style: '${mapboxStyle}',
      center: [${longitude}, ${latitude}],
      zoom: ${zoom},
      pitch: 60,
      bearing: -17.6,
      antialias: true,
      transformRequest: function(url, resourceType) {
        // Ensure all requests include the access token for Android
        if (resourceType === 'Style' && !url.includes('access_token')) {
          return {
            url: url + (url.includes('?') ? '&' : '?') + 'access_token=' + mapboxgl.accessToken
          };
        }
        return { url: url };
      }
    });
    
    // Enable 3D terrain and buildings
    map.on('load', function() {
      try {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'https://api.mapbox.com/v4/mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14
        });
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
      } catch (e) {
        console.log('Terrain not available:', e);
      }
    });

    const checkpoints = ${checkpointsJson};
    
    function parseLocalDate(dateString) {
      if (!dateString) return null;
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    
    function isToday(dateString) {
      if (!dateString) return false;
      const checkpointDate = parseLocalDate(dateString);
      const today = new Date();
      return checkpointDate.toDateString() === today.toDateString();
    }
    
    function isUpcoming(dateString) {
      if (!dateString) return false;
      const checkpointDate = parseLocalDate(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      checkpointDate.setHours(0, 0, 0, 0);
      return checkpointDate >= today;
    }

    // Default center (California)
    const DEFAULT_CENTER = [${longitude}, ${latitude}];
    
    // Geocode location
    async function geocodeLocation(locationName, state) {
      try {
        const query = \`\${locationName}, \${state}, USA\`;
        const url = \`https://api.mapbox.com/geocoding/v5/mapbox.places/\${encodeURIComponent(query)}.json?access_token=\${mapboxgl.accessToken}&limit=1\`;
        const response = await fetch(url);
        if (!response.ok) return null;
        const data = await response.json();
        if (data && data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          return [lat, lng];
        }
        return null;
      } catch (error) {
        console.error('Geocoding error:', error);
        return null;
      }
    }

    // Create custom marker element
    function createMarkerElement(isToday) {
      const el = document.createElement('div');
      el.className = 'dui-marker' + (isToday ? ' today' : '');
      return el;
    }

    // Add markers for checkpoints
    async function addMarkers() {
      for (const checkpoint of checkpoints) {
        const isTodayCheckpoint = isToday(checkpoint.Date);
        const isUpcomingCheckpoint = isUpcoming(checkpoint.Date);
        
        // Try to geocode location
        let coords = DEFAULT_CENTER;
        if (checkpoint.City) {
          const state = checkpoint.State || 'California';
          const geocoded = await geocodeLocation(checkpoint.City, state);
          if (geocoded) coords = geocoded;
        }
        
        // Create marker
        const el = createMarkerElement(isTodayCheckpoint);
        const marker = new mapboxgl.Marker(el)
          .setLngLat([coords[1], coords[0]])
          .addTo(map);
        
        // Popup content
        const popupContent = \`
          <div>
            <h3>\${checkpoint.City || 'Unknown City'}</h3>
            <p><strong>County:</strong> \${checkpoint.County || 'N/A'}</p>
            <p><strong>State:</strong> \${checkpoint.State || 'N/A'}</p>
            <p><strong>Date:</strong> \${checkpoint.Date || 'Date TBD'}</p>
            \${checkpoint.Time ? \`<p><strong>Time:</strong> \${checkpoint.Time}</p>\` : ''}
            \${checkpoint.Location ? \`<p><strong>Location:</strong> \${checkpoint.Location}</p>\` : ''}
          </div>
        \`;
        
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(popupContent);
        
        marker.setPopup(popup);
        
        // Handle marker click
        marker.getElement().addEventListener('click', function() {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'markerClick',
              checkpointId: checkpoint.id
            }));
          }
        });
      }
    }

    // Wait for map to load
    map.on('load', function() {
      // Markers removed for now
      
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'mapReady'
        }));
      }
    });

    // Error handling
    map.on('error', function(e) {
      console.error('Mapbox error:', e);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'mapError',
          error: e.error ? e.error.message : 'Unknown error'
        }));
      }
    });

    // Fallback: if map doesn't load after 5 seconds, try to notify
    setTimeout(function() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'mapReady'
        }));
      }
    }, 5000);

    // Handle map events
    map.on('moveend', function() {
      const center = map.getCenter();
      const zoom = map.getZoom();
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'mapMove',
          latitude: center.lat,
          longitude: center.lng,
          zoom: zoom
        }));
      }
    });
        } catch (error) {
          console.error('Error initializing map:', error);
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'mapError',
              error: 'Error initializing map: ' + (error.message || error)
            }));
          }
        }
      }
      
      // Try to initialize immediately if script is already loaded
      if (window.mapboxgl) {
        initMap();
      } else {
        // Wait for script to load
        var checkInterval = setInterval(function() {
          if (window.mapboxgl) {
            clearInterval(checkInterval);
            initMap();
          }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(function() {
          clearInterval(checkInterval);
          if (!window.mapboxgl) {
            console.error('Mapbox GL JS failed to load within timeout');
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapError',
                error: 'Mapbox GL JS failed to load within timeout'
              }));
            }
          }
        }, 10000);
      }
    })();
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
  const [isLoading, setIsLoading] = useState(true);
  const [mapboxLoaded, setMapboxLoaded] = useState(false);
  const webViewRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const colorScheme = useColorScheme();
  const darkMode = colorScheme === 'dark';
  const apiKey = getMapboxApiKey();

  // Calculate zoom from latitudeDelta
  const zoom = Math.max(6, Math.round(13 - Math.log2(initialRegion.latitudeDelta)));

  // Initialize Mapbox access token for native
  useEffect(() => {
    if (Platform.OS !== 'web' && setAccessToken && apiKey) {
      setAccessToken(apiKey);
    }
  }, [apiKey]);

  // For web platform
  if (Platform.OS === 'web') {
    useEffect(() => {
      if (typeof window !== 'undefined' && apiKey) {
        // Load Mapbox GL JS dynamically
        if (!document.querySelector('script[src*="mapbox-gl"]')) {
          // Load CSS
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css';
          document.head.appendChild(cssLink);

          // Load JS
          const script = document.createElement('script');
          script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js';
          script.onload = () => {
            (window as any).mapboxgl.accessToken = apiKey;
            setMapboxLoaded(true);
          };
          document.head.appendChild(script);
        } else {
          if ((window as any).mapboxgl) {
            (window as any).mapboxgl.accessToken = apiKey;
            setMapboxLoaded(true);
          }
        }
      }
    }, [apiKey]);

    useEffect(() => {
      if (mapboxLoaded && typeof window !== 'undefined' && (window as any).mapboxgl && apiKey) {
        const mapboxgl = (window as any).mapboxgl;
        const mapId = 'mapbox-map-' + Date.now();
        
        const container = document.getElementById('mapbox-map-container');
        if (container) {
          container.innerHTML = `<div id="${mapId}" style="width: 100%; height: 100%;"></div>`;
          
          const mapStyle = darkMode
            ? 'https://api.mapbox.com/styles/v1/mapbox/dark-v11'
            : 'https://api.mapbox.com/styles/v1/mapbox/light-v11';
          
          const map = new mapboxgl.Map({
            container: mapId,
            style: mapStyle,
            center: [initialRegion.longitude, initialRegion.latitude],
            zoom: zoom,
            pitch: 60,
            bearing: -17.6,
          });

          mapRef.current = map;

          // Map loaded - markers removed for now
          map.on('load', () => {
            setIsLoading(false);
          });

          // Update style when dark mode changes
          const updateStyle = () => {
            const newStyle = darkMode
              ? 'https://api.mapbox.com/styles/v1/mapbox/dark-v11'
              : 'https://api.mapbox.com/styles/v1/mapbox/light-v11';
            map.setStyle(newStyle);
          };

          return () => {
            map.remove();
          };
        }
      }
    }, [mapboxLoaded, initialRegion, zoom, checkpoints, darkMode, apiKey, onMarkerClick]);

    const MapboxContainer = Platform.OS === 'web' && typeof window !== 'undefined'
      ? ({ children, ...props }: any) => {
          const React = require('react');
          return React.createElement('div', {
            id: 'mapbox-map-container',
            style: { width: '100%', height: '100%' },
            ...props
          }, children);
        }
      : View;

    return (
      <View style={styles.container}>
        <MapboxContainer />
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FF6B35" />
          </View>
        )}
      </View>
    );
  }

  // For iOS/Android, use WebView with Mapbox GL JS
  if (!WebView) {
    return (
      <View style={[styles.container, styles.placeholder]}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapReady') {
        setIsLoading(false);
      }
      if (data.type === 'mapError') {
        console.error('Mapbox error from WebView:', data.error);
        // Still hide loading after error
        setTimeout(() => setIsLoading(false), 1000);
      }
      if (data.type === 'markerClick' && onMarkerClick) {
        const checkpoint = checkpoints.find(cp => cp.id === data.checkpointId);
        if (checkpoint) {
          onMarkerClick(checkpoint);
        }
      }
    } catch (e) {
      // Ignore parse errors
      console.warn('Error parsing WebView message:', e);
    }
  };

  if (!apiKey) {
    return (
      <View style={[styles.container, styles.placeholder]}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{
          html: generateMapboxHTML(
            initialRegion.latitude,
            initialRegion.longitude,
            zoom,
            checkpoints,
            onMarkerClick,
            darkMode,
            apiKey
          ),
          baseUrl: Platform.OS === 'android' ? 'https://api.mapbox.com/' : 'https://api.mapbox.com',
        }}
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
        // Android-specific props
        mixedContentMode="always"
        originWhitelist={['*']}
        allowFileAccess={true}
        allowUniversalAccessFromFile={true}
        androidHardwareAccelerationDisabled={false}
        androidLayerType="hardware"
        // Error handling
        onError={(syntheticEvent: any) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error on Android:', nativeEvent);
        }}
        onHttpError={(syntheticEvent: any) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView HTTP error on Android:', nativeEvent);
        }}
        onLoadEnd={() => {
          // Additional check for Android
          if (Platform.OS === 'android') {
            setTimeout(() => {
              setIsLoading(false);
            }, 500);
          }
        }}
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
