export enum Frequency {
  ONCE_DAILY = 'Once Daily',
  TWICE_DAILY = 'Twice Daily',
  THREE_TIMES_DAILY = 'Three Times Daily',
  AS_NEEDED = 'As Needed'
}

export interface Medicine {
  id: string;
  name: string;
  dosageMg: number;
  frequency: Frequency;
  reminderTime: string;
  pillColor: string;
  startDate: string;
}

export interface DoseLog {
  id: string;
  medicineId: string;
  takenAt: string;
  status: 'taken' | 'missed' | 'skipped';
}

export type VitalType = 'blood_pressure' | 'glucose' | 'weight' | 'spo2' | 'heart_rate' | 'temperature'

export interface Vital {
  id: string
  userId?: string
  type: VitalType
  value: string
  unit: string
  recordedAt: string
  date: string
  note?: string
}

export interface VitalConfig {
  label: string
  unit: string
  icon: string
  normalRange: string
  placeholder: string
  keyboardType: 'numeric' | 'default'
}

export interface LabReport {
  id: string
  userId?: string
  title: string
  doctorName: string
  reportDate: string
  reportType: 'blood_test' | 'urine_test' | 'xray' | 'ecg' | 'prescription' | 'discharge' | 'other'
  notes: string
  fileUri?: string
  fileName?: string
  uploadedAt: string
  status: 'local' | 'uploaded'
}

export const REPORT_TYPE_LABELS: Record<string, string> = {
  blood_test: 'Blood Test',
  urine_test: 'Urine Test',
  xray: 'X-Ray / Scan',
  ecg: 'ECG / Heart',
  prescription: 'Prescription',
  discharge: 'Discharge Summary',
  other: 'Other Report',
}

export interface Appointment {
  id: string
  userId?: string
  doctorName: string
  specialty: string
  date: string
  time: string
  location: string
  notes: string
  status: 'upcoming' | 'completed' | 'cancelled'
  createdAt: string
}

export const VITAL_CONFIGS: Record<VitalType, VitalConfig> = {
  blood_pressure: {
    label: 'Blood Pressure',
    unit: 'mmHg',
    icon: '🫀',
    normalRange: '120/80',
    placeholder: '120/80',
    keyboardType: 'default'
  },
  glucose: {
    label: 'Blood Glucose',
    unit: 'mg/dL',
    icon: '🩸',
    normalRange: '70-140',
    placeholder: '95',
    keyboardType: 'numeric'
  },
  weight: {
    label: 'Weight',
    unit: 'kg',
    icon: '⚖️',
    normalRange: 'varies',
    placeholder: '70',
    keyboardType: 'numeric'
  },
  spo2: {
    label: 'Oxygen Level',
    unit: '%',
    icon: '🫁',
    normalRange: '95-100',
    placeholder: '98',
    keyboardType: 'numeric'
  },
  heart_rate: {
    label: 'Heart Rate',
    unit: 'bpm',
    icon: '💓',
    normalRange: '60-100',
    placeholder: '72',
    keyboardType: 'numeric'
  },
  temperature: {
    label: 'Temperature',
    unit: '°F',
    icon: '🌡️',
    normalRange: '97-99',
    placeholder: '98.6',
    keyboardType: 'numeric'
  }
}
