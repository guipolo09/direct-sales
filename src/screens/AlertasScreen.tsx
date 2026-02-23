import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppNotification, NotificationType } from '../types/models';
import { useAppStore } from '../store/AppStore';

type FilterType = 'todos' | NotificationType;

const FILTER_LABELS: Record<FilterType, string> = {
  todos:           'Todos',
  estoque_baixo:   'Estoque',
  consumo_cliente: 'Clientes',
  conta_receber:   'A Receber',
  conta_pagar:     'A Pagar',
};

const TYPE_ICONS: Record<NotificationType, string> = {
  estoque_baixo:   'package-variant',
  consumo_cliente: 'account-clock',
  conta_receber:   'cash-plus',
  conta_pagar:     'cash-minus',
};

const TYPE_LABELS: Record<NotificationType, string> = {
  estoque_baixo:   'Estoque Baixo',
  consumo_cliente: 'Produto do Cliente',
  conta_receber:   'A Receber',
  conta_pagar:     'A Pagar',
};

const PRIORITY_COLORS = { critico: '#dc2626', aviso: '#d97706', info: '#2563eb' };
const PRIORITY_BG     = { critico: '#fef2f2', aviso: '#fffbeb', info: '#eff6ff' };
const READ_BG         = '#f9fafb';
const READ_BORDER     = '#d1d5db';

type Props = { visible: boolean; onClose: () => void };

export const AlertasScreen = ({ visible, onClose }: Props) => {
  const {
    notifications,
    themeColor,
    readNotificationIds,
    markNotificationRead,
    markAllNotificationsRead,
    dismissNotification,
    dismissAllNotifications,
  } = useAppStore();

  const [filter, setFilter] = useState<FilterType>('todos');

  const unreadCount = notifications.filter((n) => !readNotificationIds.has(n.id)).length;

  const filtered =
    filter === 'todos' ? notifications : notifications.filter((n) => n.tipo === filter);

  const renderCard = (item: AppNotification) => {
    const isRead = readNotificationIds.has(item.id);
    const borderColor  = isRead ? READ_BORDER : PRIORITY_COLORS[item.prioridade];
    const bgColor      = isRead ? READ_BG     : PRIORITY_BG[item.prioridade];
    const labelColor   = isRead ? '#9ca3af'   : PRIORITY_COLORS[item.prioridade];
    const messageColor = isRead ? '#9ca3af'   : '#374151';

    return (
      <View key={item.id} style={[styles.card, { backgroundColor: bgColor, borderLeftColor: borderColor }]}>
        {/* Top row: type info + action buttons */}
        <View style={styles.cardRow}>
          <View style={styles.cardLeft}>
            <MaterialCommunityIcons name={TYPE_ICONS[item.tipo] as any} size={15} color={labelColor} />
            <Text style={[styles.cardType, { color: labelColor }]}>
              {TYPE_LABELS[item.tipo].toUpperCase()}
            </Text>
            {!isRead && item.diasRestantes < 0 ? (
              <View style={[styles.statusBadge, { backgroundColor: '#dc2626' }]}>
                <Text style={styles.statusBadgeText}>VENCIDO</Text>
              </View>
            ) : !isRead && item.diasRestantes === 0 ? (
              <View style={[styles.statusBadge, { backgroundColor: '#d97706' }]}>
                <Text style={styles.statusBadgeText}>HOJE</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.cardActions}>
            {/* Mark as read */}
            <Pressable
              style={styles.actionBtn}
              onPress={() => markNotificationRead(item.id)}
              disabled={isRead}
            >
              <MaterialCommunityIcons
                name={isRead ? 'check-circle' : 'check-circle-outline'}
                size={20}
                color={isRead ? '#9ca3af' : '#16a34a'}
              />
            </Pressable>

            {/* Delete / dismiss */}
            <Pressable
              style={styles.actionBtn}
              onPress={() => dismissNotification(item.id)}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ef4444" />
            </Pressable>
          </View>
        </View>

        {/* Message */}
        <Text style={[styles.cardMessage, { color: messageColor }]}>{item.mensagem}</Text>
      </View>
    );
  };

  const renderSection = (type: NotificationType) => {
    const items = filtered.filter((n) => n.tipo === type);
    if (!items.length) return null;
    return (
      <View key={type} style={styles.section}>
        <Text style={styles.sectionTitle}>{TYPE_LABELS[type]}</Text>
        {items.map(renderCard)}
      </View>
    );
  };

  const filters: FilterType[] = ['todos', 'estoque_baixo', 'consumo_cliente', 'conta_receber', 'conta_pagar'];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Alertas</Text>
            {unreadCount > 0 ? (
              <View style={[styles.unreadBadge, { backgroundColor: themeColor }]}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount} não lido{unreadCount > 1 ? 's' : ''}
                </Text>
              </View>
            ) : null}
          </View>
          <Pressable style={[styles.closeButton, { backgroundColor: themeColor }]} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={20} color="#fff" />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterContent}
        >
          {filters.map((f) => (
            <Pressable
              key={f}
              style={[styles.filterChip, filter === f ? { backgroundColor: themeColor } : styles.filterChipInactive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f ? styles.filterTextActive : null]}>
                {FILTER_LABELS[f]}
                {f === 'todos' && notifications.length > 0 ? ` (${notifications.length})` : ''}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.legend}>
          <MaterialCommunityIcons name="check-circle-outline" size={13} color="#16a34a" />
          <Text style={styles.legendText}>Marcar como lida</Text>
          <MaterialCommunityIcons name="trash-can-outline" size={13} color="#ef4444" style={styles.legendIcon} />
          <Text style={styles.legendText}>Excluir (reaparecer após 45 dias se persistir)</Text>
        </View>

        {notifications.length > 0 ? (
          <View style={styles.bulkActions}>
            <Pressable style={styles.bulkBtn} onPress={markAllNotificationsRead}>
              <MaterialCommunityIcons name="check-all" size={15} color="#16a34a" />
              <Text style={styles.bulkBtnText}>Marcar todas como lida</Text>
            </Pressable>
            <Pressable style={[styles.bulkBtn, styles.bulkBtnDanger]} onPress={dismissAllNotifications}>
              <MaterialCommunityIcons name="trash-can-outline" size={15} color="#ef4444" />
              <Text style={[styles.bulkBtnText, styles.bulkBtnTextDanger]}>Limpar alertas</Text>
            </Pressable>
          </View>
        ) : null}

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {filtered.length === 0 ? (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="check-circle-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>Nenhum alerta no momento</Text>
            </View>
          ) : filter === 'todos' ? (
            <>
              {renderSection('estoque_baixo')}
              {renderSection('consumo_cliente')}
              {renderSection('conta_receber')}
              {renderSection('conta_pagar')}
            </>
          ) : (
            filtered.map(renderCard)
          )}
        </ScrollView>

      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea:           { flex: 1, backgroundColor: '#f3f4f6' },
  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  headerLeft:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title:              { fontSize: 22, fontWeight: '700', color: '#111827' },
  unreadBadge:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  unreadBadgeText:    { color: '#fff', fontSize: 11, fontWeight: '700' },
  closeButton:        { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  filterRow:          { flexGrow: 0, maxHeight: 48 },
  filterContent:      { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  filterChip:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  filterChipInactive: { backgroundColor: '#e5e7eb' },
  filterText:         { fontSize: 13, fontWeight: '600', color: '#374151' },
  filterTextActive:   { color: '#fff' },
  legend:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 7, gap: 4, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', backgroundColor: '#fff' },
  legendIcon:         { marginLeft: 10 },
  legendText:         { fontSize: 11, color: '#9ca3af' },
  list:               { flex: 1 },
  listContent:        { padding: 16, paddingBottom: 32 },
  section:            { marginBottom: 20 },
  sectionTitle:       { fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  card:               { borderRadius: 10, borderLeftWidth: 4, padding: 12, marginBottom: 8 },
  cardRow:            { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  cardLeft:           { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, flexWrap: 'wrap' },
  cardType:           { fontSize: 11, fontWeight: '700' },
  statusBadge:        { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  statusBadgeText:    { color: '#fff', fontSize: 10, fontWeight: '700' },
  cardActions:        { flexDirection: 'row', alignItems: 'center', gap: 0, marginLeft: 6 },
  actionBtn:          { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  cardMessage:        { fontSize: 14, lineHeight: 20 },
  emptyWrap:          { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyText:          { color: '#9ca3af', fontSize: 16, fontWeight: '600' },
  bulkActions:        { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  bulkBtn:            { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#d1fae5', backgroundColor: '#f0fdf4' },
  bulkBtnDanger:      { borderColor: '#fee2e2', backgroundColor: '#fff5f5' },
  bulkBtnText:        { fontSize: 12, fontWeight: '600', color: '#16a34a' },
  bulkBtnTextDanger:  { color: '#ef4444' },
});
