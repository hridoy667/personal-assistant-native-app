// components/SleepTrackerCard.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Moon, Sun } from 'lucide-react-native';

interface SleepTrackerCardProps {
  currentSession: { id: string; sleptAt: string } | null;
  onSleep: () => void;
  onWake: (sessionId: string) => void;
}

export function SleepTrackerCard({
  currentSession,
  onSleep,
  onWake,
}: SleepTrackerCardProps) {
  const isSleeping = Boolean(currentSession);

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.title}>
          {isSleeping ? 'Currently Sleeping' : 'Active Day'}
        </Text>
        <Text style={styles.subtitle}>
          {isSleeping
            ? `Slept at ${new Date(currentSession!.sleptAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : 'Tap when you are ready to rest'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, isSleeping ? styles.wakeBtn : styles.sleepBtn]}
        onPress={() => {
          if (isSleeping) {
            onWake(currentSession!.id);
          } else {
            onSleep();
          }
        }}
      >
        {isSleeping ? (
          <>
            <Sun size={18} color="#ffffff" />
            <Text style={styles.btnText}>I'm Awake</Text>
          </>
        ) : (
          <>
            <Moon size={18} color="#ffffff" />
            <Text style={styles.btnText}>Going to Sleep</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 10,
  },
  info: { flex: 1 },
  title: { color: '#f8fafc', fontSize: 16, fontWeight: '600' },
  subtitle: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  sleepBtn: { backgroundColor: '#6366f1' },
  wakeBtn: { backgroundColor: '#f59e0b' },
  btnText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
});