import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../store/AppStore';
import { addMonths, formatCurrency, formatDate, formatMonthYear, isSameMonthYear } from '../utils/format';

const toDateInput = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const FinanceiroScreen = () => {
  const {
    receivables,
    payables,
    customers,
    markReceivablePaid,
    markPayablePaid,
    addManualPayable,
    updatePayable,
    removeReceivable,
    removePayable
  } = useAppStore();

  const [showForm, setShowForm] = useState(false);
  const [tipo, setTipo] = useState<'boleto' | 'imposto' | 'conta_fixa'>('boleto');
  const [referencia, setReferencia] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [vencimentoDate, setVencimentoDate] = useState(new Date());
  const [showCreateDatePicker, setShowCreateDatePicker] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFornecedor, setEditFornecedor] = useState('');
  const [editDescricao, setEditDescricao] = useState('');
  const [editValor, setEditValor] = useState('');
  const [editVencimentoDate, setEditVencimentoDate] = useState(new Date());
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [activeSection, setActiveSection] = useState<'receber' | 'pagar'>('receber');

  const filteredReceivables = receivables.filter((item) => isSameMonthYear(item.vencimento, selectedMonth));
  const filteredPayables = payables.filter((item) => isSameMonthYear(item.vencimento, selectedMonth));

  const pendingReceivables = filteredReceivables.filter((item) => item.status !== 'paga');
  const pendingPayables = filteredPayables.filter((item) => item.status !== 'paga');

  const findCustomer = (id: string) => customers.find((item) => item.id === id)?.nome ?? 'Cliente';

  const onCreateDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowCreateDatePicker(false);
    }
    if (selectedDate) {
      setVencimentoDate(selectedDate);
    }
  };

  const onEditDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEditDatePicker(false);
    }
    if (selectedDate) {
      setEditVencimentoDate(selectedDate);
    }
  };

  const handleSavePayable = async () => {
    try {
      const result = await addManualPayable({
        tipo,
        referencia,
        descricao,
        valor: Number(valor) || 0,
        vencimento: toDateInput(vencimentoDate)
      });

      if (!result.ok) {
        Alert.alert('Nao foi possivel cadastrar', result.error ?? 'Erro desconhecido.');
        return;
      }

      setReferencia('');
      setDescricao('');
      setValor('');
      setVencimentoDate(new Date());
      setTipo('boleto');
      setShowForm(false);
      Alert.alert('Conta cadastrada', 'Conta a pagar adicionada com sucesso.');
    } catch (error: any) {
      Alert.alert('Erro', error?.message ?? 'Erro inesperado ao cadastrar conta.');
    }
  };

  const startEdit = (id: string) => {
    const payable = payables.find((item) => item.id === id);
    if (!payable || payable.status === 'paga') {
      return;
    }

    setEditingId(id);
    setEditFornecedor(payable.fornecedor);
    setEditDescricao(payable.descricao);
    setEditValor(String(payable.valor));
    setEditVencimentoDate(new Date(payable.vencimento));
    setShowEditDatePicker(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowEditDatePicker(false);
  };

  const saveEdit = async () => {
    if (!editingId) {
      return;
    }

    try {
      const result = await updatePayable({
        id: editingId,
        fornecedor: editFornecedor,
        descricao: editDescricao,
        valor: Number(editValor) || 0,
        vencimento: toDateInput(editVencimentoDate)
      });

      if (!result.ok) {
        Alert.alert('Nao foi possivel atualizar', result.error ?? 'Erro desconhecido.');
        return;
      }

      setEditingId(null);
      setShowEditDatePicker(false);
      Alert.alert('Conta atualizada', 'Dados da conta a pagar atualizados.');
    } catch (error: any) {
      Alert.alert('Erro', error?.message ?? 'Erro inesperado ao atualizar conta.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Financeiro</Text>
          <Pressable style={styles.cadastrarButton} onPress={() => setShowForm((prev) => !prev)}>
            <Text style={styles.cadastrarText}>+ Cadastrar conta</Text>
          </Pressable>
        </View>

        <View style={styles.monthCard}>
          <Pressable style={styles.monthArrow} onPress={() => setSelectedMonth((prev) => addMonths(prev, -1))}>
            <Text style={styles.monthArrowText}>{'<'}</Text>
          </Pressable>
          <Text style={styles.monthTitle}>{formatMonthYear(selectedMonth)}</Text>
          <Pressable style={styles.monthArrow} onPress={() => setSelectedMonth((prev) => addMonths(prev, 1))}>
            <Text style={styles.monthArrowText}>{'>'}</Text>
          </Pressable>
        </View>

        <View style={styles.segmentWrap}>
          <Pressable
            style={[styles.segmentButton, activeSection === 'pagar' ? styles.segmentButtonActive : null]}
            onPress={() => setActiveSection('pagar')}
          >
            <Text style={[styles.segmentText, activeSection === 'pagar' ? styles.segmentTextActive : null]}>
              Contas a pagar
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segmentButton, activeSection === 'receber' ? styles.segmentButtonActive : null]}
            onPress={() => setActiveSection('receber')}
          >
            <Text style={[styles.segmentText, activeSection === 'receber' ? styles.segmentTextActive : null]}>
              Contas a receber
            </Text>
          </Pressable>
        </View>

        {showForm ? (
          <View style={styles.card}>
            <Text style={styles.subtitle}>Nova conta a pagar</Text>

            <Text style={styles.label}>Tipo</Text>
            <View style={styles.row}>
              <Pressable
                style={[styles.choice, tipo === 'boleto' ? styles.choiceActive : null]}
                onPress={() => setTipo('boleto')}
              >
                <Text style={styles.choiceText}>Boleto</Text>
              </Pressable>
              <Pressable
                style={[styles.choice, tipo === 'imposto' ? styles.choiceActive : null]}
                onPress={() => setTipo('imposto')}
              >
                <Text style={styles.choiceText}>Imposto</Text>
              </Pressable>
              <Pressable
                style={[styles.choice, tipo === 'conta_fixa' ? styles.choiceActive : null]}
                onPress={() => setTipo('conta_fixa')}
              >
                <Text style={styles.choiceText}>Conta fixa</Text>
              </Pressable>
            </View>

            <TextInput placeholderTextColor="#9ca3af"
              value={referencia}
              onChangeText={setReferencia}
              placeholder="Referencia (ex: Energia, DAS, Aluguel)"
              style={styles.input}
            />
            <TextInput placeholderTextColor="#9ca3af"
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Descricao da conta"
              style={styles.input}
            />
            <TextInput placeholderTextColor="#9ca3af"
              value={valor}
              onChangeText={setValor}
              placeholder="Valor"
              keyboardType="numeric"
              style={styles.input}
            />

            <Text style={styles.label}>Vencimento</Text>
            <Pressable style={styles.dateButton} onPress={() => setShowCreateDatePicker(true)}>
              <Text style={styles.dateButtonText}>{formatDate(vencimentoDate.toISOString())}</Text>
            </Pressable>
            {showCreateDatePicker ? (
              <DateTimePicker
                value={vencimentoDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onCreateDateChange}
              />
            ) : null}

            <View style={styles.actionsRow}>
              <Pressable style={styles.secondaryButton} onPress={() => setShowForm(false)}>
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={handleSavePayable}>
                <Text style={styles.primaryButtonText}>Salvar conta</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {activeSection === 'receber' ? (
          <View style={styles.card}>
            <Text style={styles.subtitle}>Contas a receber</Text>
            {filteredReceivables.map((item) => (
              <View key={item.id} style={styles.rowItem}>
                <Text style={styles.itemText}>
                  {findCustomer(item.customerId)} | {formatCurrency(item.valor)} | {formatDate(item.vencimento)}
                </Text>
                <Text style={[styles.status, item.status === 'paga' ? styles.paid : styles.pending]}>{item.status}</Text>
                {item.status !== 'paga' ? (
                  <View style={styles.actionsRow}>
                    <Pressable style={styles.actionButtonInline} onPress={() => markReceivablePaid(item.id)}>
                      <Text style={styles.actionText}>Receber</Text>
                    </Pressable>
                    <Pressable
                      style={styles.deleteButtonInline}
                      onPress={() =>
                        Alert.alert('Excluir conta', 'Deseja excluir esta conta a receber?', [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Excluir', style: 'destructive', onPress: () => removeReceivable(item.id) }
                        ])
                      }
                    >
                      <Text style={styles.deleteText}>Excluir</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ))}
            {filteredReceivables.length === 0 ? <Text style={styles.itemText}>Sem contas a receber neste mes.</Text> : null}
          </View>
        ) : null}

        {activeSection === 'pagar' ? (
          <View style={styles.card}>
            <Text style={styles.subtitle}>Contas a pagar</Text>
            {filteredPayables.map((item) => (
              <View key={item.id} style={styles.rowItem}>
                {editingId === item.id ? (
                  <View>
                    <TextInput placeholderTextColor="#9ca3af" value={editFornecedor} onChangeText={setEditFornecedor} style={styles.input} placeholder="Referencia" />
                    <TextInput placeholderTextColor="#9ca3af" value={editDescricao} onChangeText={setEditDescricao} style={styles.input} placeholder="Descricao" />
                    <TextInput placeholderTextColor="#9ca3af" value={editValor} onChangeText={setEditValor} style={styles.input} placeholder="Valor" keyboardType="numeric" />

                    <Text style={styles.label}>Vencimento</Text>
                    <Pressable style={styles.dateButton} onPress={() => setShowEditDatePicker(true)}>
                      <Text style={styles.dateButtonText}>{formatDate(editVencimentoDate.toISOString())}</Text>
                    </Pressable>
                    {showEditDatePicker ? (
                      <DateTimePicker
                        value={editVencimentoDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onEditDateChange}
                      />
                    ) : null}

                    <View style={styles.actionsRow}>
                      <Pressable style={styles.secondaryButton} onPress={cancelEdit}>
                        <Text style={styles.secondaryButtonText}>Cancelar</Text>
                      </Pressable>
                      <Pressable style={styles.primaryButton} onPress={saveEdit}>
                        <Text style={styles.primaryButtonText}>Salvar</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View>
                    <Text style={styles.itemText}>
                      {item.fornecedor} | {formatCurrency(item.valor)} | {formatDate(item.vencimento)}
                    </Text>
                    <Text style={[styles.status, item.status === 'paga' ? styles.paid : styles.pending]}>{item.status}</Text>
                    {item.status !== 'paga' ? (
                      <View style={styles.actionsRow}>
                        <Pressable style={styles.secondaryButton} onPress={() => startEdit(item.id)}>
                          <Text style={styles.secondaryButtonText}>Editar</Text>
                        </Pressable>
                        <Pressable style={styles.actionButtonInline} onPress={() => markPayablePaid(item.id)}>
                          <Text style={styles.actionText}>Pagar</Text>
                        </Pressable>
                        <Pressable
                          style={styles.deleteButtonInline}
                          onPress={() =>
                            Alert.alert('Excluir conta', 'Deseja excluir esta conta a pagar?', [
                              { text: 'Cancelar', style: 'cancel' },
                              { text: 'Excluir', style: 'destructive', onPress: () => removePayable(item.id) }
                            ])
                          }
                        >
                          <Text style={styles.deleteText}>Excluir</Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                )}
              </View>
            ))}
            {filteredPayables.length === 0 ? <Text style={styles.itemText}>Sem contas a pagar neste mes.</Text> : null}
          </View>
        ) : null}

        <View style={styles.summary}>
          <Text style={styles.summaryText}>Pendentes para receber: {pendingReceivables.length}</Text>
          <Text style={styles.summaryText}>Pendentes para pagar: {pendingPayables.length}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 14
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827'
  },
  cadastrarButton: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  cadastrarText: {
    color: '#fff',
    fontWeight: '700'
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
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center'
  },
  monthArrowText: {
    color: '#111827',
    fontWeight: '700'
  },
  monthTitle: {
    color: '#111827',
    fontWeight: '700',
    textTransform: 'capitalize'
  },
  segmentWrap: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
    gap: 4
  },
  segmentButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center'
  },
  segmentButtonActive: {
    backgroundColor: '#111827'
  },
  segmentText: {
    color: '#374151',
    fontWeight: '600'
  },
  segmentTextActive: {
    color: '#fff'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    marginBottom: 12
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827'
  },
  label: {
    color: '#6b7280',
    marginBottom: 6,
    marginTop: 6
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8
  },
  choice: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center'
  },
  choiceActive: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e'
  },
  choiceText: {
    color: '#111827',
    fontWeight: '600'
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    backgroundColor: '#fff'
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    marginBottom: 8
  },
  dateButtonText: {
    color: '#111827',
    fontWeight: '600'
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: '#374151',
    fontWeight: '600'
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700'
  },
  rowItem: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
    marginTop: 10
  },
  itemText: {
    color: '#374151'
  },
  status: {
    marginTop: 5,
    fontWeight: '700',
    textTransform: 'capitalize'
  },
  paid: {
    color: '#166534'
  },
  pending: {
    color: '#92400e'
  },
  actionButton: {
    marginTop: 8,
    backgroundColor: '#1d4ed8',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 8
  },
  actionButtonInline: {
    flex: 1,
    backgroundColor: '#1d4ed8',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 10
  },
  actionText: {
    color: '#fff',
    fontWeight: '600'
  },
  summary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14
  },
  summaryText: {
    color: '#111827',
    marginBottom: 6,
    fontWeight: '600'
  },
  deleteButtonInline: {
    flex: 1,
    backgroundColor: '#991b1b',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 10
  },
  deleteText: {
    color: '#fff',
    fontWeight: '600'
  }
});
