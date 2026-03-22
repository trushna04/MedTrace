import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Medicine } from '../types';

interface Props {
  medicine: Medicine;
  isTaken: boolean;
  onTaken: () => void;
}

export default function MedicineCard({ medicine, isTaken, onTaken }: Props) {
  return (
    <View style={[styles.card, { borderLeftColor: medicine.pillColor }, isTaken && styles.cardTaken]}>
      <Text style={styles.name}>{medicine.name}</Text>
      <Text style={styles.detail}>{medicine.dosageMg}mg · {medicine.frequency}</Text>
      <Text style={styles.detail}>⏰ {medicine.reminderTime}</Text>
      {isTaken ? (
        <View style={styles.takenRow}>
          <Text style={styles.takenCheck}>✓</Text>
          <Text style={styles.takenText}>Taken</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={onTaken}>
          <Text style={styles.buttonText}>Mark as Taken</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTaken: {
    backgroundColor: '#F0FDF4',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  detail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  button: {
    backgroundColor: '#1D9E75',
    borderRadius: 8,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  takenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  takenCheck: {
    fontSize: 20,
    color: '#1D9E75',
    fontWeight: 'bold',
    marginRight: 6,
  },
  takenText: {
    fontSize: 16,
    color: '#1D9E75',
    fontWeight: '600',
  },
});
