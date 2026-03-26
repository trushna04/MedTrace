import React, { useCallback, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getVitals, saveVital, getLatestVitals } from '../storage/vitals';
import { VitalType, VITAL_CONFIGS, Vital } from '../types';

const VITAL_TYPES: VitalType[] = ['blood_pressure', 'glucose', 'weight', 'spo2', 'heart_rate', 'temperature'];

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function getValueColor(vital: Vital): string {
  if (vital.type === 'blood_pressure') {
    const systolic = parseInt(vital.value.split('/')[0]);
    if (systolic > 140 || systolic < 90) return '#EF4444';
  }
  if (vital.type === 'glucose') {
    const v = parseFloat(vital.value);
    if (v > 140) return '#F59E0B';
    if (v < 70) return '#EF4444';
  }
  if (vital.type === 'spo2') {
    if (parseFloat(vital.value) < 95) return '#EF4444';
  }
  return '#1D9E75';
}

type FilterOption = VitalType | 'all' | 'more';

export default function VitalsScreen() {
  const [latestVitals, setLatestVitals] = useState<Partial<Record<VitalType, Vital>>>({});
  const [history, setHistory] = useState<Vital[]>([]);
  const [filterType, setFilterType] = useState<VitalType | 'all'>('all');
  const [modalType, setModalType] = useState<VitalType | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [inputNote, setInputNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [showMore, setShowMore] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    const latest = await getLatestVitals();
    setLatestVitals(latest);
    const all = await getVitals();
    setHistory(all);
  }

  function openModal(type: VitalType) {
    setModalType(type);
    setInputValue('');
    setInputNote('');
  }

  function closeModal() {
    setModalType(null);
    setInputValue('');
    setInputNote('');
  }

  async function handleSave() {
    if (!modalType || !inputValue.trim()) return;
    setSaving(true);
    try {
      await saveVital(modalType, inputValue.trim(), inputNote.trim() || undefined);
      await loadData();
      closeModal();
    } finally {
      setSaving(false);
    }
  }

  const moreTypes: VitalType[] = ['spo2', 'heart_rate', 'temperature'];
  const isMoreActive = moreTypes.includes(filterType as VitalType);

  const filteredHistory =
    filterType === 'all'
      ? history
      : history.filter(v => v.type === filterType);

  const filterTabs: { key: FilterOption; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'blood_pressure', label: 'BP' },
    { key: 'glucose', label: 'Glucose' },
    { key: 'weight', label: 'Weight' },
    { key: 'more', label: 'More' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>Health Vitals</Text>

        {/* Log Today's Vitals */}
        <Text style={styles.sectionTitle}>Log Today's Vitals</Text>
        <View style={styles.grid}>
          {VITAL_TYPES.map(type => {
            const cfg = VITAL_CONFIGS[type];
            const latest = latestVitals[type];
            return (
              <TouchableOpacity
                key={type}
                style={styles.vitalCard}
                onPress={() => openModal(type)}
                activeOpacity={0.75}
              >
                <Text style={styles.vitalCardIcon}>{cfg.icon}</Text>
                <Text style={styles.vitalCardLabel}>{cfg.label}</Text>
                {latest ? (
                  <>
                    <Text style={styles.vitalCardValue}>
                      {latest.value} {latest.unit}
                    </Text>
                    <Text style={styles.vitalCardTime}>{timeAgo(latest.recordedAt)}</Text>
                  </>
                ) : (
                  <Text style={styles.vitalCardEmpty}>Tap to log</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* History */}
        <Text style={styles.sectionTitle}>History</Text>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {filterTabs.map(tab => {
            const isActive =
              tab.key === 'more'
                ? isMoreActive
                : filterType === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => {
                  if (tab.key === 'more') {
                    setShowMore(true);
                  } else {
                    setFilterType(tab.key as VitalType | 'all');
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* History list */}
        {filteredHistory.length === 0 ? (
          <Text style={styles.emptyHistory}>No vitals recorded yet.</Text>
        ) : (
          filteredHistory.map(item => (
            <View key={item.id} style={styles.historyRow}>
              <Text style={styles.historyIcon}>{VITAL_CONFIGS[item.type].icon}</Text>
              <View style={styles.historyMeta}>
                <Text style={styles.historyType}>{VITAL_CONFIGS[item.type].label}</Text>
                <Text style={styles.historyTime}>{timeAgo(item.recordedAt)}</Text>
              </View>
              <Text style={[styles.historyValue, { color: getValueColor(item) }]}>
                {item.value} {item.unit}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* More filter modal */}
      <Modal visible={showMore} transparent animationType="fade" onRequestClose={() => setShowMore(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowMore(false)}>
          <View style={styles.moreMenu}>
            <Text style={styles.moreMenuTitle}>Filter by type</Text>
            {moreTypes.map(type => (
              <TouchableOpacity
                key={type}
                style={styles.moreMenuItem}
                onPress={() => {
                  setFilterType(type);
                  setShowMore(false);
                }}
              >
                <Text style={styles.moreMenuIcon}>{VITAL_CONFIGS[type].icon}</Text>
                <Text style={styles.moreMenuLabel}>{VITAL_CONFIGS[type].label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Log modal */}
      {modalType && (
        <Modal visible={true} transparent animationType="slide" onRequestClose={closeModal}>
          <KeyboardAvoidingView
            style={styles.overlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Log {VITAL_CONFIGS[modalType].label}</Text>

              <View style={styles.inputRow}>
                <TextInput
                  style={styles.valueInput}
                  value={inputValue}
                  onChangeText={setInputValue}
                  placeholder={VITAL_CONFIGS[modalType].placeholder}
                  placeholderTextColor="#9CA3AF"
                  keyboardType={VITAL_CONFIGS[modalType].keyboardType}
                  autoFocus
                />
                <Text style={styles.unitLabel}>{VITAL_CONFIGS[modalType].unit}</Text>
              </View>

              <Text style={styles.normalRange}>
                Normal range: {VITAL_CONFIGS[modalType].normalRange}
              </Text>

              <TextInput
                style={styles.noteInput}
                value={inputNote}
                onChangeText={setInputNote}
                placeholder="Add a note (optional)"
                placeholderTextColor="#9CA3AF"
                multiline
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={closeModal}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  activeOpacity={0.8}
                  disabled={saving}
                >
                  <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20, paddingBottom: 40 },

  header: { fontSize: 26, fontWeight: 'bold', color: '#111827', marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 14 },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  vitalCard: {
    width: '31%',
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  vitalCardIcon: { fontSize: 28, marginBottom: 4 },
  vitalCardLabel: { fontSize: 11, color: '#6B7280', textAlign: 'center', marginBottom: 4, fontWeight: '500' },
  vitalCardValue: { fontSize: 13, fontWeight: '700', color: '#1D9E75', textAlign: 'center' },
  vitalCardTime: { fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 2 },
  vitalCardEmpty: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 2 },

  // Filter
  filterRow: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterTabActive: { backgroundColor: '#1D9E75' },
  filterTabText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  filterTabTextActive: { color: '#fff' },

  // History
  emptyHistory: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingVertical: 24 },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyIcon: { fontSize: 22, width: 36 },
  historyMeta: { flex: 1 },
  historyType: { fontSize: 14, fontWeight: '600', color: '#111827' },
  historyTime: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  historyValue: { fontSize: 15, fontWeight: '700' },

  // Overlay
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  // More menu
  moreMenu: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '80%',
  },
  moreMenuTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  moreMenuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  moreMenuIcon: { fontSize: 20, width: 32 },
  moreMenuLabel: { fontSize: 15, color: '#374151' },

  // Log modal
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  valueInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: 'bold',
    color: '#111827',
    borderBottomWidth: 2,
    borderBottomColor: '#1D9E75',
    paddingVertical: 8,
    marginRight: 12,
  },
  unitLabel: { fontSize: 16, color: '#6B7280', fontWeight: '500' },
  normalRange: { fontSize: 13, color: '#9CA3AF', marginBottom: 16 },
  noteInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 60,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  saveButton: {
    flex: 1,
    backgroundColor: '#1D9E75',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: { backgroundColor: '#A7F3D0' },
  saveButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
