import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Medicine, DoseLog } from '../types';
import MedicineCard from '../components/MedicineCard';
import StreakBadge from '../components/StreakBadge';
import { getTodaysDoseLogs, saveDoseLog, calculateStreak } from '../storage/doseLogs';
import { getLinkCode, getMedicines } from '../storage/medicines';
import { supabase } from '../lib/supabase';
import { syncMedicines } from '../lib/database';

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
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [streak, setStreak] = useState<{ count: number; type: 'gold' | 'silver' | 'none' }>({
    count: 0,
    type: 'none',
  });
  const [linkCode, setLinkCode] = useState<string>('');

  useFocusEffect(
    React.useCallback(() => {
      getMedicines().then(meds => {
        setMedicines(meds);
        // Background sync to Supabase
        supabase.auth.getUser().then(({ data }) => {
          if (data.user) syncMedicines(data.user.id, meds);
        });
      });
      getTodaysDoseLogs().then(setDoseLogs);
      getLinkCode().then(setLinkCode);
    }, [])
  );

  async function onTaken(medicine: Medicine) {
    try {
      const logId = Math.random().toString(36).substring(2, 11);
      const takenAt = new Date().toISOString();
      const date = takenAt.split('T')[0];

      // Step 1: Optimistic UI update
      const newLog: DoseLog = {
        id: logId,
        medicineId: medicine.id,
        takenAt,
        status: 'taken',
      };
      setDoseLogs(prev => [...prev, newLog]);

      // Save to AsyncStorage
      await saveDoseLog(medicine.id, medicine.name, 'taken');

      // Recalculate streak
      const allMeds = await getMedicines();
      const newStreak = await calculateStreak(allMeds.length);
      setStreak(newStreak);

      // Step 2: Sync to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Saving dose log for:', medicine.name);
      console.log('User:', user?.id);

      if (user) {
        const { error } = await supabase.from('dose_logs').insert({
          id: logId,
          user_id: user.id,
          medicine_id: medicine.id,
          medicine_name: medicine.name,
          status: 'taken',
          taken_at: takenAt,
          date,
        });
        console.log('Supabase insert result:', error);
        if (error) console.error('Supabase sync error:', error.message);
        else console.log('Synced to Supabase successfully');
      } else {
        console.log('No user found - not syncing to Supabase');
      }
    } catch (err) {
      console.error('onTaken error:', err);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={medicines}
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
        ListFooterComponent={
          linkCode ? (
            <View style={styles.guardianCard}>
              <Text style={styles.guardianTitle}>Guardian Access</Text>
              <Text style={styles.linkCode}>{linkCode}</Text>
              <Text style={styles.guardianSubtitle}>Share this code with your family abroad</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  header: { marginTop: 8, marginBottom: 16 },
  greeting: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  name: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  date: { fontSize: 14, color: '#6B7280' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  guardianCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  guardianTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  linkCode: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1D9E75',
    fontFamily: 'monospace',
    letterSpacing: 6,
    marginBottom: 8,
  },
  guardianSubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
});
