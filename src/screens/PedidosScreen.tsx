import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { useAppStore } from '../store/AppStore';
import { PurchaseOrder } from '../types/models';

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR');
};

const exportOrderToExcel = async (order: PurchaseOrder) => {
  try {
    const rows = order.itens.map((item) => ({
      Codigo: item.codigo,
      QT: item.quantidade
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pedido');

    const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    const filename = `pedido_${order.data.slice(0, 10)}.xlsx`;
    const fileUri = (FileSystem.cacheDirectory ?? '') + filename;

    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64
    });

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert('Exportacao indisponivel', 'Compartilhamento nao disponivel neste dispositivo.');
      return;
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Exportar pedido',
      UTI: 'com.microsoft.excel.xlsx'
    });
  } catch (error: any) {
    Alert.alert('Erro ao exportar', error?.message ?? 'Erro desconhecido.');
  }
};

export const PedidosScreen = () => {
  const {
    pendingOrderItems,
    purchaseOrders,
    addPurchaseOrderItem,
    updatePurchaseOrderItemQty,
    updatePurchaseOrderItem,
    removePurchaseOrderItem,
    finalizePurchaseOrder,
    deletePurchaseOrder
  } = useAppStore();

  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');
  const [qtdText, setQtdText] = useState('1');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editCodigo, setEditCodigo] = useState('');

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddItem = async () => {
    try {
      const result = await addPurchaseOrderItem(nome, codigo, Number(qtdText) || 1);
      if (!result.ok) {
        Alert.alert('Erro', result.error ?? 'Erro ao adicionar item.');
        return;
      }
      setNome('');
      setCodigo('');
      setQtdText('1');
      setShowForm(false);
    } catch (error: any) {
      Alert.alert('Erro', error?.message ?? 'Erro inesperado.');
    }
  };

  const handleChangeQty = async (id: string, delta: number) => {
    const item = pendingOrderItems.find((i) => i.id === id);
    if (!item) return;
    const newQty = item.quantidade + delta;
    if (newQty <= 0) return;
    try {
      await updatePurchaseOrderItemQty(id, newQty);
    } catch (error: any) {
      Alert.alert('Erro', error?.message ?? 'Erro ao atualizar quantidade.');
    }
  };

  const handleStartEdit = (item: { id: string; nome: string; codigo: string }) => {
    setEditingItemId(item.id);
    setEditNome(item.nome);
    setEditCodigo(item.codigo);
  };

  const handleSaveEdit = async () => {
    if (!editingItemId) return;
    try {
      const result = await updatePurchaseOrderItem(editingItemId, editNome, editCodigo);
      if (!result.ok) {
        Alert.alert('Erro', result.error ?? 'Erro ao salvar.');
        return;
      }
      setEditingItemId(null);
    } catch (error: any) {
      Alert.alert('Erro', error?.message ?? 'Erro inesperado.');
    }
  };

  const handleRemoveItem = (id: string) => {
    Alert.alert('Remover item', 'Deseja remover este item da lista?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          removePurchaseOrderItem(id);
          setSelectedIds((prev) => prev.filter((s) => s !== id));
        }
      }
    ]);
  };

  const handleDeleteOrder = (id: string) => {
    Alert.alert('Excluir pedido', 'Deseja remover este pedido do historico?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => deletePurchaseOrder(id)
      }
    ]);
  };

  const handleFinalize = () => {
    if (!selectedIds.length) {
      Alert.alert('Nenhum item selecionado', 'Selecione ao menos um item para finalizar o pedido.');
      return;
    }
    Alert.alert(
      'Finalizar pedido',
      `Finalizar pedido com ${selectedIds.length} item(s) selecionado(s)?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          onPress: async () => {
            try {
              const result = await finalizePurchaseOrder(selectedIds);
              if (!result.ok) {
                Alert.alert('Erro', result.error ?? 'Erro ao finalizar pedido.');
                return;
              }
              setSelectedIds([]);
              Alert.alert(
                'Pedido finalizado',
                'O pedido foi salvo no historico. Exporte a planilha para enviar ao fornecedor.',
                [{ text: 'OK' }]
              );
            } catch (error: any) {
              Alert.alert('Erro', error?.message ?? 'Erro inesperado.');
            }
          }
        }
      ]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === pendingOrderItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingOrderItems.map((item) => item.id));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Pedidos</Text>
          <Pressable style={styles.addButton} onPress={() => setShowForm((prev) => !prev)}>
            <Text style={styles.addButtonText}>+ Adicionar item</Text>
          </Pressable>
        </View>

        {showForm ? (
          <View style={styles.card}>
            <Text style={styles.formTitle}>Novo item</Text>
            <TextInput
              placeholderTextColor="#9ca3af"
              value={nome}
              onChangeText={setNome}
              placeholder="Nome do item"
              style={styles.input}
            />
            <TextInput
              placeholderTextColor="#9ca3af"
              value={codigo}
              onChangeText={setCodigo}
              placeholder="Codigo"
              style={styles.input}
              autoCapitalize="characters"
            />
            <TextInput
              placeholderTextColor="#9ca3af"
              value={qtdText}
              onChangeText={setQtdText}
              placeholder="Quantidade"
              keyboardType="numeric"
              style={styles.input}
            />
            <View style={styles.actionsRow}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => {
                  setShowForm(false);
                  setNome('');
                  setCodigo('');
                  setQtdText('1');
                }}
              >
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={handleAddItem}>
                <Text style={styles.primaryButtonText}>Salvar item</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.subtitle}>Lista de itens</Text>
            {pendingOrderItems.length > 0 ? (
              <Pressable style={styles.selectAllRow} onPress={selectAll}>
                <View
                  style={[
                    styles.checkbox,
                    selectedIds.length === pendingOrderItems.length
                      ? styles.checkboxChecked
                      : null
                  ]}
                >
                  {selectedIds.length === pendingOrderItems.length ? (
                    <Text style={styles.checkmark}>✓</Text>
                  ) : null}
                </View>
                <Text style={styles.selectAllText}>Selecionar todos</Text>
              </Pressable>
            ) : null}
          </View>

          {pendingOrderItems.length === 0 ? (
            <Text style={styles.emptyText}>
              Nenhum item na lista. Adicione itens para o proximo pedido.
            </Text>
          ) : null}

          {pendingOrderItems.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const isEditing = editingItemId === item.id;
            return (
              <View
                key={item.id}
                style={[
                  styles.itemRow,
                  isSelected && !isEditing ? styles.itemRowSelected : null,
                  isEditing ? styles.itemRowEditing : null
                ]}
              >
                {isEditing ? (
                  <View style={{ flex: 1 }}>
                    <TextInput
                      placeholderTextColor="#9ca3af"
                      value={editNome}
                      onChangeText={setEditNome}
                      placeholder="Nome do item"
                      style={styles.input}
                    />
                    <TextInput
                      placeholderTextColor="#9ca3af"
                      value={editCodigo}
                      onChangeText={setEditCodigo}
                      placeholder="Codigo"
                      style={styles.input}
                      autoCapitalize="characters"
                    />
                    <View style={styles.actionsRow}>
                      <Pressable
                        style={styles.secondaryButton}
                        onPress={() => setEditingItemId(null)}
                      >
                        <Text style={styles.secondaryButtonText}>Cancelar</Text>
                      </Pressable>
                      <Pressable style={styles.primaryButton} onPress={handleSaveEdit}>
                        <Text style={styles.primaryButtonText}>Salvar</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <>
                    <Pressable style={styles.checkboxArea} onPress={() => toggleSelect(item.id)}>
                      <View style={[styles.checkbox, isSelected ? styles.checkboxChecked : null]}>
                        {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
                      </View>
                    </Pressable>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemNome}>{item.nome}</Text>
                      <Text style={styles.itemCodigo}>Cod: {item.codigo}</Text>
                    </View>
                    <View style={styles.qtyControl}>
                      <Pressable
                        style={styles.qtyButton}
                        onPress={() => handleChangeQty(item.id, -1)}
                      >
                        <Text style={styles.qtyButtonText}>−</Text>
                      </Pressable>
                      <Text style={styles.qtyText}>{item.quantidade}</Text>
                      <Pressable
                        style={styles.qtyButton}
                        onPress={() => handleChangeQty(item.id, 1)}
                      >
                        <Text style={styles.qtyButtonText}>+</Text>
                      </Pressable>
                    </View>
                    <Pressable style={styles.editButton} onPress={() => handleStartEdit(item)}>
                      <Text style={styles.editText}>✎</Text>
                    </Pressable>
                    <Pressable style={styles.removeButton} onPress={() => handleRemoveItem(item.id)}>
                      <Text style={styles.removeText}>✕</Text>
                    </Pressable>
                  </>
                )}
              </View>
            );
          })}

          {pendingOrderItems.length > 0 ? (
            <Pressable
              style={[
                styles.finalizeButton,
                selectedIds.length === 0 ? styles.finalizeButtonDisabled : null
              ]}
              onPress={handleFinalize}
              disabled={selectedIds.length === 0}
            >
              <Text style={styles.finalizeButtonText}>
                Finalizar pedido
                {selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {purchaseOrders.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.subtitle}>Historico de pedidos</Text>
            {purchaseOrders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              return (
                <View key={order.id} style={styles.orderBlock}>
                  <View style={styles.orderHeader}>
                    <Pressable
                      style={styles.orderHeaderMain}
                      onPress={() =>
                        setExpandedOrderId(isExpanded ? null : order.id)
                      }
                    >
                      <Text style={styles.orderDate}>{formatDate(order.data)}</Text>
                      <View style={styles.orderHeaderRight}>
                        <Text style={styles.orderItemCount}>
                          {order.itens.length} item(s)
                        </Text>
                        <Text style={styles.expandText}>
                          {isExpanded ? 'Ocultar' : 'Ver'}
                        </Text>
                      </View>
                    </Pressable>
                    <Pressable
                      style={styles.orderDeleteButton}
                      onPress={() => handleDeleteOrder(order.id)}
                    >
                      <Text style={styles.orderDeleteText}>🗑</Text>
                    </Pressable>
                  </View>

                  {isExpanded ? (
                    <View style={styles.orderBody}>
                      {order.itens.map((item) => (
                        <View key={item.id} style={styles.orderItemRow}>
                          <Text style={styles.orderItemCodigo}>{item.codigo}</Text>
                          <Text style={styles.orderItemQty}>QT: {item.quantidade}</Text>
                          <Text style={styles.orderItemNome}>{item.nome}</Text>
                        </View>
                      ))}
                      <Pressable
                        style={styles.exportButton}
                        onPress={() => exportOrderToExcel(order)}
                      >
                        <Text style={styles.exportButtonText}>Exportar planilha (.xlsx)</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}
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
  addButton: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    marginBottom: 12
  },
  formTitle: {
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
    color: '#111827'
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
    backgroundColor: '#0f766e',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700'
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827'
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  selectAllText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 13
  },
  emptyText: {
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 8
  },
  itemRowSelected: {
    backgroundColor: '#f0fdf4'
  },
  checkboxArea: {
    padding: 2
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxChecked: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e'
  },
  checkmark: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13
  },
  itemInfo: {
    flex: 1
  },
  itemNome: {
    color: '#111827',
    fontWeight: '600'
  },
  itemCodigo: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 2
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb'
  },
  qtyButtonText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 16
  },
  qtyText: {
    minWidth: 24,
    textAlign: 'center',
    fontWeight: '700',
    color: '#111827'
  },
  itemRowEditing: {
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingVertical: 10
  },
  editButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  editText: {
    color: '#1d4ed8',
    fontWeight: '700',
    fontSize: 15
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center'
  },
  removeText: {
    color: '#b91c1c',
    fontWeight: '700',
    fontSize: 13
  },
  finalizeButton: {
    marginTop: 12,
    backgroundColor: '#be123c',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center'
  },
  finalizeButtonDisabled: {
    backgroundColor: '#d1d5db'
  },
  finalizeButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15
  },
  orderBlock: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginTop: 8,
    paddingTop: 8
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  orderHeaderMain: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  orderDeleteButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center'
  },
  orderDeleteText: {
    fontSize: 16
  },
  orderDate: {
    fontWeight: '700',
    color: '#111827',
    fontSize: 15
  },
  orderHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  orderItemCount: {
    color: '#6b7280',
    fontSize: 13
  },
  expandText: {
    color: '#2563eb',
    fontWeight: '600'
  },
  orderBody: {
    marginTop: 8,
    paddingLeft: 4
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 10
  },
  orderItemCodigo: {
    fontWeight: '700',
    color: '#111827',
    minWidth: 80
  },
  orderItemQty: {
    color: '#0f766e',
    fontWeight: '600',
    minWidth: 50
  },
  orderItemNome: {
    flex: 1,
    color: '#6b7280',
    fontSize: 13
  },
  exportButton: {
    marginTop: 12,
    backgroundColor: '#1d4ed8',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center'
  },
  exportButtonText: {
    color: '#fff',
    fontWeight: '700'
  }
});
