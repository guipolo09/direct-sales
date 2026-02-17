import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Product } from '../types/models';
import { useAppStore } from '../store/AppStore';
import { formatCurrency } from '../utils/format';

type CadastroTipo = 'produto' | 'categoria' | 'marca' | 'kit' | null;
type SectionTipo = 'produtos' | 'categorias' | 'marcas';

export const EstoqueScreen = () => {
  const {
    products,
    categories,
    brands,
    addProduct,
    addCategory,
    addBrand,
    addKit,
    addStockEntry,
    getProductStock,
    removeProduct,
    updateCategory,
    removeCategory,
    updateBrand,
    removeBrand
  } = useAppStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCadastroMenu, setShowCadastroMenu] = useState(false);
  const [cadastroTipo, setCadastroTipo] = useState<CadastroTipo>(null);
  const [activeSection, setActiveSection] = useState<SectionTipo>('produtos');

  const [nomeProduto, setNomeProduto] = useState('');
  const [produtoCategoria, setProdutoCategoria] = useState<string | null>(categories[0] ?? null);
  const [produtoMarca, setProdutoMarca] = useState<string | null>(brands[0] ?? null);
  const [showCategoriaOptions, setShowCategoriaOptions] = useState(false);
  const [showMarcaOptions, setShowMarcaOptions] = useState(false);
  const [showQuickCategoriaInput, setShowQuickCategoriaInput] = useState(false);
  const [showQuickMarcaInput, setShowQuickMarcaInput] = useState(false);
  const [quickCategoriaNome, setQuickCategoriaNome] = useState('');
  const [quickMarcaNome, setQuickMarcaNome] = useState('');
  const [precoProduto, setPrecoProduto] = useState('');
  const [estoqueProduto, setEstoqueProduto] = useState('');
  const [estoqueMinimoProduto, setEstoqueMinimoProduto] = useState('');

  const [nomeMarca, setNomeMarca] = useState('');
  const [nomeCategoria, setNomeCategoria] = useState('');

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editingBrand, setEditingBrand] = useState<string | null>(null);
  const [editBrandName, setEditBrandName] = useState('');

  const [nomeKit, setNomeKit] = useState('');
  const [kitCategoria, setKitCategoria] = useState<string | null>(
    categories.find((item) => item.toLowerCase() === 'kit') ?? categories[0] ?? null
  );
  const [kitMarca, setKitMarca] = useState<string | null>(brands[0] ?? null);
  const [precoKit, setPrecoKit] = useState('');
  const [kitPriceManual, setKitPriceManual] = useState(false);
  const [estoqueMinimoKit, setEstoqueMinimoKit] = useState('');
  const [kitProductId, setKitProductId] = useState<string | null>(null);
  const [kitQty, setKitQty] = useState('1');
  const [kitItens, setKitItens] = useState<Array<{ productId: string; quantidade: number }>>([]);

  const totalStockQty = useMemo(() => products.reduce((acc, item) => acc + getProductStock(item.id), 0), [products]);
  const totalStockValue = useMemo(
    () => products.reduce((acc, item) => acc + getProductStock(item.id) * item.precoVenda, 0),
    [products]
  );

  const baseProducts = useMemo(() => products.filter((item) => item.tipo === 'produto'), [products]);
  const autoKitPrice = useMemo(() => {
    return kitItens.reduce((acc, item) => {
      const product = baseProducts.find((base) => base.id === item.productId);
      if (!product) {
        return acc;
      }
      return acc + product.precoVenda * item.quantidade;
    }, 0);
  }, [kitItens, baseProducts]);

  useEffect(() => {
    if (!kitPriceManual) {
      setPrecoKit(autoKitPrice > 0 ? autoKitPrice.toFixed(2) : '');
    }
  }, [autoKitPrice, kitPriceManual]);

  const resetCadastro = () => {
    setCadastroTipo(null);
    setShowCadastroMenu(false);
    setShowCategoriaOptions(false);
    setShowMarcaOptions(false);
    setShowQuickCategoriaInput(false);
    setShowQuickMarcaInput(false);
    setKitPriceManual(false);
  };

  const handleQuickEntry = (productId: string) => {
    addStockEntry(productId, 1, 'Fornecedor padrao', 35);
    Alert.alert('Estoque atualizado', 'Entrada de 1 unidade registrada e conta a pagar gerada.');
  };

  const handleQuickAddCategoria = () => {
    const result = addCategory(quickCategoriaNome);
    if (!result.ok) {
      Alert.alert('Nao foi possivel cadastrar', result.error ?? 'Erro desconhecido.');
      return;
    }

    const normalized = quickCategoriaNome.trim();
    setProdutoCategoria(normalized);
    setQuickCategoriaNome('');
    setShowQuickCategoriaInput(false);
    Alert.alert('Categoria cadastrada', 'Categoria adicionada e selecionada no produto.');
  };

  const handleQuickAddMarca = () => {
    const result = addBrand(quickMarcaNome);
    if (!result.ok) {
      Alert.alert('Nao foi possivel cadastrar', result.error ?? 'Erro desconhecido.');
      return;
    }

    const normalized = quickMarcaNome.trim();
    setProdutoMarca(normalized);
    setQuickMarcaNome('');
    setShowQuickMarcaInput(false);
    Alert.alert('Marca cadastrada', 'Marca adicionada e selecionada no produto.');
  };

  const handleAddProduto = () => {
    const result = addProduct({
      nome: nomeProduto,
      categoria: produtoCategoria ?? '',
      marca: produtoMarca ?? '',
      precoVenda: Number(precoProduto) || 0,
      estoqueAtual: Number(estoqueProduto) || 0,
      estoqueMinimo: Number(estoqueMinimoProduto) || 0
    });

    if (!result.ok) {
      Alert.alert('Nao foi possivel cadastrar', result.error ?? 'Erro desconhecido.');
      return;
    }

    setNomeProduto('');
    setPrecoProduto('');
    setEstoqueProduto('');
    setEstoqueMinimoProduto('');
    Alert.alert('Produto cadastrado', 'Produto adicionado com sucesso.');
    resetCadastro();
  };

  const handleAddCategoria = () => {
    const result = addCategory(nomeCategoria);
    if (!result.ok) {
      Alert.alert('Nao foi possivel cadastrar', result.error ?? 'Erro desconhecido.');
      return;
    }

    const normalized = nomeCategoria.trim();
    setNomeCategoria('');
    setProdutoCategoria((prev) => prev ?? normalized);
    setKitCategoria((prev) => prev ?? normalized);
    Alert.alert('Categoria cadastrada', 'Categoria adicionada com sucesso.');
    resetCadastro();
  };

  const handleAddMarca = () => {
    const result = addBrand(nomeMarca);
    if (!result.ok) {
      Alert.alert('Nao foi possivel cadastrar', result.error ?? 'Erro desconhecido.');
      return;
    }

    const normalized = nomeMarca.trim();
    setNomeMarca('');
    setProdutoMarca((prev) => prev ?? normalized);
    setKitMarca((prev) => prev ?? normalized);
    Alert.alert('Marca cadastrada', 'Marca adicionada com sucesso.');
    resetCadastro();
  };

  const addItemToKit = () => {
    if (!kitProductId) {
      Alert.alert('Selecione produto', 'Escolha um produto para adicionar ao kit.');
      return;
    }

    const qty = Number(kitQty) || 0;
    if (qty <= 0) {
      Alert.alert('Quantidade invalida', 'Informe quantidade maior que zero.');
      return;
    }

    setKitItens((prev) => {
      const existing = prev.find((item) => item.productId === kitProductId);
      if (existing) {
        return prev.map((item) =>
          item.productId === kitProductId
            ? { ...item, quantidade: item.quantidade + qty }
            : item
        );
      }
      return [...prev, { productId: kitProductId, quantidade: qty }];
    });

    setKitQty('1');
  };

  const removeKitItem = (productId: string) => {
    setKitItens((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleAddKit = () => {
    const result = addKit({
      nome: nomeKit,
      categoria: kitCategoria ?? '',
      marca: kitMarca ?? '',
      precoVenda: Number(precoKit) || 0,
      estoqueMinimo: Number(estoqueMinimoKit) || 0,
      itens: kitItens
    });

    if (!result.ok) {
      Alert.alert('Nao foi possivel cadastrar', result.error ?? 'Erro desconhecido.');
      return;
    }

    setNomeKit('');
    setPrecoKit('');
    setKitPriceManual(false);
    setEstoqueMinimoKit('');
    setKitItens([]);
    Alert.alert('Kit cadastrado', 'Kit adicionado com sucesso.');
    resetCadastro();
  };

  const renderCadastro = () => {
    if (!cadastroTipo) {
      return null;
    }

    if (cadastroTipo === 'produto') {
      return (
        <View style={styles.card}>
          <Text style={styles.formTitle}>Cadastrar produto</Text>
          <TextInput value={nomeProduto} onChangeText={setNomeProduto} placeholder="Nome do produto" style={styles.input} />

          <View style={styles.labelRow}>
            <Text style={styles.label}>Categoria</Text>
            <Pressable style={styles.plusInlineButton} onPress={() => setShowQuickCategoriaInput((prev) => !prev)}>
              <Text style={styles.plusInlineText}>+</Text>
            </Pressable>
          </View>
          <Pressable
            style={styles.selectInput}
            onPress={() => {
              setShowCategoriaOptions((prev) => !prev);
              setShowMarcaOptions(false);
            }}
          >
            <Text style={styles.selectInputText}>{produtoCategoria ?? 'Selecione categoria'}</Text>
          </Pressable>
          {showCategoriaOptions ? (
            <View style={styles.optionsBox}>
              {categories.map((item) => (
                <Pressable
                  key={item}
                  style={styles.option}
                  onPress={() => {
                    setProdutoCategoria(item);
                    setShowCategoriaOptions(false);
                  }}
                >
                  <Text style={styles.optionText}>{item}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {showQuickCategoriaInput ? (
            <View style={styles.quickAddWrap}>
              <TextInput
                value={quickCategoriaNome}
                onChangeText={setQuickCategoriaNome}
                placeholder="Nova categoria"
                style={[styles.input, styles.quickAddInput]}
              />
              <Pressable style={styles.quickAddButton} onPress={handleQuickAddCategoria}>
                <Text style={styles.quickAddText}>Salvar</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.labelRow}>
            <Text style={styles.label}>Marca</Text>
            <Pressable style={styles.plusInlineButton} onPress={() => setShowQuickMarcaInput((prev) => !prev)}>
              <Text style={styles.plusInlineText}>+</Text>
            </Pressable>
          </View>
          <Pressable
            style={styles.selectInput}
            onPress={() => {
              setShowMarcaOptions((prev) => !prev);
              setShowCategoriaOptions(false);
            }}
          >
            <Text style={styles.selectInputText}>{produtoMarca ?? 'Selecione marca'}</Text>
          </Pressable>
          {showMarcaOptions ? (
            <View style={styles.optionsBox}>
              {brands.map((item) => (
                <Pressable
                  key={item}
                  style={styles.option}
                  onPress={() => {
                    setProdutoMarca(item);
                    setShowMarcaOptions(false);
                  }}
                >
                  <Text style={styles.optionText}>{item}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {showQuickMarcaInput ? (
            <View style={styles.quickAddWrap}>
              <TextInput
                value={quickMarcaNome}
                onChangeText={setQuickMarcaNome}
                placeholder="Nova marca"
                style={[styles.input, styles.quickAddInput]}
              />
              <Pressable style={styles.quickAddButton} onPress={handleQuickAddMarca}>
                <Text style={styles.quickAddText}>Salvar</Text>
              </Pressable>
            </View>
          ) : null}

          <TextInput
            value={precoProduto}
            onChangeText={setPrecoProduto}
            placeholder="Preco de venda"
            keyboardType="numeric"
            style={styles.input}
          />
          <TextInput
            value={estoqueProduto}
            onChangeText={setEstoqueProduto}
            placeholder="Estoque inicial"
            keyboardType="numeric"
            style={styles.input}
          />
          <TextInput
            value={estoqueMinimoProduto}
            onChangeText={setEstoqueMinimoProduto}
            placeholder="Estoque minimo"
            keyboardType="numeric"
            style={styles.input}
          />
          <View style={styles.actionsRow}>
            <Pressable style={styles.secondaryButton} onPress={resetCadastro}>
              <Text style={styles.secondaryButtonText}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={handleAddProduto}>
              <Text style={styles.primaryButtonText}>Salvar produto</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    if (cadastroTipo === 'categoria') {
      return (
        <View style={styles.card}>
          <Text style={styles.formTitle}>Cadastrar categoria</Text>
          <TextInput
            value={nomeCategoria}
            onChangeText={setNomeCategoria}
            placeholder="Nome da categoria"
            style={styles.input}
          />
          <View style={styles.actionsRow}>
            <Pressable style={styles.secondaryButton} onPress={resetCadastro}>
              <Text style={styles.secondaryButtonText}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={handleAddCategoria}>
              <Text style={styles.primaryButtonText}>Salvar categoria</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    if (cadastroTipo === 'marca') {
      return (
        <View style={styles.card}>
          <Text style={styles.formTitle}>Cadastrar marca</Text>
          <TextInput value={nomeMarca} onChangeText={setNomeMarca} placeholder="Nome da marca" style={styles.input} />
          <View style={styles.actionsRow}>
            <Pressable style={styles.secondaryButton} onPress={resetCadastro}>
              <Text style={styles.secondaryButtonText}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={handleAddMarca}>
              <Text style={styles.primaryButtonText}>Salvar marca</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Text style={styles.formTitle}>Cadastrar kit</Text>
        <TextInput value={nomeKit} onChangeText={setNomeKit} placeholder="Nome do kit" style={styles.input} />

        <Text style={styles.label}>Categoria</Text>
        <View style={styles.optionWrap}>
          {categories.map((item) => (
            <Pressable
              key={item}
              style={[styles.optionTag, kitCategoria === item ? styles.optionTagSelected : null]}
              onPress={() => setKitCategoria(item)}
            >
              <Text style={styles.optionTagText}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Marca</Text>
        <View style={styles.optionWrap}>
          {brands.map((item) => (
            <Pressable
              key={item}
              style={[styles.optionTag, kitMarca === item ? styles.optionTagSelected : null]}
              onPress={() => setKitMarca(item)}
            >
              <Text style={styles.optionTagText}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          value={precoKit}
          onChangeText={(value) => {
            setKitPriceManual(true);
            setPrecoKit(value);
          }}
          placeholder="Preco de venda do kit"
          keyboardType="numeric"
          style={styles.input}
        />
        <Text style={styles.helperText}>Total automatico dos itens: {formatCurrency(autoKitPrice)}</Text>
        <Pressable
          style={styles.secondaryInlineButton}
          onPress={() => {
            setKitPriceManual(false);
            setPrecoKit(autoKitPrice > 0 ? autoKitPrice.toFixed(2) : '');
          }}
        >
          <Text style={styles.secondaryInlineButtonText}>Usar valor automatico</Text>
        </Pressable>

        <TextInput
          value={estoqueMinimoKit}
          onChangeText={setEstoqueMinimoKit}
          placeholder="Estoque minimo do kit"
          keyboardType="numeric"
          style={styles.input}
        />

        <Text style={styles.label}>Produtos do kit</Text>
        <View style={styles.optionWrap}>
          {baseProducts.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.optionTag, kitProductId === item.id ? styles.optionTagSelected : null]}
              onPress={() => setKitProductId(item.id)}
            >
              <Text style={styles.optionTagText}>{item.nome}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.kitRow}>
          <TextInput
            value={kitQty}
            onChangeText={setKitQty}
            placeholder="Qtd"
            keyboardType="numeric"
            style={[styles.input, styles.kitQtyInput]}
          />
          <Pressable style={styles.addKitItemButton} onPress={addItemToKit}>
            <Text style={styles.addKitItemText}>Adicionar item</Text>
          </Pressable>
        </View>

        {kitItens.map((item) => {
          const product = baseProducts.find((base) => base.id === item.productId);
          return (
            <View key={item.productId} style={styles.kitItemRow}>
              <Text style={styles.kitItemText}>
                {product?.nome ?? 'Produto'} x {item.quantidade}
              </Text>
              <Pressable onPress={() => removeKitItem(item.productId)}>
                <Text style={styles.removeText}>Remover</Text>
              </Pressable>
            </View>
          );
        })}

        <View style={styles.actionsRow}>
          <Pressable style={styles.secondaryButton} onPress={resetCadastro}>
            <Text style={styles.secondaryButtonText}>Cancelar</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={handleAddKit}>
            <Text style={styles.primaryButtonText}>Salvar kit</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderProductLine = (product: Product) => {
    const stock = getProductStock(product.id);
    const low = stock <= product.estoqueMinimo;
    const isExpanded = expandedId === product.id;

    return (
      <View key={product.id} style={styles.lineCard}>
        <Pressable style={styles.lineHeader} onPress={() => setExpandedId(isExpanded ? null : product.id)}>
          <Text style={styles.lineTitle}>{product.tipo === 'kit' ? `🎁 ${product.nome}` : product.nome}</Text>
          <Text style={styles.expandText}>{isExpanded ? 'Ocultar' : 'Expandir'}</Text>
        </Pressable>

        {isExpanded ? (
          <View style={styles.expandedContent}>
            <Text style={styles.info}>Tipo: {product.tipo}</Text>
            <Text style={styles.info}>Categoria: {product.categoria}</Text>
            <Text style={styles.info}>Marca: {product.marca}</Text>
            <Text style={styles.info}>Preco: {formatCurrency(product.precoVenda)}</Text>
            <Text style={[styles.info, low ? styles.warning : null]}>
              Estoque: {stock} | Minimo: {product.estoqueMinimo}
            </Text>
            {product.tipo === 'kit' ? (
              <View style={styles.kitCompositionBox}>
                <Text style={styles.kitCompositionTitle}>Composicao do kit:</Text>
                {(product.kitItens ?? []).map((item) => {
                  const componentName =
                    products.find((candidate) => candidate.id === item.productId)?.nome ?? 'Produto';
                  return (
                    <Text key={`${product.id}-${item.productId}`} style={styles.kitCompositionItem}>
                      - {componentName}: {item.quantidade}
                    </Text>
                  );
                })}
              </View>
            ) : null}
            {product.tipo === 'produto' ? (
              <Pressable style={styles.stockButton} onPress={() => handleQuickEntry(product.id)}>
                <Text style={styles.stockButtonText}>Registrar entrada rapida (+1)</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={styles.deleteButton}
              onPress={() =>
                Alert.alert('Excluir item', `Deseja excluir "${product.nome}" do estoque?`, [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Excluir', style: 'destructive', onPress: () => removeProduct(product.id) }
                ])
              }
            >
              <Text style={styles.deleteButtonText}>Excluir do estoque</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Controle de Estoque</Text>
          <Pressable style={styles.cadastrarButton} onPress={() => setShowCadastroMenu((prev) => !prev)}>
            <Text style={styles.cadastrarText}>+ Cadastrar</Text>
          </Pressable>
        </View>

        {showCadastroMenu ? (
          <View style={styles.menuCard}>
            <Pressable style={styles.menuItem} onPress={() => setCadastroTipo('produto')}>
              <Text style={styles.menuItemText}>Produto</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => setCadastroTipo('categoria')}>
              <Text style={styles.menuItemText}>Categoria</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => setCadastroTipo('marca')}>
              <Text style={styles.menuItemText}>Marca</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => setCadastroTipo('kit')}>
              <Text style={styles.menuItemText}>Kit</Text>
            </Pressable>
          </View>
        ) : null}

        {renderCadastro()}

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Produtos cadastrados</Text>
            <Text style={styles.summaryValue}>{products.length}</Text>
            <Text style={styles.summarySubtext}>Qtd em estoque: {totalStockQty}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Valor total em estoque</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalStockValue)}</Text>
          </View>
        </View>

        <View style={styles.segmentWrap}>
          <Pressable
            style={[styles.segmentButton, activeSection === 'produtos' ? styles.segmentButtonActive : null]}
            onPress={() => setActiveSection('produtos')}
          >
            <Text style={[styles.segmentText, activeSection === 'produtos' ? styles.segmentTextActive : null]}>Produtos</Text>
          </Pressable>
          <Pressable
            style={[styles.segmentButton, activeSection === 'categorias' ? styles.segmentButtonActive : null]}
            onPress={() => setActiveSection('categorias')}
          >
            <Text style={[styles.segmentText, activeSection === 'categorias' ? styles.segmentTextActive : null]}>Categorias</Text>
          </Pressable>
          <Pressable
            style={[styles.segmentButton, activeSection === 'marcas' ? styles.segmentButtonActive : null]}
            onPress={() => setActiveSection('marcas')}
          >
            <Text style={[styles.segmentText, activeSection === 'marcas' ? styles.segmentTextActive : null]}>Marcas</Text>
          </Pressable>
        </View>

        {activeSection === 'produtos' ? (
          <View style={styles.section}>
            {products.map(renderProductLine)}
          </View>
        ) : null}

        {activeSection === 'categorias' ? (
          <View style={styles.section}>
            {categories.map((item) => (
              <View key={item} style={styles.simpleLine}>
                {editingCategory === item ? (
                  <View style={styles.editRow}>
                    <TextInput
                      value={editCategoryName}
                      onChangeText={setEditCategoryName}
                      style={[styles.input, styles.editInput]}
                    />
                    <Pressable
                      style={styles.saveEditButton}
                      onPress={() => {
                        const result = updateCategory(item, editCategoryName);
                        if (!result.ok) {
                          Alert.alert('Erro', result.error ?? 'Erro desconhecido.');
                          return;
                        }
                        setEditingCategory(null);
                      }}
                    >
                      <Text style={styles.saveEditText}>Salvar</Text>
                    </Pressable>
                    <Pressable style={styles.cancelEditButton} onPress={() => setEditingCategory(null)}>
                      <Text style={styles.cancelEditText}>X</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.lineRow}>
                    <Text style={styles.simpleLineText}>{item}</Text>
                    <View style={styles.lineActions}>
                      <Pressable
                        style={styles.iconButton}
                        onPress={() => {
                          setEditingCategory(item);
                          setEditCategoryName(item);
                        }}
                      >
                        <Text style={styles.iconEdit}>✏️</Text>
                      </Pressable>
                      <Pressable
                        style={styles.iconButton}
                        onPress={() =>
                          Alert.alert('Excluir categoria', `Deseja excluir "${item}"?`, [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Excluir', style: 'destructive', onPress: () => removeCategory(item) }
                          ])
                        }
                      >
                        <Text style={styles.iconDelete}>🗑️</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : null}

        {activeSection === 'marcas' ? (
          <View style={styles.section}>
            {brands.map((item) => (
              <View key={item} style={styles.simpleLine}>
                {editingBrand === item ? (
                  <View style={styles.editRow}>
                    <TextInput
                      value={editBrandName}
                      onChangeText={setEditBrandName}
                      style={[styles.input, styles.editInput]}
                    />
                    <Pressable
                      style={styles.saveEditButton}
                      onPress={() => {
                        const result = updateBrand(item, editBrandName);
                        if (!result.ok) {
                          Alert.alert('Erro', result.error ?? 'Erro desconhecido.');
                          return;
                        }
                        setEditingBrand(null);
                      }}
                    >
                      <Text style={styles.saveEditText}>Salvar</Text>
                    </Pressable>
                    <Pressable style={styles.cancelEditButton} onPress={() => setEditingBrand(null)}>
                      <Text style={styles.cancelEditText}>X</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.lineRow}>
                    <Text style={styles.simpleLineText}>{item}</Text>
                    <View style={styles.lineActions}>
                      <Pressable
                        style={styles.iconButton}
                        onPress={() => {
                          setEditingBrand(item);
                          setEditBrandName(item);
                        }}
                      >
                        <Text style={styles.iconEdit}>✏️</Text>
                      </Pressable>
                      <Pressable
                        style={styles.iconButton}
                        onPress={() =>
                          Alert.alert('Excluir marca', `Deseja excluir "${item}"?`, [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Excluir', style: 'destructive', onPress: () => removeBrand(item) }
                          ])
                        }
                      >
                        <Text style={styles.iconDelete}>🗑️</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            ))}
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
    marginBottom: 12
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
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
    overflow: 'hidden'
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  menuItemText: {
    color: '#111827',
    fontWeight: '600'
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
    backgroundColor: '#fff'
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  label: {
    color: '#6b7280',
    marginTop: 6,
    marginBottom: 6
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
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 8,
    overflow: 'hidden'
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  optionText: {
    color: '#111827',
    fontWeight: '500'
  },
  quickAddWrap: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  quickAddInput: {
    flex: 1,
    marginBottom: 8
  },
  quickAddButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8
  },
  quickAddText: {
    color: '#fff',
    fontWeight: '700'
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8
  },
  optionTag: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10
  },
  optionTagSelected: {
    borderColor: '#0f766e',
    backgroundColor: '#ccfbf1'
  },
  optionTagText: {
    color: '#111827',
    fontWeight: '600'
  },
  helperText: {
    color: '#4b5563',
    marginTop: -2,
    marginBottom: 8
  },
  secondaryInlineButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8
  },
  secondaryInlineButtonText: {
    color: '#374151',
    fontWeight: '600'
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6
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
  kitRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  kitQtyInput: {
    flex: 0.35,
    marginBottom: 0
  },
  addKitItemButton: {
    flex: 0.65,
    backgroundColor: '#1d4ed8',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center'
  },
  addKitItemText: {
    color: '#fff',
    fontWeight: '700'
  },
  kitItemRow: {
    marginTop: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  kitItemText: {
    color: '#374151'
  },
  removeText: {
    color: '#b91c1c',
    fontWeight: '600'
  },
  section: {
    marginBottom: 14
  },
  lineCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
    overflow: 'hidden'
  },
  lineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12
  },
  lineTitle: {
    color: '#111827',
    fontWeight: '700'
  },
  expandText: {
    color: '#2563eb',
    fontWeight: '600'
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  info: {
    color: '#374151',
    marginBottom: 5
  },
  warning: {
    color: '#92400e',
    fontWeight: '700'
  },
  kitCompositionBox: {
    marginTop: 4,
    marginBottom: 6
  },
  kitCompositionTitle: {
    color: '#111827',
    fontWeight: '700',
    marginBottom: 4
  },
  kitCompositionItem: {
    color: '#374151',
    marginBottom: 3
  },
  stockButton: {
    marginTop: 6,
    backgroundColor: '#0f766e',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center'
  },
  stockButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  simpleLine: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginBottom: 8
  },
  simpleLineText: {
    color: '#111827',
    fontWeight: '600'
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14
  },
  summaryLabel: {
    color: '#6b7280',
    fontSize: 12,
    marginBottom: 4
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827'
  },
  summarySubtext: {
    color: '#4b5563',
    fontSize: 12,
    marginTop: 4
  },
  deleteButton: {
    marginTop: 8,
    backgroundColor: '#991b1b',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center'
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  lineActions: {
    flexDirection: 'row',
    gap: 8
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6'
  },
  iconEdit: {
    fontSize: 14
  },
  iconDelete: {
    fontSize: 14
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  editInput: {
    flex: 1,
    marginBottom: 0
  },
  saveEditButton: {
    backgroundColor: '#0f766e',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  saveEditText: {
    color: '#fff',
    fontWeight: '700'
  },
  cancelEditButton: {
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10
  },
  cancelEditText: {
    color: '#374151',
    fontWeight: '700'
  }
});
