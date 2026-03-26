import React, { useState } from 'react';
import {
  Alert,
  Clipboard,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { getLinkCode, getMedicines } from '../storage/medicines';
import { getDaysActive, getTotalDosesTaken } from '../storage/stats';
import { getLabReports } from '../storage/labReports';
import { getUpcomingAppointments } from '../storage/appointments';

function getInitials(email: string): string {
  const parts = email.split('@')[0].replace(/[^a-zA-Z\s]/g, ' ').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [linkCode, setLinkCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [medicineCount, setMedicineCount] = useState(0);
  const [daysActive, setDaysActive] = useState(0);
  const [totalDoses, setTotalDoses] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reportCount, setReportCount] = useState(0);
  const [appointmentCount, setAppointmentCount] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user?.email) setEmail(data.user.email);
      });
      getLinkCode().then(setLinkCode);
      getMedicines().then(meds => setMedicineCount(meds.length));
      getDaysActive().then(setDaysActive);
      getTotalDosesTaken().then(setTotalDoses);
      getLabReports().then(r => setReportCount(r.length));
      getUpcomingAppointments().then(a => setAppointmentCount(a.length));
    }, [])
  );

  function handleCopy() {
    if (!linkCode) return;
    Clipboard.setString(linkCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSignOut() {
    Alert.alert(
      'Sign out of MedTrace?',
      'You will need to log in again to access your data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => supabase.auth.signOut(),
        },
      ]
    );
  }

  const initials = email ? getInitials(email) : '?';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.email}>{email || '—'}</Text>
          <TouchableOpacity>
            <Text style={styles.editLink}>Edit Name</Text>
          </TouchableOpacity>
        </View>

        {/* Guardian Link Code */}
        {linkCode ? (
          <View style={styles.codeCard}>
            <Text style={styles.codeTitle}>Your Guardian Code</Text>
            <Text style={styles.codeValue}>{linkCode}</Text>
            <Text style={styles.codeSubtitle}>Share this with family to let them monitor you</Text>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopy} activeOpacity={0.8}>
              <Text style={styles.copyButtonText}>{copied ? 'Copied!' : 'Copy Code'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Stats */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Progress</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Medicines tracked</Text>
            <Text style={styles.statValue}>{medicineCount}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Days active</Text>
            <Text style={styles.statValue}>{daysActive}</Text>
          </View>
          <View style={[styles.statRow, styles.statRowLast]}>
            <Text style={styles.statLabel}>Total doses taken</Text>
            <Text style={styles.statValue}>{totalDoses}</Text>
          </View>
        </View>

        {/* Medical Records */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Medical Records</Text>
          <TouchableOpacity style={styles.navRow} onPress={() => navigation.navigate('LabReports')} activeOpacity={0.7}>
            <Text style={styles.navRowIcon}>📋</Text>
            <View style={styles.navRowBody}>
              <Text style={styles.navRowLabel}>Lab Reports & Doctor Notes</Text>
              <Text style={styles.navRowSub}>{reportCount} report{reportCount !== 1 ? 's' : ''} stored</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navRow, styles.navRowLast]} onPress={() => navigation.navigate('Schedule')} activeOpacity={0.7}>
            <Text style={styles.navRowIcon}>📅</Text>
            <View style={styles.navRowBody}>
              <Text style={styles.navRowLabel}>Appointments</Text>
              <Text style={styles.navRowSub}>{appointmentCount} upcoming</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ true: '#1D9E75', false: '#E5E7EB' }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>App Version</Text>
            <Text style={styles.settingMeta}>1.0.0</Text>
          </View>
          <View style={[styles.settingRow, styles.settingRowLast]}>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <Text style={styles.settingArrow}>›</Text>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 20, paddingBottom: 40 },

  header: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1D9E75',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  email: { fontSize: 16, color: '#6B7280', marginBottom: 6 },
  editLink: { fontSize: 14, color: '#1D9E75', fontWeight: '600' },

  codeCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  codeTitle: { fontSize: 14, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  codeValue: { fontSize: 32, fontWeight: 'bold', color: '#1D9E75', fontFamily: 'monospace', letterSpacing: 6, marginBottom: 8 },
  codeSubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
  copyButton: { backgroundColor: '#1D9E75', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 28 },
  copyButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, padding: 16, paddingBottom: 8 },

  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  statRowLast: {},
  statLabel: { fontSize: 15, color: '#111827' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#1D9E75' },

  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  settingRowLast: {},
  settingLabel: { fontSize: 15, color: '#111827' },
  settingMeta: { fontSize: 14, color: '#9CA3AF' },
  settingArrow: { fontSize: 20, color: '#9CA3AF' },

  navRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  navRowLast: {},
  navRowIcon: { fontSize: 20, width: 32 },
  navRowBody: { flex: 1 },
  navRowLabel: { fontSize: 15, color: '#111827', fontWeight: '500' },
  navRowSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  signOutButton: {
    borderWidth: 1.5,
    borderColor: '#E74C3C',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  signOutText: { color: '#E74C3C', fontSize: 16, fontWeight: '600' },
});
