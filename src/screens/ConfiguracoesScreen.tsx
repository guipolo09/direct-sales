import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppSettings, ThemeName } from '../types/models';
import { useAppStore } from '../store/AppStore';

const THEMES: { id: ThemeName; label: string; color: string }[] = [
  { id: 'rose',   label: 'Rosa',    color: '#be123c' },
  { id: 'blue',   label: 'Azul',    color: '#1d4ed8' },
  { id: 'purple', label: 'Roxo',    color: '#7e22ce' },
  { id: 'green',  label: 'Verde',   color: '#15803d' },
  { id: 'orange', label: 'Laranja', color: '#c2410c' },
  { id: 'slate',  label: 'Cinza',   color: '#334155' },
];

const ANTECEDENCIA_OPTIONS = [
  { label: 'Imediato', value: 0 },
  { label: '1 dia',    value: 1 },
  { label: '3 dias',   value: 3 },
  { label: '7 dias',   value: 7 },
  { label: '15 dias',  value: 15 },
  { label: '30 dias',  value: 30 },
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export const ConfiguracoesScreen = ({ visible, onClose }: Props) => {
  const { settings, updateSettings, themeColor } = useAppStore();
  const [draft, setDraft] = useState<AppSettings>(settings);

  const handleOpen = () => setDraft(settings);

  const handleSave = async () => {
    await updateSettings(draft);
    onClose();
  };

  const setTema = (tema: ThemeName) => setDraft((prev) => ({ ...prev, tema }));

  const setNotif = (
    key: keyof AppSettings['notificacoes'],
    field: 'ativo' | 'antecedenciaDias',
    value: boolean | number
  ) =>
    setDraft((prev) => ({
      ...prev,
      notificacoes: {
        ...prev.notificacoes,
        [key]: { ...prev.notificacoes[key], [field]: value },
      },
    }));

  const renderAntecedencia = (
    key: keyof AppSettings['notificacoes'],
    currentValue: number,
    options: typeof ANTECEDENCIA_OPTIONS
  ) => (
    <View style={styles.antecedenciaRow}>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          style={[
            styles.antecedenciaChip,
            currentValue === opt.value ? { backgroundColor: themeColor, borderColor: themeColor } : null,
          ]}
          onPress={() => setNotif(key, 'antecedenciaDias', opt.value)}
        >
          <Text style={[styles.antecedenciaText, currentValue === opt.value ? styles.antecedenciaTextActive : null]}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const notifSections: {
    key: keyof AppSettings['notificacoes'];
    label: string;
    icon: string;
    showAntecedencia: boolean;
    options?: typeof ANTECEDENCIA_OPTIONS;
  }[] = [
    {
      key: 'estoqueBaixo',
      label: 'Estoque baixo',
      icon: 'package-variant',
      showAntecedencia: false,
    },
    {
      key: 'consumoCliente',
      label: 'Produto do cliente terminando',
      icon: 'account-clock',
      showAntecedencia: true,
      options: ANTECEDENCIA_OPTIONS.filter((o) => o.value > 0),
    },
    {
      key: 'contaReceber',
      label: 'Contas a receber',
      icon: 'cash-plus',
      showAntecedencia: true,
      options: ANTECEDENCIA_OPTIONS,
    },
    {
      key: 'contaPagar',
      label: 'Contas a pagar',
      icon: 'cash-minus',
      showAntecedencia: true,
      options: ANTECEDENCIA_OPTIONS,
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onShow={handleOpen}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Configurações</Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={20} color="#374151" />
          </Pressable>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

          {/* ── Tema de cores ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tema de Cores</Text>
            <View style={styles.themeGrid}>
              {THEMES.map((t) => (
                <Pressable
                  key={t.id}
                  style={[
                    styles.themeChip,
                    draft.tema === t.id ? [styles.themeChipSelected, { borderColor: t.color }] : null,
                  ]}
                  onPress={() => setTema(t.id)}
                >
                  <View style={[styles.themeColor, { backgroundColor: t.color }]} />
                  <Text style={styles.themeLabel}>{t.label}</Text>
                  {draft.tema === t.id ? (
                    <MaterialCommunityIcons name="check" size={14} color={t.color} />
                  ) : null}
                </Pressable>
              ))}
            </View>
          </View>

          {/* ── Notificações ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notificações</Text>
            {notifSections.map((sec) => (
              <View key={sec.key} style={styles.notifCard}>
                <View style={styles.notifHeader}>
                  <MaterialCommunityIcons name={sec.icon as any} size={18} color="#374151" />
                  <Text style={styles.notifLabel}>{sec.label}</Text>
                  <Switch
                    value={draft.notificacoes[sec.key].ativo}
                    onValueChange={(v) => setNotif(sec.key, 'ativo', v)}
                    trackColor={{ true: themeColor, false: '#d1d5db' }}
                    thumbColor="#fff"
                  />
                </View>
                {sec.showAntecedencia && draft.notificacoes[sec.key].ativo ? (
                  <View style={styles.antecedenciaWrap}>
                    <Text style={styles.antecedenciaLabel}>Avisar com antecedência de:</Text>
                    {renderAntecedencia(
                      sec.key,
                      draft.notificacoes[sec.key].antecedenciaDias,
                      sec.options ?? ANTECEDENCIA_OPTIONS
                    )}
                  </View>
                ) : null}
              </View>
            ))}
          </View>

        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
          <Pressable style={[styles.saveButton, { backgroundColor: themeColor }]} onPress={handleSave}>
            <Text style={styles.saveText}>Salvar Configurações</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea:              { flex: 1, backgroundColor: '#f3f4f6' },
  header:                { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  title:                 { fontSize: 22, fontWeight: '700', color: '#111827' },
  closeButton:           { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5e7eb' },
  scroll:                { flex: 1 },
  scrollContent:         { padding: 16, paddingBottom: 24 },
  section:               { marginBottom: 24 },
  sectionTitle:          { fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  themeGrid:             { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  themeChip:             { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#fff' },
  themeChipSelected:     { borderWidth: 2, backgroundColor: '#fff' },
  themeColor:            { width: 16, height: 16, borderRadius: 8 },
  themeLabel:            { fontSize: 13, fontWeight: '600', color: '#374151' },
  notifCard:             { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', padding: 12, marginBottom: 10 },
  notifHeader:           { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notifLabel:            { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' },
  antecedenciaWrap:      { marginTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
  antecedenciaLabel:     { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  antecedenciaRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  antecedenciaChip:      { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#f9fafb' },
  antecedenciaText:      { fontSize: 12, fontWeight: '600', color: '#374151' },
  antecedenciaTextActive:{ color: '#fff' },
  footer:                { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#fff' },
  cancelButton:          { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  cancelText:            { fontWeight: '600', color: '#374151' },
  saveButton:            { flex: 2, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  saveText:              { fontWeight: '700', color: '#fff', fontSize: 15 },
});
