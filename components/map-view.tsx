import type { Checkpoint } from '@/lib/types/checkpoint';
import { isUpcoming } from '@/lib/utils/checkpoint-utils';
import Constants from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

type Region = {
  latitude: number;
  longitude: number;
};

// California center (Los Angeles area)
const CALIFORNIA_CENTER: Region = {
  latitude: 34.0522,
  longitude: -118.2437,
};

const INITIAL_ZOOM = 6; // Show California state level
const MIN_ZOOM = 3; // Slightly zoomed in on US/California
const MAX_ZOOM = 22;
const PITCH = 50; // Max 3D pitch (used only when zoomed in)
const BEARING = 0; // North up
const STYLE_URL = 'mapbox://styles/mapbox/dark-v11';

interface MapViewComponentProps {
  checkpoints?: Checkpoint[];
}

function getMapboxApiKey(): string {
  return (
    Constants.expoConfig?.extra?.mapboxApiKey ||
    process.env.EXPO_PUBLIC_MAPBOX_API_KEY ||
    ''
  );
}

// Cache for geocoded coordinates to avoid repeated API calls
const geocodeCache: Record<string, { lat: number; lng: number }> = {};

// Helper function to geocode location using Mapbox Geocoding API
async function geocodeCity(city: string, state: string, apiKey: string): Promise<{ lat: number; lng: number } | null> {
  const cacheKey = `${city}, ${state}`.toLowerCase();
  
  // Check cache first
  if (geocodeCache[cacheKey]) {
    return geocodeCache[cacheKey];
  }

  try {
    // Build query string
    const query = encodeURIComponent(`${city}, ${state}, USA`);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${apiKey}&limit=1`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      const coords = { lat, lng };
      
      // Cache the result
      geocodeCache[cacheKey] = coords;
      return coords;
    }
  } catch (error) {
    console.warn('Geocoding error for', city, state, error);
  }

  return null;
}

// Helper function to get coordinates (synchronous version for mobile HTML)
function getCoordinatesSync(checkpoint: Checkpoint, apiKey?: string): { lat: number; lng: number } | null {
  // If coordinates are already available, use them
  if (checkpoint.Latitude && checkpoint.Longitude) {
    return { lat: checkpoint.Latitude, lng: checkpoint.Longitude };
  }

  // For mobile HTML, we'll geocode on the client side using Mapbox
  // Return a placeholder that will be geocoded in JavaScript
  return null; // Will be geocoded in the HTML/JS
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

export function MapViewComponent({ checkpoints = [] }: MapViewComponentProps) {
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
    return <WebMap apiKey={apiKey} checkpoints={checkpoints} />;
  }

  if (!NativeWebView) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.message}>WebView not available.</Text>
      </View>
    );
  }

  const html = generateMobileHTML(apiKey, checkpoints);

  return (
    <View style={styles.container}>
      <NativeWebView
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://api.mapbox.com' }}
        style={StyleSheet.absoluteFill}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        mixedContentMode="always"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        onError={(e: any) => {
          console.error('WebView Mapbox error', e?.nativeEvent);
        }}
        onLoadEnd={() => {
          console.log('Map WebView loaded successfully');
        }}
        onLoadStart={() => {
          console.log('Map WebView loading...');
        }}
      />
    </View>
  );
}

function WebMap({ apiKey, checkpoints = [] }: { apiKey: string; checkpoints?: Checkpoint[] }) {
  const containerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let map: any = null;
    let cancelled = false;
    const markers: any[] = [];

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
          center: [CALIFORNIA_CENTER.longitude, CALIFORNIA_CENTER.latitude],
          zoom: INITIAL_ZOOM,
          minZoom: MIN_ZOOM,
          maxZoom: MAX_ZOOM,
          pitch: 0, // keep map flat so markers don't visually drift
          bearing: BEARING,
          antialias: true,
          projection: 'mercator', // disable globe-style 3D projection
        });

        map.on('load', () => {
          if (cancelled) return;

          // We keep the default 2D style; no 3D building extrusion layer

          // Add markers for checkpoints with pole-style design
          // Geocode all checkpoints asynchronously
          console.log('Adding markers for', checkpoints.length, 'checkpoints');
          
          Promise.all(
            checkpoints.map(async (checkpoint) => {
              // Check if coordinates exist in database
              let coords: { lat: number; lng: number } | null = null;
              
              if (checkpoint.Latitude && checkpoint.Longitude) {
                coords = { lat: checkpoint.Latitude, lng: checkpoint.Longitude };
                console.log('Using database coordinates for', checkpoint.City);
              } else if (checkpoint.City && checkpoint.State) {
                // Geocode using Mapbox API
                console.log('Geocoding', checkpoint.City, checkpoint.State);
                coords = await geocodeCity(checkpoint.City, checkpoint.State, apiKey);
                if (coords) {
                  console.log('Geocoded successfully:', coords);
                } else {
                  console.warn('Failed to geocode', checkpoint.City, checkpoint.State);
                }
              } else {
                console.warn('No city/state or coordinates for checkpoint', checkpoint.id);
              }
              
              if (!coords) return null;
              
              const isUpcomingCheckpoint = isUpcoming(checkpoint.Date);
              // Red for upcoming, Blue for past (police colors)
              const markerColor = isUpcomingCheckpoint ? '#FF3B30' : '#007AFF';
              
              // Use default Mapbox marker (simple pin)
              const el = document.createElement('div');
              el.style.width = '30px';
              el.style.height = '30px';
              el.style.borderRadius = '50% 50% 50% 0';
              el.style.transform = 'rotate(-45deg)';
              el.style.backgroundColor = markerColor;
              el.style.border = '3px solid #FFFFFF';
              el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
              el.style.cursor = 'pointer';
              
              // Inner dot
              const innerDot = document.createElement('div');
              innerDot.style.width = '12px';
              innerDot.style.height = '12px';
              innerDot.style.borderRadius = '50%';
              innerDot.style.backgroundColor = '#FFFFFF';
              innerDot.style.position = 'absolute';
              innerDot.style.top = '50%';
              innerDot.style.left = '50%';
              innerDot.style.transform = 'translate(-50%, -50%) rotate(45deg)';
              el.appendChild(innerDot);

              // Create popup
              const popup = new mapboxgl.Popup({ offset: 25, closeButton: true })
                .setHTML(`
                  <div style="padding: 8px; min-width: 200px;">
                    <strong style="font-size: 14px; color: #1F2937;">${checkpoint.City || 'Unknown'}</strong>
                    <div style="font-size: 12px; color: #6B7280; margin-top: 4px;">
                      ${checkpoint.County || ''}, ${checkpoint.State || ''}
                    </div>
                    ${checkpoint.Location ? `<div style="font-size: 11px; color: #9CA3AF; margin-top: 4px;">📍 ${checkpoint.Location}</div>` : ''}
                    ${checkpoint.Date ? `<div style="font-size: 11px; color: #9CA3AF; margin-top: 2px;">📅 ${checkpoint.Date}</div>` : ''}
                    ${checkpoint.Time ? `<div style="font-size: 11px; color: #9CA3AF; margin-top: 2px;">🕐 ${checkpoint.Time}</div>` : ''}
                  </div>
                `);

              // Create marker with fixed position (no draggable)
              const marker = new mapboxgl.Marker({
                element: el,
                anchor: 'bottom', // Pin point at bottom
                offset: [0, 0], // No offset
              })
                .setLngLat([coords.lng, coords.lat])
                .setPopup(popup)
                .addTo(map);

              return marker;
            })
          ).then((geocodedMarkers) => {
            // Filter out null results and add to markers array
            const validMarkers = geocodedMarkers.filter(m => m !== null);
            console.log('Successfully added', validMarkers.length, 'markers');
            
            validMarkers.forEach((marker) => {
              if (marker) {
                markers.push(marker);
              }
            });
            
            // Fit map to show all markers if we have any
            if (validMarkers.length > 0 && map) {
              const bounds = new mapboxgl.LngLatBounds();
              validMarkers.forEach((marker: any) => {
                const lngLat = marker.getLngLat();
                bounds.extend([lngLat.lng, lngLat.lat]);
              });
              
              // Only fit bounds if we have multiple markers, otherwise just center on the marker
              if (validMarkers.length > 1) {
                map.fitBounds(bounds, {
                  padding: 50,
                  maxZoom: 12,
                });
              } else if (validMarkers.length === 1) {
                const lngLat = validMarkers[0].getLngLat();
                map.flyTo({
                  center: [lngLat.lng, lngLat.lat],
                  zoom: 12,
                });
              }
            }
          }).catch((error) => {
            console.error('Error geocoding checkpoints:', error);
          });

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
      markers.forEach(marker => marker.remove());
      if (map) {
        map.remove();
      }
    };
  }, [apiKey, checkpoints]);

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

function generateMobileHTML(apiKey: string, checkpoints: Checkpoint[] = []): string {
  // Prepare checkpoints data for geocoding on client side
  const checkpointsData = checkpoints.map((checkpoint) => {
    const isUpcomingCheckpoint = isUpcoming(checkpoint.Date);
    const markerColor = isUpcomingCheckpoint ? '#FF3B30' : '#007AFF';
    
    return {
      id: checkpoint.id,
      lat: checkpoint.Latitude || null,
      lng: checkpoint.Longitude || null,
      color: markerColor,
      city: checkpoint.City || 'Unknown',
      county: checkpoint.County || '',
      state: checkpoint.State || '',
      location: checkpoint.Location || '',
      date: checkpoint.Date || '',
      time: checkpoint.Time || '',
    };
  });

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
      /* Default pin marker styles */
      .checkpoint-marker {
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid #FFFFFF;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        position: relative;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      (function () {
        var markers = [];
        
        function init() {
          if (!window.mapboxgl) return;

          mapboxgl.accessToken = '${apiKey}';

          var map = new mapboxgl.Map({
            container: 'map',
            style: '${STYLE_URL}',
            center: [${CALIFORNIA_CENTER.longitude}, ${CALIFORNIA_CENTER.latitude}],
            zoom: ${INITIAL_ZOOM},
            minZoom: ${MIN_ZOOM},
            maxZoom: ${MAX_ZOOM},
            pitch: 0, // keep map flat so markers don't visually drift
            bearing: ${BEARING},
            antialias: true,
            projection: 'mercator' // disable globe-style 3D projection
          });

          map.on('load', function () {
            // We keep the default 2D style; no 3D building extrusion layer

            // Geocode and add markers for checkpoints
            var checkpointsData = ${JSON.stringify(checkpointsData)};
            var geocodeCache = {};
            
            // Function to geocode a city
            function geocodeCity(city, state, callback) {
              var cacheKey = (city + ', ' + state).toLowerCase();
              if (geocodeCache[cacheKey]) {
                callback(geocodeCache[cacheKey]);
                return;
              }
              
              var query = encodeURIComponent(city + ', ' + state + ', USA');
              var url = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + query + '.json?access_token=${apiKey}&limit=1';
              
              fetch(url)
                .then(function(response) { return response.json(); })
                .then(function(data) {
                  if (data.features && data.features.length > 0) {
                    var coords = {
                      lng: data.features[0].center[0],
                      lat: data.features[0].center[1]
                    };
                    geocodeCache[cacheKey] = coords;
                    callback(coords);
                  } else {
                    callback(null);
                  }
                })
                .catch(function(error) {
                  console.warn('Geocoding error:', error);
                  callback(null);
                });
            }
            
            // Function to create marker (default pin style)
            function createMarker(markerData, coords) {
              if (!coords) return;
              
              // Use default Mapbox marker (simple pin)
              var el = document.createElement('div');
              el.style.width = '30px';
              el.style.height = '30px';
              el.style.borderRadius = '50% 50% 50% 0';
              el.style.transform = 'rotate(-45deg)';
              el.style.backgroundColor = markerData.color;
              el.style.border = '3px solid #FFFFFF';
              el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
              el.style.cursor = 'pointer';
              el.style.position = 'relative';
              
              // Inner dot
              var innerDot = document.createElement('div');
              innerDot.style.width = '12px';
              innerDot.style.height = '12px';
              innerDot.style.borderRadius = '50%';
              innerDot.style.backgroundColor = '#FFFFFF';
              innerDot.style.position = 'absolute';
              innerDot.style.top = '50%';
              innerDot.style.left = '50%';
              innerDot.style.transform = 'translate(-50%, -50%) rotate(45deg)';
              el.appendChild(innerDot);

              var popupHtml = '<div style="padding: 8px; min-width: 200px;">' +
                '<strong style="font-size: 14px; color: #1F2937;">' + markerData.city + '</strong>' +
                '<div style="font-size: 12px; color: #6B7280; margin-top: 4px;">' + 
                  markerData.county + ', ' + markerData.state + 
                '</div>';
              
              if (markerData.location) {
                popupHtml += '<div style="font-size: 11px; color: #9CA3AF; margin-top: 4px;">📍 ' + markerData.location + '</div>';
              }
              if (markerData.date) {
                popupHtml += '<div style="font-size: 11px; color: #9CA3AF; margin-top: 2px;">📅 ' + markerData.date + '</div>';
              }
              if (markerData.time) {
                popupHtml += '<div style="font-size: 11px; color: #9CA3AF; margin-top: 2px;">🕐 ' + markerData.time + '</div>';
              }
              
              popupHtml += '</div>';

              var popup = new mapboxgl.Popup({ offset: 25, closeButton: true })
                .setHTML(popupHtml);

              // Create marker with fixed position (no draggable)
              var marker = new mapboxgl.Marker({
                element: el,
                anchor: 'bottom', // Pin point at bottom
                offset: [0, 0], // No offset
              })
                .setLngLat([coords.lng, coords.lat])
                .setPopup(popup)
                .addTo(map);

              markers.push(marker);
            }
            
            // Process all checkpoints
            console.log('Processing', checkpointsData.length, 'checkpoints for mobile');
            var processedCount = 0;
            var totalToProcess = checkpointsData.length;
            
            function checkAndFitBounds() {
              processedCount++;
              if (processedCount === totalToProcess && markers.length > 0) {
                // Fit map to show all markers
                var bounds = new mapboxgl.LngLatBounds();
                markers.forEach(function(marker) {
                  var lngLat = marker.getLngLat();
                  bounds.extend([lngLat.lng, lngLat.lat]);
                });
                
                if (markers.length > 1) {
                  map.fitBounds(bounds, {
                    padding: 50,
                    maxZoom: 12
                  });
                } else if (markers.length === 1) {
                  var lngLat = markers[0].getLngLat();
                  map.flyTo({
                    center: [lngLat.lng, lngLat.lat],
                    zoom: 12
                  });
                }
                console.log('Map fitted to show', markers.length, 'markers');
              }
            }
            
            checkpointsData.forEach(function(checkpointData) {
              // If coordinates exist, use them directly
              if (checkpointData.lat && checkpointData.lng) {
                console.log('Using coordinates for', checkpointData.city);
                createMarker(checkpointData, { lat: checkpointData.lat, lng: checkpointData.lng });
                checkAndFitBounds();
              } else if (checkpointData.city && checkpointData.state) {
                // Geocode the city
                console.log('Geocoding', checkpointData.city, checkpointData.state);
                geocodeCity(checkpointData.city, checkpointData.state, function(coords) {
                  if (coords) {
                    console.log('Geocoded successfully:', coords);
                    createMarker(checkpointData, coords);
                  } else {
                    console.warn('Failed to geocode', checkpointData.city);
                  }
                  checkAndFitBounds();
                });
              } else {
                console.warn('No coordinates or city/state for checkpoint', checkpointData.id);
                checkAndFitBounds();
              }
            });
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
