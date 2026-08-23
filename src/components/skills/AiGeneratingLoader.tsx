import React from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { Sparkles } from 'lucide-react-native';

interface Props {
  visible: boolean;
}

export function AiGeneratingLoader({ visible }: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconBox}>
            <Sparkles size={28} color="#34D399" />
          </View>
          <ActivityIndicator size="large" color="#10B981" style={styles.spinner} />
          <Text style={styles.title}>Designing Your Custom Skill Roadmap...</Text>
          <Text style={styles.subtitle}>
            Analyzing resources, structuring modules, and curating tasks using AI.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
    width: '100%',
    maxWidth: 340,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#064E3B40',
    borderWidth: 1,
    borderColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  spinner: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
});