import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  value: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
};

const toneColor = {
  default: '#1f2937',
  success: '#166534',
  warning: '#92400e',
  danger: '#991b1b'
};

export const KpiCard = ({ title, value, tone = 'default' }: Props) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color: toneColor[tone] }]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flex: 1
  },
  title: {
    color: '#6b7280',
    fontSize: 11,
    marginBottom: 2
  },
  value: {
    fontSize: 16,
    fontWeight: '700'
  }
});
