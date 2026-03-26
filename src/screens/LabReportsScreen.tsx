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
import { LabReport, REPORT_TYPE_LABELS } from '../types';
import { deleteLabReport, getLabReports, saveLabReport } from '../storage/labReports';

type ReportType = LabReport['reportType'];

const TYPE_COLORS: Record<ReportType, string> = {
  blood_test:   '#EF4444',
  urine_test:   '#F59E0B',
  xray:         '#3B82F6',
  ecg:          '#EC4899',
  prescription: '#1D9E75',
  discharge:    '#8B5CF6',
  other:        '#6B7280',
};

const REPORT_TYPES: ReportType[] = [
  'blood_test', 'urine_test', 'xray', 'ecg', 'prescription', 'discharge', 'other',
];

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export default function LabReportsScreen() {
  const [reports, setReports] = useState<LabReport[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [title, setTitle] = useState('');
  const [reportType, setReportType] = useState<ReportType>('blood_test');
  const [doctorName, setDoctorName] = useState('');
  const [reportDate, setReportDate] = useState(todayStr());
  const [notes, setNotes] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      getLabReports().then(setReports);
    }, [])
  );

  function resetForm() {
    setTitle('');
    setReportType('blood_test');
    setDoctorName('');
    setReportDate(todayStr());
    setNotes('');
  }

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert('Report title is required');
      return;
    }
    await saveLabReport({
      title: title.trim(),
      doctorName: doctorName.trim(),
      reportDate,
      reportType,
      notes: notes.trim(),
    });
    const updated = await getLabReports();
    setReports(updated);
    setModalVisible(false);
    resetForm();
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete Report', 'Remove this report?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteLabReport(id);
          setReports(prev => prev.filter(r => r.id !== id));
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lab Reports</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {reports.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No reports yet</Text>
            <Text style={styles.emptySubtext}>Add your lab reports and doctor notes here</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
              <Text style={styles.emptyButtonText}>Add First Report</Text>
            </TouchableOpacity>
          </View>
        ) : (
          reports.map(report => {
            const color = TYPE_COLORS[report.reportType];
            return (
              <View key={report.id} style={styles.card}>
                <View style={[styles.cardBorder, { backgroundColor: color }]} />
                <View style={styles.cardBody}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.reportTitle} numberOfLines={1}>{report.title}</Text>
                    <TouchableOpacity onPress={() => handleDelete(report.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={styles.deleteIcon}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                  {report.doctorName ? <Text style={styles.doctorName}>{report.doctorName}</Text> : null}
                  <View style={styles.badgeRow}>
                    <View style={[styles.typeBadge, { backgroundColor: color + '20', borderColor: color }]}>
                      <Text style={[styles.typeBadgeText, { color }]}>{REPORT_TYPE_LABELS[report.reportType]}</Text>
                    </View>
                    <Text style={styles.reportDate}>{report.reportDate}</Text>
                  </View>
                  {report.notes ? (
                    <Text style={styles.notesPreview} numberOfLines={2}>{report.notes}</Text>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add Report Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Lab Report</Text>
            <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">

            <Text style={styles.fieldLabel}>Report Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Blood Test Results - March 2026"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.fieldLabel}>Report Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typePicker}>
              {REPORT_TYPES.map(type => {
                const selected = reportType === type;
                const color = TYPE_COLORS[type];
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typePill, selected && { backgroundColor: color, borderColor: color }]}
                    onPress={() => setReportType(type)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.typePillText, selected && { color: '#fff' }]}>
                      {REPORT_TYPE_LABELS[type]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.fieldLabel}>Doctor Name</Text>
            <TextInput
              style={styles.input}
              value={doctorName}
              onChangeText={setDoctorName}
              placeholder="Dr. Sharma"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.fieldLabel}>Report Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={reportDate}
              onChangeText={setReportDate}
              placeholder={todayStr()}
              placeholderTextColor="#9CA3AF"
              keyboardType="numbers-and-punctuation"
            />

            <Text style={styles.fieldLabel}>Notes / Key Findings</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="HbA1c: 6.8, Cholesterol: 185..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveButtonText}>Save Report</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

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
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#1D9E75', alignItems: 'center', justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 22, fontWeight: 'bold', lineHeight: 26 },

  scroll: { padding: 16, paddingBottom: 40 },

  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginBottom: 24 },
  emptyButton: { backgroundColor: '#1D9E75', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 },
  emptyButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  cardBorder: { width: 4 },
  cardBody: { flex: 1, padding: 14 },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  reportTitle: { flex: 1, fontSize: 16, fontWeight: 'bold', color: '#111827', marginRight: 8 },
  deleteIcon: { fontSize: 16 },
  doctorName: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  typeBadge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  typeBadgeText: { fontSize: 11, fontWeight: '600' },
  reportDate: { fontSize: 13, color: '#9CA3AF' },
  notesPreview: { fontSize: 12, color: '#6B7280', lineHeight: 18 },

  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  closeButton: { fontSize: 18, color: '#6B7280', padding: 4 },
  modalScroll: { padding: 20, paddingBottom: 40 },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
  input: { height: 48, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, fontSize: 16, color: '#111827', backgroundColor: '#FAFAFA' },
  notesInput: { height: 96, paddingTop: 12 },

  typePicker: { marginBottom: 4 },
  typePill: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8, backgroundColor: '#F9FAFB' },
  typePillText: { fontSize: 13, fontWeight: '600', color: '#374151' },

  saveButton: { backgroundColor: '#1D9E75', borderRadius: 12, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
