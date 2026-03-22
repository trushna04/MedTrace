import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Medicine, DoseLog, Frequency } from '../types';
import MedicineCard from '../components/MedicineCard';
import StreakBadge from '../components/StreakBadge';
import { getTodaysDoseLogs, saveDoseLog, calculateStreak } from '../storage/doseLogs';

const TEST_MEDICINES: Medicine[] = [
  {
    id: '1',
    name: 'Metformin',
    dosageMg: 500,
    frequency: Frequency.ONCE_DAILY,
    reminderTime: '8:00 AM',
    pillColor: '#1D9E75',
    startDate: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Lisinopril',
    dosageMg: 10,
    frequency: Frequency.ONCE_DAILY,
    reminderTime: '9:00 AM',
    pillColor: '#378ADD',
    startDate: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Vitamin D',
    dosageMg: 1000,
    frequency: Frequency.ONCE_DAILY,
    reminderTime: '8:00 AM',
    pillColor: '#F59E0B',
    startDate: new Date().toISOString(),
  },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning 🌅';
  if (hour < 17) return 'Good afternoon ☀️';
  return 'Good evening 🌙';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function HomeScreen() {
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [streak, setStreak] = useState<{ count: number; type: 'gold' | 'silver' | 'none' }>({
    count: 0,
    type: 'none',
  });

  useEffect(() => {
    getTodaysDoseLogs().then(setDoseLogs);
  }, []);

  async function refreshStreak() {
    const result = await calculateStreak(TEST_MEDICINES.length);
    setStreak(result);
  }

  function onTaken(medicine: Medicine) {
    // Optimistic UI update
    const newLog: DoseLog = {
      id: Math.random().toString(36).substring(2, 11),
      medicineId: medicine.id,
      takenAt: new Date().toISOString(),
      status: 'taken',
    };
    const updatedLogs = [...doseLogs, newLog];
    setDoseLogs(updatedLogs);

    // Persist and recalculate in background
    saveDoseLog(medicine.id, medicine.name, 'taken');
    refreshStreak();
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={TEST_MEDICINES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MedicineCard
            medicine={item}
            isTaken={doseLogs.some(l => l.medicineId === item.id && l.status === 'taken')}
            onTaken={() => onTaken(item)}
          />
        )}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.name}>Trushna</Text>
              <Text style={styles.date}>{formatDate()}</Text>
            </View>
            <StreakBadge count={streak.count} type={streak.type} />
            <Text style={styles.sectionTitle}>Today's Medicines</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    marginTop: 8,
    marginBottom: 16,
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
});
