import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

type Slice = {
  label: string;
  value: number;
  color: string;
};

type Props = {
  title: string;
  slices: Slice[];
};

export const DonutChart = ({ title, slices }: Props) => {
  const size = 120;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = Math.max(slices.reduce((acc, item) => acc + item.value, 0), 1);

  let offset = 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartRow}>
        <Svg width={size} height={size}>
          <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
            {slices.map((slice) => {
              const ratio = slice.value / total;
              const dash = circumference * ratio;
              const segment = (
                <Circle
                  key={slice.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                  fill="transparent"
                  strokeLinecap="butt"
                />
              );
              offset += dash;
              return segment;
            })}
          </G>
        </Svg>
      </View>
      <View style={styles.legend}>
        {slices.map((slice) => (
          <View key={slice.label} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: slice.color }]} />
            <Text style={styles.legendText}>{slice.label}: {slice.value.toFixed(2)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginBottom: 12
  },
  title: {
    color: '#111827',
    fontWeight: '700',
    marginBottom: 10
  },
  chartRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  legend: {
    width: '100%'
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8
  },
  legendText: {
    color: '#374151',
    fontSize: 12
  }
});
