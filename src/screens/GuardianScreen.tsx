import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { getPatientData } from '../lib/database';
import { clearGuardianLink, getGuardianLink, saveGuardianLink } from '../storage/medicines';
import { Medicine, DoseLog } from '../types';

type StatusType = 'green' | 'amber' | 'red' | 'gray';

interface StatusConfig {
  color: string;
  symbol: string;
  label: string;
}

const STATUS: Record<StatusType, StatusConfig> = {
  green: { color: '#1D9E75', symbol: '✓', label: 'All medicines taken today 🎉' },
  amber: { color: '#F59E0B', symbol: '!', label: 'Some medicines missed' },
  red:   { color: '#E74C3C', symbol: '✗', label: 'No medicines taken today ⚠️' },
  gray:  { color: '#9E9E9E', symbol: '?', label: 'Waiting for data...' },
};

function computeStatus(medicines: Medicine[], logs: DoseLog[]): StatusType {
  if (medicines.length === 0) return 'gray';
  const taken = logs.filter(l => l.status === 'taken').length;
  if (taken === 0) return logs.length === 0 ? 'gray' : 'red';
  if (taken >= medicines.length) return 'green';
  return 'amber';
}

function formatTimestamp(logs: DoseLog[]): string {
  if (logs.length === 0) return '—';
  const latest = logs.reduce((a, b) => (a.takenAt > b.takenAt ? a : b));
  return new Date(latest.takenAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function GuardianScreen() {
  const [guardianLink, setGuardianLink] = useState<{ code: string; patientName: string } | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [logs, setLogs] = useState<DoseLog[]>([]);
  const [status, setStatus] = useState<StatusType>('gray');
  const [lastUpdated, setLastUpdated] = useState('—');

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevStatus = useRef<StatusType>('gray');
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    getGuardianLink().then(link => {
      setGuardianLink(link);
      if (link) refreshData();
    });
    return () => { channelRef.current?.unsubscribe(); };
  }, []);

  function applyLogs(meds: Medicine[], todayLogs: DoseLog[]) {
    setLogs(todayLogs);
    setLastUpdated(formatTimestamp(todayLogs));
    const s = computeStatus(meds, todayLogs);
    if (s !== prevStatus.current) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.08, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
      prevStatus.current = s;
    }
    setStatus(s);
  }

  async function loadDashboard(code: string) {
    const data = await getPatientData(code);
    if (!data) return;
    setMedicines(data.medicines);
    applyLogs(data.medicines, data.doseLogs);
  }

  async function refreshData() {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user logged in');
        return;
      }

      // Fetch today's dose logs for current user only
      const { data: rawLogs, error } = await supabase
        .from('dose_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today);

      console.log('Raw logs from Supabase:', rawLogs, 'Error:', error);

      if (error) {
        console.error('Refresh error:', error.message);
        return;
      }

      const todayLogs: DoseLog[] = (rawLogs || []).map((l: any) => ({
        id: l.id,
        medicineId: l.medicine_id,
        takenAt: l.taken_at,
        status: l.status,
      }));

      // Get medicines from AsyncStorage
      const { getMedicines } = await import('../storage/medicines');
      const allMeds = await getMedicines();

      console.log('Medicines count:', allMeds.length);
      console.log('Today logs count:', todayLogs.length);

      setMedicines(allMeds);
      setLogs(todayLogs);
      setLastUpdated(new Date().toLocaleTimeString());

      // Calculate status
      const taken = todayLogs.filter(l => l.status === 'taken');
      const uniqueTaken = new Set(taken.map(l => l.medicineId)).size;
      const totalMeds = allMeds.length;

      console.log('Unique taken:', uniqueTaken, 'Total meds:', totalMeds);

      if (uniqueTaken === 0) {
        setStatus(todayLogs.length === 0 ? 'gray' : 'red');
      } else if (uniqueTaken >= totalMeds) {
        setStatus('green');
      } else {
        setStatus('amber');
      }

      // Pulse animation
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.08, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();

    } catch (err) {
      console.error('refreshData error:', err);
    }
  }

  function subscribeRealtime(code: string) {
    channelRef.current?.unsubscribe();
    channelRef.current = supabase
      .channel(`dose_logs_${code}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'dose_logs' },
        () => loadDashboard(code)
      )
      .subscribe();
  }

  async function handleConnect() {
    const code = codeInput.trim().toUpperCase();
    const name = nameInput.trim() || 'Family Member';
    if (code.length < 4) return;
    await saveGuardianLink(code, name);
    const link = { code, patientName: name };
    setGuardianLink(link);
    loadDashboard(code);
    subscribeRealtime(code);
  }

  async function handleDisconnect() {
    channelRef.current?.unsubscribe();
    await clearGuardianLink();
    setGuardianLink(null);
    setMedicines([]);
    setLogs([]);
    setStatus('gray');
    setCodeInput('');
    setNameInput('');
  }

  const cfg = STATUS[status];

  if (!guardianLink) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.linkContainer}>
          <Text style={styles.linkTitle}>Monitor a family member</Text>
          <Text style={styles.linkSubtitle}>
            Enter the 6-digit code shared by your family member
          </Text>
          <TextInput
            style={styles.codeInput}
            value={codeInput}
            onChangeText={t => setCodeInput(t.toUpperCase())}
            placeholder="ABC123"
            placeholderTextColor="#9CA3AF"
            maxLength={6}
            autoCapitalize="characters"
          />
          <TextInput
            style={styles.nameInput}
            value={nameInput}
            onChangeText={setNameInput}
            placeholder="Their name (e.g. Mom)"
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity style={styles.connectButton} onPress={handleConnect} activeOpacity={0.8}>
            <Text style={styles.connectButtonText}>Connect</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.dashContainer}>
        <Text style={styles.monitoringLabel}>Monitoring</Text>
        <Text style={styles.patientName}>{guardianLink.patientName}</Text>

        <Animated.View
          style={[
            styles.circle,
            { backgroundColor: cfg.color, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Text style={styles.circleSymbol}>{cfg.symbol}</Text>
        </Animated.View>

        <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>

        <View style={styles.medicineList}>
          {medicines.map(med => {
            const taken = logs.some(l => l.medicineId === med.id && l.status === 'taken');
            return (
              <View key={med.id} style={styles.medicineRow}>
                <Text style={[styles.medicineCheck, taken ? styles.takenGreen : styles.notTakenGray]}>
                  {taken ? '✓' : '○'}
                </Text>
                <Text style={styles.medicineName}>{med.name} {med.dosageMg}mg</Text>
                <Text style={[styles.medicineStatus, taken ? styles.takenGreen : styles.notTakenGray]}>
                  {taken ? 'Taken' : 'Not yet'}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.lastUpdated}>Last updated: {lastUpdated}</Text>

        <TouchableOpacity style={styles.refreshButton} onPress={() => refreshData()} activeOpacity={0.8}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect} activeOpacity={0.8}>
          <Text style={styles.disconnectButtonText}>Disconnect</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  linkContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  linkTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 8, textAlign: 'center' },
  linkSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 32 },
  codeInput: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1D9E75',
    fontFamily: 'monospace',
    letterSpacing: 6,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#1D9E75',
    width: '100%',
    marginBottom: 16,
    paddingVertical: 8,
  },
  nameInput: {
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    width: '100%',
    marginBottom: 32,
    paddingVertical: 8,
  },
  connectButton: {
    backgroundColor: '#1D9E75',
    borderRadius: 12,
    height: 56,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  dashContainer: { alignItems: 'center', padding: 24, paddingBottom: 40 },
  monitoringLabel: { fontSize: 13, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  patientName: { fontSize: 26, fontWeight: 'bold', color: '#111827', marginBottom: 32 },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  circleSymbol: { fontSize: 72, color: '#fff', fontWeight: 'bold' },
  statusLabel: { fontSize: 17, fontWeight: '600', marginBottom: 32, textAlign: 'center' },

  medicineList: { width: '100%', marginBottom: 24 },
  medicineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  medicineCheck: { fontSize: 18, width: 28, fontWeight: 'bold' },
  medicineName: { flex: 1, fontSize: 15, color: '#111827' },
  medicineStatus: { fontSize: 14, fontWeight: '600' },
  takenGreen: { color: '#1D9E75' },
  notTakenGray: { color: '#9CA3AF' },

  lastUpdated: { fontSize: 13, color: '#9CA3AF', marginBottom: 20 },

  refreshButton: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 12,
  },
  refreshButtonText: { color: '#1D9E75', fontSize: 15, fontWeight: '600' },

  disconnectButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  disconnectButtonText: { color: '#9CA3AF', fontSize: 15, fontWeight: '500' },
});
