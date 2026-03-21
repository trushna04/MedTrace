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
