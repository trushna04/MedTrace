import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Appointment } from '../types';
import {
  getAppointments,
  markAppointmentComplete,
  saveAppointment,
} from '../storage/appointments';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

interface ApptCardProps {
  appt: Appointment;
  onComplete?: () => void;
}

function AppointmentCard({ appt, onComplete }: ApptCardProps) {
  const isPast = appt.status !== 'upcoming';
  return (
    <View style={[styles.card, isPast && styles.cardPast]}>
      <View style={[styles.cardBorder, isPast && styles.cardBorderPast]} />
      <View style={styles.cardBody}>
        <Text style={[styles.doctorName, isPast && styles.textPast]}>{appt.doctorName}</Text>
        {appt.specialty ? <Text style={styles.specialty}>{appt.specialty}</Text> : null}
        <View style={styles.metaRow}>
          <Text style={styles.metaIcon}>📅</Text>
          <Text style={[styles.metaText, isPast && styles.textPast]}>{formatDate(appt.date)}</Text>
        </View>
        {appt.time ? (
          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>🕐</Text>
            <Text style={[styles.metaText, isPast && styles.textPast]}>{formatTime(appt.time)}</Text>
          </View>
        ) : null}
        {appt.location ? (
          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>📍</Text>
            <Text style={[styles.metaText, isPast && styles.textPast]}>{appt.location}</Text>
          </View>
        ) : null}
        {appt.notes ? (
          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>📝</Text>
            <Text style={[styles.metaText, isPast && styles.textPast]} numberOfLines={2}>{appt.notes}</Text>
          </View>
        ) : null}
        {!isPast && onComplete ? (
          <TouchableOpacity style={styles.completeButton} onPress={onComplete} activeOpacity={0.8}>
            <Text style={styles.completeButtonText}>Mark Complete</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export default function AppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [date, setDate] = useState(tomorrow());
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      getAppointments().then(setAppointments);
    }, [])
  );

  const upcoming = appointments.filter(
    a => a.status === 'upcoming' && a.date >= new Date().toISOString().split('T')[0]
  ).sort((a, b) => a.date.localeCompare(b.date));

  const past = appointments.filter(
    a => a.status !== 'upcoming' || a.date < new Date().toISOString().split('T')[0]
  ).sort((a, b) => b.date.localeCompare(a.date));

  function resetForm() {
    setDoctorName('');
    setSpecialty('');
    setDate(tomorrow());
    setTime('');
    setLocation('');
    setNotes('');
  }

  async function handleSave() {
    if (!doctorName.trim()) {
      Alert.alert('Doctor name is required');
      return;
    }
    await saveAppointment({
      doctorName: doctorName.trim(),
      specialty: specialty.trim(),
      date,
      time,
      location: location.trim(),
      notes: notes.trim(),
    });
    const updated = await getAppointments();
    setAppointments(updated);
    setModalVisible(false);
    resetForm();
  }

  async function handleComplete(id: string) {
    await markAppointmentComplete(id);
    const updated = await getAppointments();
    setAppointments(updated);
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Appointments</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Upcoming */}
        <Text style={styles.sectionTitle}>Upcoming</Text>
        {upcoming.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>No upcoming appointments</Text>
            <Text style={styles.emptySubtext}>Tap + to add your next doctor visit</Text>
          </View>
        ) : (
          upcoming.map(appt => (
            <AppointmentCard
              key={appt.id}
              appt={appt}
              onComplete={() => handleComplete(appt.id)}
            />
          ))
        )}

        {/* Past */}
        {past.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Past Appointments</Text>
            {past.map(appt => (
              <AppointmentCard key={appt.id} appt={appt} />
            ))}
          </>
        ) : null}
      </ScrollView>

      {/* Add Appointment Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Appointment</Text>
            <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Doctor Name *</Text>
            <TextInput
              style={styles.input}
              value={doctorName}
              onChangeText={setDoctorName}
              placeholder="Dr. Smith"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.fieldLabel}>Specialty</Text>
            <TextInput
              style={styles.input}
              value={specialty}
              onChangeText={setSpecialty}
              placeholder="Cardiologist"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.fieldLabel}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="2026-03-24"
              placeholderTextColor="#9CA3AF"
              keyboardType="numbers-and-punctuation"
            />

            <Text style={styles.fieldLabel}>Time</Text>
            <TextInput
              style={styles.input}
              value={time}
              onChangeText={setTime}
              placeholder="10:30 AM"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.fieldLabel}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="123 Medical Center Dr"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Bring previous reports"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveButtonText}>Save Appointment</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const TEAL = '#0891B2';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 22, fontWeight: 'bold', lineHeight: 26 },

  scroll: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },

  emptyCard: { backgroundColor: '#fff', borderRadius: 14, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 4 },
  emptySubtext: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },

  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  cardPast: { opacity: 0.65 },
  cardBorder: { width: 4, backgroundColor: TEAL },
  cardBorderPast: { backgroundColor: '#9CA3AF' },
  cardBody: { flex: 1, padding: 14 },
  doctorName: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
  specialty: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  textPast: { color: '#9CA3AF' },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  metaIcon: { fontSize: 13, width: 22, marginTop: 1 },
  metaText: { flex: 1, fontSize: 14, color: '#374151' },
  completeButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: TEAL,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  completeButtonText: { fontSize: 13, color: TEAL, fontWeight: '600' },

  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  closeButton: { fontSize: 18, color: '#6B7280', padding: 4 },
  modalScroll: { padding: 20, paddingBottom: 40 },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FAFAFA',
  },
  notesInput: { height: 88, paddingTop: 12, textAlignVertical: 'top' },

  saveButton: {
    backgroundColor: '#1D9E75',
    borderRadius: 12,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
