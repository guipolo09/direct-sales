import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../store/AppStore';
import { addMonths, formatCurrency, formatMonthYear, isSameMonthYear } from '../utils/format';

const toDateInput = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const VendasScreen = () => {
  const { customers, products, registerSale, sales, getProductStock, addCustomer } = useAppStore();

  const [showForm, setShowForm] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showCustomers, setShowCustomers] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [showQuickCustomerInput, setShowQuickCustomerInput] = useState(false);
  const [quickCustomerName, setQuickCustomerName] = useState('');
  const [quickCustomerPhone, setQuickCustomerPhone] = useState('');
  const [saleItems, setSaleItems] = useState<Array<{ productId: string; quantidade: number }>>([]);
  const [qtyText, setQtyText] = useState('1');
  const [formaPagamento, setFormaPagamento] = useState<'avista' | 'prazo'>('avista');

  const [parcelasPrazo, setParcelasPrazo] = useState<1 | 3 | 4 | 6>(1);
  const [entradaText, setEntradaText] = useState('0');
  const [singleDueDate, setSingleDueDate] = useState(new Date());
  const [showSingleDatePicker, setShowSingleDatePicker] = useState(false);
  const [dueDayText, setDueDayText] = useState('');

  const [selectedSalesMonth, setSelectedSalesMonth] = useState(new Date());

  useEffect(() => {
    if (selectedCustomerId && !customers.some((item) => item.id === selectedCustomerId)) {
      setSelectedCustomerId(null);
    }
  }, [customers, selectedCustomerId]);

  useEffect(() => {
    if (selectedProductId && !products.some((item) => item.id === selectedProductId)) {
      setSelectedProductId(null);
    }
  }, [products, selectedProductId]);

  const customer = customers.find((item) => item.id === selectedCustomerId);
  const product = products.find((item) => item.id === selectedProductId);
  const qty = Number(qtyText) || 0;

  const previewTotal = useMemo(() => {
    if (!product || qty <= 0) {
      return 0;
    }
    return product.precoVenda * qty;
  }, [product, qty]);

  const orderTotal = useMemo(() => {
    return saleItems.reduce((acc, item) => {
      const saleProduct = products.find((productItem) => productItem.id === item.productId);
      if (!saleProduct) {
        return acc;
      }
      return acc + saleProduct.precoVenda * item.quantidade;
    }, 0);
  }, [saleItems, products]);

  const filteredSales = useMemo(
    () => sales.filter((sale) => isSameMonthYear(sale.data, selectedSalesMonth)),
    [sales, selectedSalesMonth]
  );

  const resetForm = () => {
    setSelectedCustomerId(null);
    setSelectedProductId(null);
    setShowCustomers(false);
    setShowProducts(false);
    setShowQuickCustomerInput(false);
    setQuickCustomerName('');
    setQuickCustomerPhone('');
    setSaleItems([]);
    setQtyText('1');
    setFormaPagamento('avista');
    setParcelasPrazo(1);
    setEntradaText('0');
    setSingleDueDate(new Date());
    setShowSingleDatePicker(false);
    setDueDayText('');
  };

  const onSingleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowSingleDatePicker(false);
    }
    if (selectedDate) {
      setSingleDueDate(selectedDate);
    }
  };

  const handleQuickAddCustomer = () => {
    const result = addCustomer({
      nome: quickCustomerName,
      telefone: quickCustomerPhone,
      status: 'novo'
    });

    if (!result.ok) {
      Alert.alert('Nao foi possivel cadastrar cliente', result.error ?? 'Erro desconhecido.');
      return;
    }

    setSelectedCustomerId(result.id ?? null);
    setQuickCustomerName('');
    setQuickCustomerPhone('');
    setShowQuickCustomerInput(false);
    Alert.alert('Cliente cadastrado', 'Cliente criado e pronto para selecao.');
  };

  const handleRegister = () => {
    if (!customer) {
      Alert.alert('Sem cliente', 'Selecione ou cadastre um cliente para registrar a venda.');
      return;
    }

    if (saleItems.length === 0) {
      Alert.alert('Sem itens', 'Adicione ao menos um produto na venda.');
      return;
    }

    const result = registerSale({
      customerId: customer.id,
      itens: saleItems,
      formaPagamento,
      prazoConfig:
        formaPagamento === 'prazo'
          ? {
              parcelas: parcelasPrazo,
              entrada: Number(entradaText) || 0,
              primeiraData: parcelasPrazo === 1 ? toDateInput(singleDueDate) : undefined,
              diaVencimento: parcelasPrazo > 1 ? Number(dueDayText) || 0 : undefined
            }
          : undefined
    });

    if (!result.ok) {
      Alert.alert('Nao foi possivel registrar venda', result.error ?? 'Erro desconhecido.');
      return;
    }

    Alert.alert('Venda registrada', 'Estoque atualizado com sucesso.');
    resetForm();
    setShowForm(false);
  };

  const addItemToSale = () => {
    if (!product) {
      Alert.alert('Sem produto', 'Selecione um produto para adicionar.');
      return;
    }

    if (qty <= 0) {
      Alert.alert('Quantidade invalida', 'Informe quantidade maior que zero.');
      return;
    }

    setSaleItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantidade: item.quantidade + qty } : item
        );
      }
      return [...prev, { productId: product.id, quantidade: qty }];
    });

    setQtyText('1');
  };

  const removeItemFromSale = (productId: string) => {
    setSaleItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const changeSaleItemQuantity = (productId: string, delta: number) => {
    setSaleItems((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantidade: item.quantidade + delta }
            : item
        )
        .filter((item) => item.quantidade > 0)
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Registro de Vendas</Text>
          <Pressable
            style={styles.addButton}
            onPress={() => {
              setShowForm((prev) => !prev);
              if (showForm) {
                resetForm();
              }
            }}
          >
            <Text style={styles.addButtonText}>Vender +</Text>
          </Pressable>
        </View>

        {showForm ? (
          <View style={styles.card}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Cliente</Text>
              <Pressable style={styles.plusInlineButton} onPress={() => setShowQuickCustomerInput((prev) => !prev)}>
                <Text style={styles.plusInlineText}>+</Text>
              </Pressable>
            </View>
            <Pressable
              style={styles.selectInput}
              onPress={() => {
                setShowCustomers((prev) => !prev);
                setShowProducts(false);
              }}
            >
              <Text style={styles.selectInputText}>{customer?.nome ?? 'Selecione cliente'}</Text>
            </Pressable>
            {showCustomers ? (
              <View style={styles.optionsBox}>
                {customers.length === 0 ? <Text style={styles.small}>Nenhum cliente cadastrado ainda.</Text> : null}
                {customers.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[styles.option, selectedCustomerId === item.id ? styles.optionSelected : null]}
                    onPress={() => {
                      setSelectedCustomerId(item.id);
                      setShowCustomers(false);
                    }}
                  >
                    <Text style={styles.optionText}>{item.nome}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            {showQuickCustomerInput ? (
              <View style={styles.quickBox}>
                <TextInput
                  value={quickCustomerName}
                  onChangeText={setQuickCustomerName}
                  placeholder="Nome do cliente"
                  style={styles.input}
                />
                <TextInput
                  value={quickCustomerPhone}
                  onChangeText={setQuickCustomerPhone}
                  placeholder="Telefone"
                  style={styles.input}
                  keyboardType="phone-pad"
                />
                <Pressable style={styles.quickSaveButton} onPress={handleQuickAddCustomer}>
                  <Text style={styles.quickSaveText}>Salvar cliente</Text>
                </Pressable>
              </View>
            ) : null}

            <Text style={styles.label}>Produto</Text>
            <Pressable
              style={styles.selectInput}
              onPress={() => {
                setShowProducts((prev) => !prev);
                setShowCustomers(false);
              }}
            >
              <Text style={styles.selectInputText}>{product?.nome ?? 'Selecione produto'}</Text>
            </Pressable>
            {showProducts ? (
              <View style={styles.optionsBox}>
                {products.length === 0 ? <Text style={styles.small}>Cadastre produtos na aba Estoque.</Text> : null}
                {products.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[styles.option, selectedProductId === item.id ? styles.optionSelected : null]}
                    onPress={() => {
                      setSelectedProductId(item.id);
                      setShowProducts(false);
                    }}
                  >
                    <Text style={styles.optionText}>{item.nome} ({item.tipo})</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <Text style={styles.small}>Tipo: {product?.tipo ?? '-'}</Text>
            <Text style={styles.small}>Estoque atual: {product ? getProductStock(product.id) : 0}</Text>

            <Text style={styles.label}>Quantidade</Text>
            <TextInput
              value={qtyText}
              onChangeText={setQtyText}
              style={styles.input}
              keyboardType="numeric"
              placeholder="1"
            />
            <Pressable style={styles.quickSaveButton} onPress={addItemToSale}>
              <Text style={styles.quickSaveText}>Adicionar item</Text>
            </Pressable>

            {saleItems.length > 0 ? (
              <View style={styles.itemsBox}>
                <Text style={styles.label}>Itens da venda</Text>
                {saleItems.map((item) => {
                  const saleProduct = products.find((productItem) => productItem.id === item.productId);
                  const subtotal = (saleProduct?.precoVenda ?? 0) * item.quantidade;
                  return (
                    <View key={item.productId} style={styles.itemRow}>
                      <View style={styles.itemInfoBox}>
                        <Text style={styles.small}>
                          {saleProduct?.nome ?? 'Produto'} x{item.quantidade} | {formatCurrency(subtotal)}
                        </Text>
                        <View style={styles.qtyActions}>
                          <Pressable
                            style={styles.qtyButton}
                            onPress={() => changeSaleItemQuantity(item.productId, -1)}
                          >
                            <Text style={styles.qtyButtonText}>-</Text>
                          </Pressable>
                          <Pressable
                            style={styles.qtyButton}
                            onPress={() => changeSaleItemQuantity(item.productId, 1)}
                          >
                            <Text style={styles.qtyButtonText}>+</Text>
                          </Pressable>
                          <Pressable onPress={() => removeItemFromSale(item.productId)}>
                            <Text style={styles.removeText}>Remover</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}

            <Text style={styles.label}>Forma de pagamento</Text>
            <View style={styles.row}>
              <Pressable
                style={[styles.choice, formaPagamento === 'avista' ? styles.choiceActive : null]}
                onPress={() => setFormaPagamento('avista')}
              >
                <Text style={styles.choiceText}>A vista</Text>
              </Pressable>
              <Pressable
                style={[styles.choice, formaPagamento === 'prazo' ? styles.choiceActive : null]}
                onPress={() => setFormaPagamento('prazo')}
              >
                <Text style={styles.choiceText}>A prazo</Text>
              </Pressable>
            </View>

            {formaPagamento === 'prazo' ? (
              <View>
                <Text style={styles.label}>Parcelamento</Text>
                <View style={styles.row}>
                  {[1, 3, 4, 6].map((option) => (
                    <Pressable
                      key={String(option)}
                      style={[styles.choice, parcelasPrazo === option ? styles.choiceActive : null]}
                      onPress={() => setParcelasPrazo(option as 1 | 3 | 4 | 6)}
                    >
                      <Text style={styles.choiceText}>{option}x</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.label}>Entrada</Text>
                <TextInput
                  value={entradaText}
                  onChangeText={setEntradaText}
                  placeholder="0"
                  keyboardType="numeric"
                  style={styles.input}
                />

                {parcelasPrazo === 1 ? (
                  <View>
                    <Text style={styles.label}>Data da conta a receber</Text>
                    <Pressable style={styles.selectInput} onPress={() => setShowSingleDatePicker(true)}>
                      <Text style={styles.selectInputText}>{singleDueDate.toLocaleDateString('pt-BR')}</Text>
                    </Pressable>
                    {showSingleDatePicker ? (
                      <DateTimePicker
                        value={singleDueDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onSingleDateChange}
                      />
                    ) : null}
                  </View>
                ) : (
                  <View>
                    <Text style={styles.label}>Dia do mes para vencimento</Text>
                    <TextInput
                      value={dueDayText}
                      onChangeText={setDueDayText}
                      placeholder="Ex: 10"
                      keyboardType="numeric"
                      style={styles.input}
                    />
                  </View>
                )}
              </View>
            ) : null}

            <Text style={styles.small}>Preview item: {formatCurrency(previewTotal)}</Text>
            <Text style={styles.total}>Total da compra: {formatCurrency(orderTotal)}</Text>

            <View style={styles.actionsRow}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.registerButton} onPress={handleRegister}>
                <Text style={styles.registerText}>Registrar venda</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.subtitle}>Ultimas vendas</Text>
          <View style={styles.monthSelector}>
            <Pressable style={styles.monthArrow} onPress={() => setSelectedSalesMonth((prev) => addMonths(prev, -1))}>
              <Text style={styles.monthArrowText}>{'<'}</Text>
            </Pressable>
            <Text style={styles.monthText}>{formatMonthYear(selectedSalesMonth)}</Text>
            <Pressable style={styles.monthArrow} onPress={() => setSelectedSalesMonth((prev) => addMonths(prev, 1))}>
              <Text style={styles.monthArrowText}>{'>'}</Text>
            </Pressable>
          </View>
          {filteredSales.slice(0, 8).map((sale) => {
            const saleCustomer = customers.find((item) => item.id === sale.customerId)?.nome ?? 'Cliente';
            const saleItems = sale.itens
              .map((item) => {
                const saleProduct = products.find((prod) => prod.id === item.productId)?.nome ?? 'Produto';
                return `${saleProduct} x${item.quantidade}`;
              })
              .join(', ');

            return (
              <Text key={sale.id} style={styles.small}>
                {saleCustomer} | {saleItems} | {formatCurrency(sale.total)}
              </Text>
            );
          })}
          {filteredSales.length === 0 ? <Text style={styles.small}>Nenhuma venda registrada neste mes.</Text> : null}
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  label: {
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 4
  },
  plusInlineButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center'
  },
  plusInlineText: {
    color: '#fff',
    fontWeight: '700'
  },
  selectInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 8,
    backgroundColor: '#fff'
  },
  selectInputText: {
    color: '#111827',
    fontWeight: '500'
  },
  optionsBox: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden'
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  optionSelected: {
    backgroundColor: '#ecfeff'
  },
  optionText: {
    color: '#111827',
    fontWeight: '500'
  },
  quickBox: {
    marginBottom: 8
  },
  itemsBox: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 8
  },
  itemRow: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 6,
    marginTop: 6
  },
  itemInfoBox: {
    width: '100%'
  },
  qtyActions: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center'
  },
  qtyButtonText: {
    color: '#111827',
    fontWeight: '700'
  },
  removeText: {
    color: '#b91c1c',
    fontWeight: '600'
  },
  quickSaveButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center'
  },
  quickSaveText: {
    color: '#fff',
    fontWeight: '700'
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
  small: {
    color: '#4b5563',
    marginTop: 4
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
    paddingVertical: 10,
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
  total: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827'
  },
  actionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: '#374151',
    fontWeight: '700'
  },
  registerButton: {
    flex: 1,
    backgroundColor: '#be123c',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center'
  },
  registerText: {
    color: '#fff',
    fontWeight: '700'
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827'
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  monthArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center'
  },
  monthArrowText: {
    color: '#111827',
    fontWeight: '700'
  },
  monthText: {
    color: '#111827',
    fontWeight: '700',
    textTransform: 'capitalize'
  }
});
