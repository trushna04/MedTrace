import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  count: number;
  type: 'gold' | 'silver' | 'none';
}

export default function StreakBadge({ count, type }: Props) {
  return (
    <View style={styles.container}>
      {type === 'gold' && (
        <Text style={styles.gold}>🔥 {count} day streak</Text>
      )}
      {type === 'silver' && (
        <Text style={styles.silver}>✓ {count} day streak</Text>
      )}
      {type === 'none' && (
        <Text style={styles.none}>Start your streak today</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  gold: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  silver: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  none: {
    fontSize: 15,
    color: '#9CA3AF',
  },
});
