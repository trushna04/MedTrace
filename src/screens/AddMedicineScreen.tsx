import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Frequency } from '../types';
import { saveMedicine } from '../storage/medicines';

const PILL_COLORS = ['#1D9E75', '#378ADD', '#F59E0B', '#E74C3C', '#9B59B6', '#E67E22'];
const FREQUENCIES = [
  Frequency.ONCE_DAILY,
  Frequency.TWICE_DAILY,
  Frequency.THREE_TIMES_DAILY,
  Frequency.AS_NEEDED,
];
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = ['00', '15', '30', '45'];
const PERIODS = ['AM', 'PM'];

export default function AddMedicineScreen() {
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState<Frequency>(Frequency.ONCE_DAILY);
  const [hour, setHour] = useState('8');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState('AM');
  const [pillColor, setPillColor] = useState(PILL_COLORS[0]);
  const [instructions, setInstructions] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [nameError, setNameError] = useState('');
  const [dosageError, setDosageError] = useState('');

  function reminderTime(): string {
    return `${hour}:${minute} ${period}`;
  }

  async function handleSave() {
    let valid = true;
    if (!name.trim()) { setNameError('Medicine name is required'); valid = false; }
    else setNameError('');
    if (!dosage.trim()) { setDosageError('Dosage is required'); valid = false; }
    else setDosageError('');
    if (!valid) return;

    await saveMedicine({
      name: name.trim(),
      dosageMg: parseFloat(dosage),
      frequency,
      reminderTime: reminderTime(),
      pillColor,
      startDate: new Date().toISOString(),
    });
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Medicine</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">

          {/* Name */}
          <Text style={styles.label}>Medicine Name</Text>
          <TextInput
            style={[styles.input, nameError ? styles.inputError : null]}
            value={name}
            onChangeText={t => { setName(t); if (t) setNameError(''); }}
            placeholder="e.g. Metformin"
            placeholderTextColor="#9CA3AF"
          />
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

          {/* Dosage */}
          <Text style={styles.label}>Dosage (mg)</Text>
          <TextInput
            style={[styles.input, dosageError ? styles.inputError : null]}
            value={dosage}
            onChangeText={t => { setDosage(t); if (t) setDosageError(''); }}
            placeholder="e.g. 500"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />
          {dosageError ? <Text style={styles.errorText}>{dosageError}</Text> : null}

          {/* Frequency */}
          <Text style={styles.label}>Frequency</Text>
          <View style={styles.pillRow}>
            {FREQUENCIES.map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.pill, frequency === f && styles.pillSelected]}
                onPress={() => setFrequency(f)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillText, frequency === f && styles.pillTextSelected]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Reminder Time */}
          <Text style={styles.label}>Reminder Time</Text>
          <TouchableOpacity style={styles.timeButton} onPress={() => setShowTimePicker(true)} activeOpacity={0.7}>
            <Text style={styles.timeIcon}>⏰</Text>
            <Text style={styles.timeText}>{reminderTime()}</Text>
          </TouchableOpacity>

          {/* Pill Color */}
          <Text style={styles.label}>Pill Color</Text>
          <View style={styles.colorRow}>
            {PILL_COLORS.map(color => (
              <TouchableOpacity
                key={color}
                style={[styles.colorCircle, { backgroundColor: color }]}
                onPress={() => setPillColor(color)}
                activeOpacity={0.8}
              >
                {pillColor === color && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>

          {/* Special Instructions */}
          <Text style={styles.label}>Special Instructions (optional)</Text>
          <TextInput
            style={styles.multilineInput}
            value={instructions}
            onChangeText={setInstructions}
            placeholder="e.g. Take with food, avoid dairy"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Save */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.saveButtonText}>Add Medicine</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Time Picker Modal */}
      <Modal visible={showTimePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Time</Text>
            <View style={styles.pickerRow}>

              {/* Hours */}
              <ScrollView style={styles.pickerCol} showsVerticalScrollIndicator={false}>
                {HOURS.map(h => (
                  <TouchableOpacity key={h} style={styles.pickerItem} onPress={() => setHour(h)}>
                    <Text style={[styles.pickerItemText, hour === h && styles.pickerItemSelected]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.pickerSep}>:</Text>

              {/* Minutes */}
              <ScrollView style={styles.pickerCol} showsVerticalScrollIndicator={false}>
                {MINUTES.map(m => (
                  <TouchableOpacity key={m} style={styles.pickerItem} onPress={() => setMinute(m)}>
                    <Text style={[styles.pickerItemText, minute === m && styles.pickerItemSelected]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* AM/PM */}
              <View style={styles.pickerCol}>
                {PERIODS.map(p => (
                  <TouchableOpacity key={p} style={styles.pickerItem} onPress={() => setPeriod(p)}>
                    <Text style={[styles.pickerItemText, period === p && styles.pickerItemSelected]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

            </View>
            <TouchableOpacity style={styles.modalDone} onPress={() => setShowTimePicker(false)}>
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 60 },
  backText: { fontSize: 18, color: '#1D9E75', fontWeight: '500' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#111827' },

  form: { padding: 20, paddingBottom: 48 },

  label: { fontSize: 13, color: '#6B7280', fontWeight: '600', marginBottom: 6, marginTop: 16 },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#111827',
  },
  inputError: { borderColor: '#EF4444' },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 4 },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  pillSelected: { backgroundColor: '#1D9E75', borderColor: '#1D9E75' },
  pillText: { fontSize: 13, color: '#6B7280' },
  pillTextSelected: { color: '#fff', fontWeight: '600' },

  timeButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 14,
    gap: 10,
  },
  timeIcon: { fontSize: 18 },
  timeText: { fontSize: 16, color: '#111827' },

  colorRow: { flexDirection: 'row', gap: 12 },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  multilineInput: {
    height: 80,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    fontSize: 16,
    color: '#111827',
  },

  saveButton: {
    backgroundColor: '#1D9E75',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 16 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 180 },
  pickerCol: { flex: 1 },
  pickerSep: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginHorizontal: 4 },
  pickerItem: { paddingVertical: 10, alignItems: 'center' },
  pickerItemText: { fontSize: 22, color: '#9CA3AF' },
  pickerItemSelected: { color: '#1D9E75', fontWeight: 'bold' },
  modalDone: {
    backgroundColor: '#1D9E75',
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  modalDoneText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
