import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  streak?: number;
}

export default function StreakBadge({ streak = 0 }: Props) {
  return (
    <View style={styles.container}>
      {streak > 0 ? (
        <Text style={styles.active}>🔥 {streak} day streak</Text>
      ) : (
        <Text style={styles.inactive}>✨ Start your streak today</Text>
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
  active: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F59E0B',
  },
  inactive: {
    fontSize: 15,
    color: '#9CA3AF',
  },
});
