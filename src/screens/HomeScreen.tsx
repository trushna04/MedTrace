import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Medicine, DoseLog, Appointment } from '../types';
import MedicineCard from '../components/MedicineCard';
import StreakBadge from '../components/StreakBadge';
import { getTodaysDoseLogs, saveDoseLog, calculateStreak } from '../storage/doseLogs';
import { getMedicines } from '../storage/medicines';
import { getUpcomingAppointments } from '../storage/appointments';
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
  const navigation = useNavigation<any>();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [streak, setStreak] = useState<{ count: number; type: 'gold' | 'silver' | 'none' }>({
    count: 0,
    type: 'none',
  });
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      getMedicines().then(meds => {
        setMedicines(meds);
        supabase.auth.getUser().then(({ data }) => {
          if (data.user) syncMedicines(data.user.id, meds);
        });
      });
      getTodaysDoseLogs().then(setDoseLogs);
      getUpcomingAppointments().then(appts => setNextAppointment(appts[0] ?? null));
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
            {nextAppointment ? (
              <TouchableOpacity
                style={styles.apptBanner}
                onPress={() => navigation.navigate('Schedule')}
                activeOpacity={0.8}
              >
                <Text style={styles.apptBannerText}>
                  {'📅 Next: '}
                  <Text style={styles.apptBannerBold}>{nextAppointment.doctorName}</Text>
                  {nextAppointment.time ? ` · ${nextAppointment.date} · ${nextAppointment.time}` : ` · ${nextAppointment.date}`}
                </Text>
              </TouchableOpacity>
            ) : null}
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
  container: { flex: 1, backgroundColor: '#fff' },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  header: { marginTop: 8, marginBottom: 16 },
  greeting: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  name: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  date: { fontSize: 14, color: '#6B7280' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  apptBanner: {
    backgroundColor: '#ECFEFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#0891B2',
  },
  apptBannerText: { fontSize: 14, color: '#0E7490' },
  apptBannerBold: { fontWeight: '700' },
});
