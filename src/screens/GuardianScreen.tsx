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

function getVitalIcon(type: string): string {
  const icons: Record<string, string> = {
    blood_pressure: '🫀', glucose: '🩸', weight: '⚖️',
    spo2: '🫁', heart_rate: '💓', temperature: '🌡️',
  };
  return icons[type] ?? '📊';
}

function getVitalLabel(type: string): string {
  const labels: Record<string, string> = {
    blood_pressure: 'Blood Pressure', glucose: 'Glucose',
    weight: 'Weight', spo2: 'SpO2', heart_rate: 'Heart Rate', temperature: 'Temp',
  };
  return labels[type] ?? type;
}

function getVitalColor(v: any): string {
  const val = parseFloat(v.value);
  switch (v.type) {
    case 'glucose':       return val < 70 || val > 140 ? '#E74C3C' : '#1D9E75';
    case 'spo2':          return val < 95 ? '#E74C3C' : '#1D9E75';
    case 'heart_rate':    return val < 60 || val > 100 ? '#E74C3C' : '#1D9E75';
    case 'temperature':   return val < 36 || val > 37.5 ? '#E74C3C' : '#1D9E75';
    case 'weight':        return '#1D9E75';
    case 'blood_pressure': {
      const parts = v.value.split('/').map(Number);
      if (parts.length === 2 && (parts[0] > 140 || parts[1] > 90)) return '#E74C3C';
      return '#1D9E75';
    }
    default: return '#1D9E75';
  }
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

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
  const [patientVitals, setPatientVitals] = useState<any[]>([]);
  const [patientAppointments, setPatientAppointments] = useState<any[]>([]);
  const [patientReports, setPatientReports] = useState<any[]>([]);

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

      const { data: vitalsData, error: vitalsError } = await supabase
        .from('vitals')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(20);

      console.log('Guardian vitals:', vitalsData, vitalsError);

      // Get latest of each type
      const latestMap: Record<string, any> = {};
      for (const v of (vitalsData || [])) {
        if (!latestMap[v.type]) latestMap[v.type] = v;
      }
      setPatientVitals(Object.values(latestMap));

      const { data: apptData } = await supabase
        .from('appointments')
        .select('*')
        .eq('status', 'upcoming')
        .order('date', { ascending: true })
        .limit(3);
      setPatientAppointments(apptData || []);

      const { data: reportsData } = await supabase
        .from('lab_reports')
        .select('*')
        .order('uploaded_at', { ascending: false })
        .limit(5);
      setPatientReports(reportsData || []);

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

        <View style={styles.vitalsSection}>
          <Text style={styles.vitalsSectionTitle}>Latest Vitals</Text>
          <Text style={styles.vitalsSubtitle}>Updated by your family member</Text>
          {patientVitals.length === 0 ? (
            <View style={styles.noVitalsCard}>
              <Text style={styles.noVitals}>No vitals recorded yet</Text>
              <Text style={styles.noVitalsSubtitle}>Your family member hasn't logged any vitals</Text>
            </View>
          ) : (
            <View style={styles.vitalsGrid}>
              {patientVitals.map((v: any) => {
                const color = getVitalColor(v);
                return (
                  <View key={v.id} style={[styles.vitalCard, { borderLeftColor: color }]}>
                    <Text style={styles.vitalIcon}>{getVitalIcon(v.type)}</Text>
                    <Text style={styles.vitalLabel}>{getVitalLabel(v.type)}</Text>
                    <Text style={[styles.vitalValue, { color }]}>{v.value} {v.unit}</Text>
                    <Text style={styles.vitalTime}>{timeAgo(v.recorded_at)}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.apptSection}>
          <Text style={styles.apptSectionTitle}>Upcoming Appointments</Text>
          {patientAppointments.length === 0 ? (
            <Text style={styles.noAppts}>No upcoming appointments</Text>
          ) : (
            patientAppointments.map((a: any) => (
              <View key={a.id} style={styles.apptRow}>
                <Text style={styles.apptIcon}>📅</Text>
                <Text style={styles.apptText}>
                  <Text style={styles.apptDoctor}>{a.doctor_name}</Text>
                  {a.specialty ? ` · ${a.specialty}` : ''}
                  {` · ${a.date}`}
                  {a.time ? ` ${a.time}` : ''}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.apptSection}>
          <Text style={styles.apptSectionTitle}>Recent Reports</Text>
          {patientReports.length === 0 ? (
            <Text style={styles.noAppts}>No reports uploaded yet</Text>
          ) : (
            patientReports.map((r: any) => (
              <View key={r.id} style={styles.apptRow}>
                <Text style={styles.apptIcon}>📋</Text>
                <Text style={styles.apptText}>
                  <Text style={styles.apptDoctor}>{r.title}</Text>
                  {r.report_type ? ` · ${r.report_type.replace(/_/g, ' ')}` : ''}
                  {r.report_date ? ` · ${r.report_date}` : ''}
                </Text>
              </View>
            ))
          )}
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

  vitalsSection: { width: '100%', marginBottom: 20 },
  vitalsSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  vitalsSubtitle: { fontSize: 12, color: '#9CA3AF', marginBottom: 12 },
  noVitalsCard: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 20, alignItems: 'center' },
  noVitals: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  noVitalsSubtitle: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  vitalCard: { width: '48%', backgroundColor: '#F0FDF4', borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 3 },
  vitalIcon: { fontSize: 24, marginBottom: 6 },
  vitalLabel: { fontSize: 12, color: '#6B7280' },
  vitalValue: { fontSize: 20, fontWeight: 'bold', marginTop: 2 },
  vitalTime: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },

  apptSection: { width: '100%', marginBottom: 20 },
  apptSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  noAppts: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingVertical: 8 },
  apptRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  apptIcon: { fontSize: 14, width: 22, marginTop: 1 },
  apptText: { flex: 1, fontSize: 14, color: '#374151' },
  apptDoctor: { fontWeight: '700', color: '#111827' },
});
