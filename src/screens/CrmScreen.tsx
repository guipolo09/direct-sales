import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../store/AppStore';
import { formatCurrency, formatDate } from '../utils/format';

const statusColor = {
  novo: '#1d4ed8',
  recorrente: '#166534',
  inativo: '#991b1b'
};

export const CrmScreen = () => {
  const { customers, sales, products, addCustomer, removeCustomer } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [status, setStatus] = useState<'novo' | 'recorrente' | 'inativo'>('novo');
  const [expandedSales, setExpandedSales] = useState<string[]>([]);

  const salesByCustomer = useMemo(() => {
    const map = new Map<string, typeof sales>();

    customers.forEach((customer) => {
      map.set(
        customer.id,
        sales
          .filter((sale) => sale.customerId === customer.id)
          .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      );
    });

    return map;
  }, [customers, sales]);

  const toggleSale = (saleId: string) => {
    setExpandedSales((prev) =>
      prev.includes(saleId) ? prev.filter((item) => item !== saleId) : [...prev, saleId]
    );
  };

  const handleAddCustomer = () => {
    const result = addCustomer({ nome, telefone, status });
    if (!result.ok) {
      Alert.alert('Nao foi possivel cadastrar', result.error ?? 'Erro desconhecido.');
      return;
    }

    setNome('');
    setTelefone('');
    setStatus('novo');
    Alert.alert('Cliente cadastrado', 'Cliente adicionado com sucesso.');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title}>CRM e Clientes</Text>
          <Pressable style={styles.addButton} onPress={() => setShowForm((prev) => !prev)}>
            <Text style={styles.addButtonText}>+ Cliente</Text>
          </Pressable>
        </View>

        {showForm ? (
          <View style={styles.card}>
            <Text style={styles.formTitle}>Cadastrar cliente</Text>
            <TextInput value={nome} onChangeText={setNome} placeholder="Nome do cliente" style={styles.input} />
            <TextInput
              value={telefone}
              onChangeText={setTelefone}
              placeholder="Telefone"
              keyboardType="phone-pad"
              style={styles.input}
            />
            <Text style={styles.label}>Status</Text>
            <View style={styles.row}>
              <Pressable
                style={[styles.choice, status === 'novo' ? styles.choiceActive : null]}
                onPress={() => setStatus('novo')}
              >
                <Text style={styles.choiceText}>Novo</Text>
              </Pressable>
              <Pressable
                style={[styles.choice, status === 'recorrente' ? styles.choiceActive : null]}
                onPress={() => setStatus('recorrente')}
              >
                <Text style={styles.choiceText}>Recorrente</Text>
              </Pressable>
              <Pressable
                style={[styles.choice, status === 'inativo' ? styles.choiceActive : null]}
                onPress={() => setStatus('inativo')}
              >
                <Text style={styles.choiceText}>Inativo</Text>
              </Pressable>
            </View>
            <Pressable style={styles.button} onPress={handleAddCustomer}>
              <Text style={styles.buttonText}>Cadastrar cliente</Text>
            </Pressable>
          </View>
        ) : null}

        {customers.map((customer) => {
          const customerSales = salesByCustomer.get(customer.id) ?? [];
          const totalSales = customerSales.reduce((acc, sale) => acc + sale.total, 0);

          return (
            <View key={customer.id} style={styles.card}>
              <Text style={styles.name}>{customer.nome}</Text>
              <Text style={styles.info}>Telefone: {customer.telefone}</Text>
              <Text style={[styles.status, { color: statusColor[customer.status] }]}>Status: {customer.status}</Text>
              <Text style={styles.info}>Total comprado: {formatCurrency(totalSales)}</Text>

              <Text style={styles.historyTitle}>Historico de compras</Text>
              {customerSales.map((sale) => {
                const expanded = expandedSales.includes(sale.id);
                return (
                  <View key={sale.id} style={styles.saleItem}>
                    <Pressable style={styles.saleHeader} onPress={() => toggleSale(sale.id)}>
                      <Text style={styles.saleDate}>{formatDate(sale.data)}</Text>
                      <Text style={styles.saleValue}>{formatCurrency(sale.total)}</Text>
                    </Pressable>

                    {expanded ? (
                      <View style={styles.saleDetails}>
                        {sale.itens.map((item, index) => {
                          const productName =
                            products.find((product) => product.id === item.productId)?.nome ?? 'Produto';
                          return (
                            <Text key={`${sale.id}-${item.productId}-${index}`} style={styles.saleDetailText}>
                              - {productName} x{item.quantidade}
                            </Text>
                          );
                        })}
                      </View>
                    ) : null}
                  </View>
                );
              })}
              {customerSales.length === 0 ? <Text style={styles.emptyHistory}>Sem compras registradas.</Text> : null}

              <Pressable
                style={styles.deleteButton}
                onPress={() =>
                  Alert.alert('Excluir cliente', `Deseja realmente excluir "${customer.nome}"?`, [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Excluir', style: 'destructive', onPress: () => removeCustomer(customer.id) }
                  ])
                }
              >
                <Text style={styles.deleteButtonText}>Excluir cliente</Text>
              </Pressable>
            </View>
          );
        })}
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    color: '#111827'
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14
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
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    marginBottom: 12
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
  label: {
    color: '#6b7280',
    marginBottom: 6
  },
  row: {
    flexDirection: 'row',
    gap: 8
  },
  choice: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center'
  },
  choiceActive: {
    borderColor: '#1d4ed8',
    backgroundColor: '#dbeafe'
  },
  choiceText: {
    color: '#111827',
    fontWeight: '600'
  },
  button: {
    marginTop: 10,
    backgroundColor: '#1f2937',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600'
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6
  },
  info: {
    color: '#374151',
    marginBottom: 5
  },
  status: {
    fontWeight: '700',
    marginBottom: 5,
    textTransform: 'capitalize'
  },
  historyTitle: {
    marginTop: 8,
    marginBottom: 6,
    color: '#111827',
    fontWeight: '700'
  },
  saleItem: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 8,
    marginTop: 8
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  saleDate: {
    color: '#4b5563'
  },
  saleValue: {
    color: '#111827',
    fontWeight: '700'
  },
  saleDetails: {
    marginTop: 6
  },
  saleDetailText: {
    color: '#374151',
    marginBottom: 4
  },
  emptyHistory: {
    color: '#6b7280',
    marginTop: 6
  },
  deleteButton: {
    marginTop: 12,
    backgroundColor: '#991b1b',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center'
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600'
  }
});
