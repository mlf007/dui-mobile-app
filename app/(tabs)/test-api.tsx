import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useCheckpoint, useCheckpoints } from '@/hooks/use-checkpoints';
import { getCheckpointById, getCheckpoints } from '@/lib/api';
import { useState } from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

export default function TestApiScreen() {
  const [stateFilter, setStateFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [checkpointId, setCheckpointId] = useState('');
  const [upcomingOnly, setUpcomingOnly] = useState(false);

  // Using the hook for automatic fetching
  const { checkpoints, loading, error, refetch } = useCheckpoints(
    {
      state: stateFilter || undefined,
      city: cityFilter || undefined,
      upcoming: upcomingOnly,
    },
    false // Don't auto-fetch, we'll trigger manually
  );

  // For testing single checkpoint
  const { checkpoint, loading: loadingSingle, error: errorSingle, refetch: refetchSingle } = useCheckpoint(
    checkpointId ? parseInt(checkpointId) : null,
    false
  );

  const handleTestGetAll = async () => {
    const result = await getCheckpoints();
    if ('error' in result) {
      Alert.alert('Error', result.error);
    } else {
      Alert.alert('Success', `Found ${result.count} checkpoints`);
      refetch();
    }
  };

  const handleTestGetFiltered = async () => {
    const filters: any = {};
    if (stateFilter) filters.state = stateFilter;
    if (cityFilter) filters.city = cityFilter;
    if (upcomingOnly) filters.upcoming = true;

    const result = await getCheckpoints(filters);
    if ('error' in result) {
      Alert.alert('Error', result.error);
    } else {
      Alert.alert('Success', `Found ${result.count} checkpoints`);
      refetch();
    }
  };

  const handleTestGetById = async () => {
    if (!checkpointId) {
      Alert.alert('Error', 'Please enter a checkpoint ID');
      return;
    }

    const result = await getCheckpointById(parseInt(checkpointId));
    if ('error' in result) {
      Alert.alert('Error', result.error);
    } else {
      Alert.alert('Success', `Found checkpoint: ${result.checkpoint.City}, ${result.checkpoint.State}`);
      refetchSingle();
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={null}>
      <ThemedView style={styles.section}>
        <ThemedText type="title" style={styles.title}>
          Supabase API Test
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Test your Supabase connection and API functions
        </ThemedText>
      </ThemedView>

      {/* Test Get All Checkpoints */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Test: Get All Checkpoints
        </ThemedText>
        <TouchableOpacity style={styles.button} onPress={handleTestGetAll}>
          <ThemedText style={styles.buttonText}>Get All Checkpoints</ThemedText>
        </TouchableOpacity>
        {loading && <ThemedText style={styles.status}>Loading...</ThemedText>}
        {error && <ThemedText style={styles.error}>Error: {error}</ThemedText>}
        {checkpoints.length > 0 && (
          <ThemedView style={styles.results}>
            <ThemedText style={styles.resultTitle}>
              Found {checkpoints.length} checkpoint(s):
            </ThemedText>
            {checkpoints.slice(0, 5).map((cp) => (
              <ThemedView key={cp.id} style={styles.checkpointItem}>
                <ThemedText style={styles.checkpointText}>
                  ID: {cp.id} | {cp.City}, {cp.State}
                </ThemedText>
                <ThemedText style={styles.checkpointDate}>Date: {cp.Date}</ThemedText>
              </ThemedView>
            ))}
            {checkpoints.length > 5 && (
              <ThemedText style={styles.moreText}>
                ... and {checkpoints.length - 5} more
              </ThemedText>
            )}
          </ThemedView>
        )}
      </ThemedView>

      {/* Test Filtered Checkpoints */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Test: Filtered Checkpoints
        </ThemedText>
        <TextInput
          style={styles.input}
          placeholder="State (e.g., CA)"
          placeholderTextColor="#999"
          value={stateFilter}
          onChangeText={setStateFilter}
        />
        <TextInput
          style={styles.input}
          placeholder="City (e.g., Los Angeles)"
          placeholderTextColor="#999"
          value={cityFilter}
          onChangeText={setCityFilter}
        />
        <TouchableOpacity
          style={[styles.checkbox, upcomingOnly && styles.checkboxActive]}
          onPress={() => setUpcomingOnly(!upcomingOnly)}
        >
          <ThemedText style={styles.checkboxText}>
            {upcomingOnly ? '✓' : '○'} Upcoming only
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleTestGetFiltered}>
          <ThemedText style={styles.buttonText}>Get Filtered Checkpoints</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Test Get By ID */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Test: Get Checkpoint By ID
        </ThemedText>
        <TextInput
          style={styles.input}
          placeholder="Checkpoint ID (e.g., 1)"
          placeholderTextColor="#999"
          value={checkpointId}
          onChangeText={setCheckpointId}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.button} onPress={handleTestGetById}>
          <ThemedText style={styles.buttonText}>Get Checkpoint</ThemedText>
        </TouchableOpacity>
        {loadingSingle && <ThemedText style={styles.status}>Loading...</ThemedText>}
        {errorSingle && <ThemedText style={styles.error}>Error: {errorSingle}</ThemedText>}
        {checkpoint && (
          <ThemedView style={styles.results}>
            <ThemedText style={styles.resultTitle}>Checkpoint Details:</ThemedText>
            <ThemedView style={styles.checkpointItem}>
              <ThemedText style={styles.checkpointText}>
                ID: {checkpoint.id}
              </ThemedText>
              <ThemedText style={styles.checkpointText}>
                {checkpoint.City}, {checkpoint.State}
              </ThemedText>
              <ThemedText style={styles.checkpointText}>
                County: {checkpoint.County}
              </ThemedText>
              <ThemedText style={styles.checkpointDate}>Date: {checkpoint.Date}</ThemedText>
              {checkpoint.Location && (
                <ThemedText style={styles.checkpointText}>
                  Location: {checkpoint.Location}
                </ThemedText>
              )}
              {checkpoint.Time && (
                <ThemedText style={styles.checkpointText}>Time: {checkpoint.Time}</ThemedText>
              )}
              {checkpoint.Notes && (
                <ThemedText style={styles.checkpointText}>Notes: {checkpoint.Notes}</ThemedText>
              )}
            </ThemedView>
          </ThemedView>
        )}
      </ThemedView>

      {/* Connection Status */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Connection Status
        </ThemedText>
        <ThemedText style={styles.infoText}>
          Make sure you have set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in
          your .env file
        </ThemedText>
        <ThemedText style={styles.infoText}>
          Check the console for any connection errors
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 16,
    marginBottom: 8,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.7,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#000',
  },
  checkbox: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 12,
  },
  checkboxActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  checkboxText: {
    fontSize: 16,
  },
  status: {
    marginTop: 8,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  error: {
    marginTop: 8,
    color: '#ff3b30',
  },
  results: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  resultTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  checkpointItem: {
    padding: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  checkpointText: {
    marginBottom: 4,
  },
  checkpointDate: {
    fontWeight: '600',
    marginTop: 4,
  },
  moreText: {
    fontStyle: 'italic',
    opacity: 0.7,
    marginTop: 8,
  },
  infoText: {
    opacity: 0.7,
    marginBottom: 4,
    fontSize: 12,
  },
});

