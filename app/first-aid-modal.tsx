import { StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function FirstAidModalScreen() {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
        </View>

        <ThemedText type="title" style={styles.title}>
          DUI Health & Safety
        </ThemedText>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Immediate Health Concerns
          </ThemedText>
          <ThemedText style={styles.content}>
            If you or someone you know has been arrested for DUI, it's important to be aware of potential health concerns. Alcohol and substance use can have immediate and long-term effects on your physical and mental well-being.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Physical Health Considerations
          </ThemedText>
          <ThemedText style={styles.content}>
            • Monitor for signs of alcohol withdrawal
            • Stay hydrated and maintain proper nutrition
            • Get adequate rest and sleep
            • Be aware of any injuries sustained during arrest
            • Consult with a healthcare provider if needed
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Mental Health Support
          </ThemedText>
          <ThemedText style={styles.content}>
            A DUI arrest can be stressful and overwhelming. It's important to:
            • Seek emotional support from friends and family
            • Consider speaking with a mental health professional
            • Practice stress-reduction techniques
            • Stay informed about your legal situation
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Substance Abuse Resources
          </ThemedText>
          <ThemedText style={styles.content}>
            If you're struggling with substance use, there are resources available:
            • Substance Abuse and Mental Health Services Administration (SAMHSA) Helpline: 1-800-662-4357
            • Local support groups and treatment centers
            • Counseling services
            • Rehabilitation programs
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Legal Health & Well-being
          </ThemedText>
          <ThemedText style={styles.content}>
            Taking care of your legal situation is also part of your overall health:
            • Understand your rights
            • Work with experienced legal counsel
            • Follow court orders and requirements
            • Complete any required programs or treatment
            • Focus on making positive changes
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Emergency Situations
          </ThemedText>
          <ThemedText style={styles.content}>
            If you experience any of the following, seek immediate medical attention:
            • Severe withdrawal symptoms
            • Signs of alcohol poisoning
            • Severe anxiety or panic attacks
            • Thoughts of self-harm
            • Any physical injuries requiring immediate care
          </ThemedText>
          <ThemedText style={styles.emergencyText}>
            For medical emergencies, call 911 immediately.
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  section: {
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    color: '#FF6B35',
    marginBottom: 4,
  },
  content: {
    lineHeight: 22,
    opacity: 0.9,
  },
  emergencyText: {
    marginTop: 12,
    fontWeight: '600',
    color: '#DC2626',
    fontSize: 16,
  },
});

