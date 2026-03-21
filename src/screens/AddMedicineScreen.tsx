import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AddMedicineScreen() {
  return (
    <View style={styles.container}>
      <Text>AddMedicineScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
