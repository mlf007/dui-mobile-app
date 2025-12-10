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

    // Checkpoints data
    const checkpoints = ${checkpointsJson};
    
    // Helper functions
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
    
    function getMarkerColor(checkpoint) {
      return isUpcoming(checkpoint.Date) ? '#FF3B30' : '#007AFF';
    }
    
    // Create custom marker icon
    function createMarkerIcon(color, isToday) {
      const size = 34;
      return L.divIcon({
        className: 'custom-marker',
        html: \`
          <div style="
            width: \${size}px;
            height: \${size}px;
            position: relative;
          ">
            <svg viewBox="0 0 24 24" width="\${size}" height="\${size}" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));">
              <path fill="\${color}" stroke="white" stroke-width="1.5" d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8z"/>
              <circle cx="12" cy="8" r="3.5" fill="white"/>
            </svg>
            \${isToday ? '<div style="position: absolute; top: -5px; right: -5px; background: #FF6B35; color: white; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold;">!</div>' : ''}
          </div>
        \`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size + 5],
      });
    }
    
    // Geocode location
    async function geocodeLocation(locationName, state) {
      try {
        const query = \`\${locationName}, \${state}, USA\`;
        const url = \`https://nominatim.openstreetmap.org/search?q=\${encodeURIComponent(query)}&format=json&limit=1\`;
        const response = await fetch(url, {
          headers: { 'User-Agent': 'DUI-Checkpoint-Map/1.0' }
        });
        if (!response.ok) return null;
        const data = await response.json();
        if (data && data.length > 0) {
          return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }
        return null;
      } catch (error) {
        console.error('Geocoding error:', error);
        return null;
      }
    }
    
    // Default center (California)
    const DEFAULT_CENTER = [36.7783, -119.4179];
    const markersMap = new Map();
    
    // Add markers for checkpoints
    async function addMarkers() {
      for (const checkpoint of checkpoints) {
        const color = getMarkerColor(checkpoint);
        const isTodayCheckpoint = isToday(checkpoint.Date);
        
        // Try to geocode location
        let coords = DEFAULT_CENTER;
        if (checkpoint.City) {
          const state = checkpoint.State || 'California';
          const geocoded = await geocodeLocation(checkpoint.City, state);
          if (geocoded) coords = geocoded;
        }
        
        const icon = createMarkerIcon(color, isTodayCheckpoint);
        const marker = L.marker(coords, { icon }).addTo(map);
        
        // Popup content
        const popupContent = \`
          <div style="padding: 8px; min-width: 150px;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">
              \${checkpoint.City || 'Unknown City'}
            </div>
            <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
              \${checkpoint.County || ''}, \${checkpoint.State || ''}
            </div>
            <div style="font-size: 12px; color: #666;">
              \${checkpoint.Date || 'Date TBD'}
            </div>
          </div>
        \`;
        
        marker.bindPopup(popupContent);
        
        // Handle marker click
        marker.on('click', function() {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'markerClick',
              checkpointId: checkpoint.id
            }));
          }
        });
        
        markersMap.set(checkpoint.id, marker);
      }
    }
    
    // Add markers after map is ready
    addMarkers();
    
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
        source={{ html: generateLeafletHTML(initialRegion.latitude, initialRegion.longitude, zoom, checkpoints, onMarkerClick, darkMode) }}
        style={styles.map}
        onMessage={(event: any) => {
          handleMessage(event);
          // Handle marker clicks
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'markerClick' && onMarkerClick) {
              const checkpoint = checkpoints.find(cp => cp.id === data.checkpointId);
              if (checkpoint) {
                onMarkerClick(checkpoint);
              }
            }
          } catch (e) {
            // Ignore parse errors
          }
        }}
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
