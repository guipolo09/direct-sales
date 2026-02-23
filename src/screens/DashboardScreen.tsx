import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DonutChart } from '../components/DonutChart';
import { KpiCard } from '../components/KpiCard';
import { useAppStore } from '../store/AppStore';
import { addMonths, formatCurrency, formatMonthYear, isSameMonthYear } from '../utils/format';
import { AlertasScreen } from './AlertasScreen';
import { ConfiguracoesScreen } from './ConfiguracoesScreen';

export const DashboardScreen = () => {
  const { products, sales, receivables, payables, customers, stockMoves, getProductStock, notifications, themeColor } = useAppStore();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showAlertas, setShowAlertas] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const monthSales = useMemo(
    () => sales.filter((sale) => isSameMonthYear(sale.data, selectedMonth)),
    [sales, selectedMonth]
  );

  const salesTotal = monthSales.reduce((acc, sale) => acc + sale.total, 0);
  const cashSalesTotal = monthSales
    .filter((sale) => sale.formaPagamento === 'avista')
    .reduce((acc, sale) => acc + sale.total, 0);
  const entryTotal = monthSales.reduce((acc, sale) => acc + (sale.valorEntrada ?? 0), 0);

  const receivedFromReceivables = receivables
    .filter((item) => item.status === 'paga' && item.paidAt && isSameMonthYear(item.paidAt, selectedMonth))
    .reduce((acc, item) => acc + item.valor, 0);

  const receivedTotal = cashSalesTotal + entryTotal + receivedFromReceivables;

  const receivableTotal = receivables
    .filter((item) => item.status !== 'paga' && isSameMonthYear(item.vencimento, selectedMonth))
    .reduce((acc, item) => acc + item.valor, 0);

  const paidTotal = payables
    .filter((item) => item.status === 'paga' && item.paidAt && isSameMonthYear(item.paidAt, selectedMonth))
    .reduce((acc, item) => acc + item.valor, 0);

  const payableTotal = payables
    .filter((item) => item.status !== 'paga' && isSameMonthYear(item.vencimento, selectedMonth))
    .reduce((acc, item) => acc + item.valor, 0);

  const lowStockCount = products.filter((item) => getProductStock(item.id) <= item.estoqueMinimo).length;
  const newCustomersCount = customers.filter((customer) => isSameMonthYear(customer.createdAt, selectedMonth)).length;

  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
  const dailySalesCount = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const count = monthSales.filter((sale) => new Date(sale.data).getDate() === day).length;
    return { day, count };
  });
  const maxDailyCount = Math.max(...dailySalesCount.map((item) => item.count), 1);

  const uniqueMoves = stockMoves
    .filter((move, index, list) => {
      return (
        list.findIndex((candidate) => {
          const timeDiff = Math.abs(new Date(candidate.data).getTime() - new Date(move.data).getTime());
          return (
            candidate.productId === move.productId &&
            candidate.tipo === move.tipo &&
            candidate.quantidade === move.quantidade &&
            candidate.origem === move.origem &&
            timeDiff < 2000
          );
        }) === index
      );
    })
    .slice(0, 10);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Resumo da Loja</Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.headerIconBtn} onPress={() => setShowAlertas(true)}>
              <MaterialCommunityIcons name="bell-outline" size={22} color={themeColor} />
              {notifications.length > 0 ? (
                <View style={[styles.badge, { backgroundColor: notifications.some(n => n.prioridade === 'critico') ? '#dc2626' : '#d97706' }]}>
                  <Text style={styles.badgeText}>{notifications.length > 99 ? '99+' : notifications.length}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable style={styles.headerIconBtn} onPress={() => setShowConfig(true)}>
              <MaterialCommunityIcons name="cog-outline" size={22} color="#6b7280" />
            </Pressable>
          </View>
        </View>

        <AlertasScreen visible={showAlertas} onClose={() => setShowAlertas(false)} />
        <ConfiguracoesScreen visible={showConfig} onClose={() => setShowConfig(false)} />

        <View style={styles.monthCard}>
          <Text style={styles.monthArrow} onPress={() => setSelectedMonth((prev) => addMonths(prev, -1))}>
            {'<'}
          </Text>
          <Text style={styles.monthTitle}>{formatMonthYear(selectedMonth)}</Text>
          <Text style={styles.monthArrow} onPress={() => setSelectedMonth((prev) => addMonths(prev, 1))}>
            {'>'}
          </Text>
        </View>

        <View style={styles.kpiRow}>
          <KpiCard title="Vendas do mes" value={formatCurrency(salesTotal)} tone="success" />
          <KpiCard title="Recebidos no mes" value={formatCurrency(receivedTotal)} tone="success" />
          <KpiCard title="A receber no mes" value={formatCurrency(receivableTotal)} tone="warning" />
        </View>
        <View style={styles.kpiRow}>
          <KpiCard title="Pago no mes" value={formatCurrency(paidTotal)} tone="default" />
          <KpiCard title="A pagar no mes" value={formatCurrency(payableTotal)} tone="danger" />
          <KpiCard title="Clientes novos" value={String(newCustomersCount)} tone="default" />
        </View>

        <DonutChart
          title="Vendas do Periodo"
          horizontal
          totalLabel="Total de Vendas"
          totalValue={formatCurrency(salesTotal)}
          slices={[
            { label: 'Recebido', value: receivedTotal, color: '#16a34a' },
            { label: 'A receber', value: receivableTotal, color: '#f59e0b' }
          ]}
        />

        <View style={styles.barCard}>
          <Text style={styles.barTitle}>Vendas por dia (quantidade)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.barRow}>
              {dailySalesCount.map((item) => {
                const height = Math.max((item.count / maxDailyCount) * 120, item.count > 0 ? 8 : 2);
                return (
                  <View key={String(item.day)} style={styles.barItem}>
                    <View style={[styles.bar, { height }]} />
                    <Text style={styles.barDay}>{item.day}</Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.bottomHalf}>
            <View style={styles.box}>
              <Text style={styles.boxTitle}>Acompanhamento rapido</Text>
              <Text style={styles.boxText}>- Estoque baixo: {lowStockCount}</Text>
              <Text style={styles.boxText}>- Produtos: {products.length}</Text>
            </View>
          </View>
          <View style={styles.bottomHalf}>
            <View style={styles.historyBox}>
              <Text style={styles.historyTitle}>Ultimas movimentacoes</Text>
              {uniqueMoves.slice(0, 5).map((move) => {
                const productName = products.find((item) => item.id === move.productId)?.nome ?? 'Produto';
                return (
                  <Text key={move.id} style={styles.historyText}>
                    {move.tipo.toUpperCase()} | {productName} | {move.quantidade} un
                  </Text>
                );
              })}
              {uniqueMoves.length === 0 ? <Text style={styles.historyText}>Sem movimentacoes.</Text> : null}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f4f6'
  },
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6'
  },
  content: {
    padding: 16,
    paddingBottom: 32
  },
  topRow: {
    marginTop: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827'
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  monthCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  monthArrow: {
    color: '#111827',
    fontWeight: '700',
    width: 30,
    textAlign: 'center'
  },
  monthTitle: {
    color: '#111827',
    fontWeight: '700',
    textTransform: 'capitalize'
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 8
  },
  bottomHalf: {
    flex: 1
  },
  barCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginBottom: 12
  },
  barTitle: {
    color: '#111827',
    fontWeight: '700',
    marginBottom: 8
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    minHeight: 150,
    paddingRight: 8
  },
  barItem: {
    width: 22,
    alignItems: 'center'
  },
  bar: {
    width: 16,
    backgroundColor: '#1d4ed8',
    borderRadius: 4
  },
  barDay: {
    marginTop: 6,
    color: '#6b7280',
    fontSize: 10
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    marginBottom: 12
  },
  boxTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#111827'
  },
  boxText: {
    color: '#374151',
    marginBottom: 6
  },
  historyBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    color: '#111827'
  },
  historyText: {
    color: '#4b5563',
    marginBottom: 6
  }
});
