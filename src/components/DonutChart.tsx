import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { formatCurrency } from '../utils/format';

type Slice = {
  label: string;
  value: number;
  color: string;
};

type Props = {
  title: string;
  slices: Slice[];
  horizontal?: boolean;
  totalLabel?: string;
  totalValue?: string;
};

export const DonutChart = ({ title, slices, horizontal, totalLabel, totalValue }: Props) => {
  const size = horizontal ? 160 : 120;
  const strokeWidth = horizontal ? 28 : 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = Math.max(slices.reduce((acc, item) => acc + item.value, 0), 1);

  const renderSlices = () => {
    let offset = 0;
    return slices.map((slice) => {
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
    });
  };

  if (horizontal) {
    return (
      <View style={styles.cardWide}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.rowLayout}>
          <Svg width={size} height={size}>
            <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
              {renderSlices()}
            </G>
          </Svg>
          <View style={styles.legendWide}>
            {totalLabel && totalValue && (
              <View style={styles.totalBlock}>
                <Text style={styles.totalLabel}>{totalLabel}</Text>
                <Text style={styles.totalValue}>{totalValue}</Text>
              </View>
            )}
            {slices.map((slice) => (
              <View key={slice.label} style={styles.legendRowWide}>
                <View style={[styles.dot, { backgroundColor: slice.color }]} />
                <View>
                  <Text style={styles.legendLabel}>{slice.label}</Text>
                  <Text style={styles.legendValueWide}>{formatCurrency(slice.value)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartRow}>
        <Svg width={size} height={size}>
          <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
            {renderSlices()}
          </G>
        </Svg>
      </View>
      <View style={styles.legend}>
        {slices.map((slice) => (
          <View key={slice.label} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: slice.color }]} />
            <Text style={styles.legendText}>{slice.label}: {formatCurrency(slice.value)}</Text>
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
  cardWide: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    marginBottom: 12
  },
  title: {
    color: '#111827',
    fontWeight: '700',
    marginBottom: 12
  },
  chartRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  rowLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20
  },
  legend: {
    width: '100%'
  },
  legendWide: {
    flex: 1,
    justifyContent: 'center',
    gap: 10
  },
  totalBlock: {
    marginBottom: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  totalLabel: {
    color: '#6b7280',
    fontSize: 12,
    marginBottom: 2
  },
  totalValue: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 18
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  legendRowWide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  legendLabel: {
    color: '#6b7280',
    fontSize: 12
  },
  legendValueWide: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 15
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8
  },
  legendText: {
    color: '#374151',
    fontSize: 12
  }
});
