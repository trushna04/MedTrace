import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Medicine } from '../types';

interface Props {
  medicine: Medicine;
}

export default function MedicineCard({ medicine }: Props) {
  return (
    <View style={[styles.card, { borderLeftColor: medicine.pillColor }]}>
      <Text style={styles.name}>{medicine.name}</Text>
      <Text style={styles.detail}>{medicine.dosageMg}mg · {medicine.frequency}</Text>
      <Text style={styles.detail}>⏰ {medicine.reminderTime}</Text>
      <TouchableOpacity style={styles.button} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Mark as Taken</Text>
      </TouchableOpacity>
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
});
