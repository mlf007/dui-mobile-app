import type { Checkpoint } from '@/lib/types/checkpoint';
import { formatDate, getMarkerColor, isPast, isToday, isUpcoming } from '@/lib/utils/checkpoint-utils';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CheckpointListProps {
  checkpoints: Checkpoint[];
  loading: boolean;
  searchQuery: string;
  activeTab: 'upcoming' | 'past';
  onSearchChange: (query: string) => void;
  onCheckpointSelect: (checkpoint: Checkpoint) => void;
  selectedCheckpoint: Checkpoint | null;
}

export function CheckpointList({
  checkpoints,
  loading,
  searchQuery,
  activeTab,
  onSearchChange,
  onCheckpointSelect,
  selectedCheckpoint,
}: CheckpointListProps) {
  // Filter checkpoints based on active tab and search query
  const filteredCheckpoints = checkpoints.filter((cp) => {
    // Filter by tab (upcoming or past)
    if (activeTab === 'upcoming' && !isUpcoming(cp.Date)) {
      return false;
    }
    if (activeTab === 'past' && !isPast(cp.Date)) {
      return false;
    }
    
    // Filter by search query
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      cp.City?.toLowerCase().includes(query) ||
      cp.County?.toLowerCase().includes(query) ||
      cp.Location?.toLowerCase().includes(query) ||
      cp.State?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading checkpoints...</Text>
      </View>
    );
  }

  const renderCheckpointItem = ({ item: checkpoint }: { item: Checkpoint }) => {
    const markerColor = getMarkerColor(checkpoint);
    const isSelected = selectedCheckpoint?.id === checkpoint.id;
    const isTodayCheckpoint = isToday(checkpoint.Date);
    const isUpcomingCheckpoint = isUpcoming(checkpoint.Date);
    
    // Red for upcoming, Blue for past (police colors)
    const indicatorColor = isUpcomingCheckpoint ? '#FF3B30' : '#007AFF';

    return (
      <TouchableOpacity
        style={[
          styles.checkpointItem,
          isSelected && styles.checkpointItemSelected,
        ]}
        onPress={() => onCheckpointSelect(checkpoint)}
        activeOpacity={0.7}>
        {/* Color indicator - Red for upcoming, Blue for past */}
        <View
          style={[
            styles.colorIndicator,
            { backgroundColor: indicatorColor },
          ]}
        />

        {/* Content */}
        <View style={styles.checkpointContent}>
          <View style={styles.checkpointHeader}>
            <Text style={styles.checkpointCity}>
              {checkpoint.City || 'Unknown City'}
            </Text>
            {isTodayCheckpoint && (
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>TODAY</Text>
              </View>
            )}
          </View>

          <Text style={styles.checkpointCounty}>
            {checkpoint.County || 'Unknown County'}, {checkpoint.State || 'N/A'}
          </Text>

          {checkpoint.Location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text style={styles.checkpointLocation}>{checkpoint.Location}</Text>
            </View>
          )}

          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeItem}>
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text style={styles.checkpointDate}>{formatDate(checkpoint.Date)}</Text>
            </View>
            {checkpoint.Time && (
              <View style={styles.dateTimeItem}>
                <Ionicons name="time-outline" size={14} color="#6B7280" />
                <Text style={styles.checkpointTime}>{checkpoint.Time}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Arrow */}
        <Ionicons name="chevron-forward" size={20} color="#9BA1A6" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading checkpoints...</Text>
      </View>
    );
  }

  if (filteredCheckpoints.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#9BA1A6" />
        <Text style={styles.emptyText}>No checkpoints found</Text>
        <Text style={styles.emptySubtext}>Try adjusting your search or tab</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredCheckpoints}
      renderItem={renderCheckpointItem}
      keyExtractor={(item) => item.id.toString()}
      style={styles.container}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={true}
      scrollEnabled={true}
      bounces={true}
      removeClippedSubviews={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingVertical: 8,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
  },
  checkpointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkpointItemSelected: {
    borderColor: '#FF6B35',
    borderWidth: 2,
    backgroundColor: '#FFF5F2',
  },
  colorIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
    minHeight: 60,
  },
  checkpointContent: {
    flex: 1,
  },
  checkpointHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkpointCity: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  todayBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  checkpointCounty: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  checkpointLocation: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
    flex: 1,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkpointDate: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  checkpointTime: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
});

