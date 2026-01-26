import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  Image,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category_id: string;
  active: boolean;
  badges: string[];
  stock_enabled: boolean;
  stock_quantity: number;
}

interface Category {
  id: string;
  name: string;
}

export default function ProductsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [stockEnabled, setStockEnabled] = useState(false);
  const [stockQuantity, setStockQuantity] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const restaurantsRes = await fetch(`${API_URL}/api/restaurants`);
      const restaurantsData = await restaurantsRes.json();
      
      if (restaurantsData.restaurants && restaurantsData.restaurants.length > 0) {
        const restId = restaurantsData.restaurants[0].id;
        setRestaurantId(restId);

        const categoriesRes = await fetch(`${API_URL}/api/restaurants/${restId}/categories`);
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.categories || []);

        const productsRes = await fetch(`${API_URL}/api/restaurants/${restId}/products`);
        const productsData = await productsRes.json();
        setProducts(productsData.products || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSave = async () => {
    console.log('=== INICIANDO SALVAMENTO ===');
    console.log('Nome:', name);
    console.log('Descrição:', description);
    console.log('Preço:', price);
    console.log('Categoria ID:', categoryId);
    console.log('Restaurant ID:', restaurantId);
    console.log('Stock Enabled:', stockEnabled);
    console.log('Stock Quantity:', stockQuantity);
    
    if (!name.trim()) {
      Alert.alert('Erro', 'Digite o nome do produto');
      return;
    }
    
    if (!description.trim()) {
      Alert.alert('Erro', 'Digite a descrição do produto');
      return;
    }
    
    if (!price.trim()) {
      Alert.alert('Erro', 'Digite o preço do produto');
      return;
    }
    
    if (!categoryId) {
      Alert.alert('Erro', 'Selecione uma categoria');
      return;
    }

    const priceNum = parseFloat(price.replace(',', '.'));
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Erro', 'Preço inválido');
      return;
    }

    if (stockEnabled && stockQuantity.trim()) {
      const stockNum = parseInt(stockQuantity);
      if (isNaN(stockNum) || stockNum < 0) {
        Alert.alert('Erro', 'Quantidade de estoque inválida');
        return;
      }
    }

    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        description: description.trim(),
        price: priceNum,
        category_id: categoryId,
        restaurant_id: restaurantId,
        image: image,
        badges: [],
        active: true,
        order: products.length + 1,
        stock_enabled: stockEnabled,
        stock_quantity: stockEnabled && stockQuantity ? parseInt(stockQuantity) : 0,
      };

      console.log('Dados a enviar:', JSON.stringify(data, null, 2));

      let result;
      if (editingId) {
        console.log('Atualizando produto:', editingId);
        const res = await fetch(`${API_URL}/api/products/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        result = await res.json();
        console.log('Resultado atualização:', result);
      } else {
        console.log('Criando novo produto');
        const res = await fetch(`${API_URL}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        result = await res.json();
        console.log('Resultado criação:', result);
      }
      
      if (result.success) {
        Alert.alert('Sucesso!', editingId ? 'Produto atualizado!' : 'Produto criado!');
        resetForm();
        await loadData();
      } else {
        Alert.alert('Erro', result.detail || 'Falha ao salvar produto');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      Alert.alert('Erro', 'Falha ao salvar produto: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setCategoryId('');
    setImage(null);
    setStockEnabled(false);
    setStockQuantity('');
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price.toString());
    setCategoryId(product.category_id);
    setImage(product.image || null);
    setStockEnabled(product.stock_enabled || false);
    setStockQuantity(product.stock_quantity?.toString() || '0');
    setShowForm(true);
  };

  const handleToggle = async (productId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/products/${productId}/toggle`, {
        method: 'PATCH',
      });
      const result = await res.json();
      if (result.success) {
        loadData();
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao alternar status');
      console.error(error);
    }
  };

  const handleDelete = (productId: string, productName: string) => {
    Alert.alert(
      'Confirmar',
      `Deseja deletar o produto "${productName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/api/products/${productId}`, {
                method: 'DELETE',
              });
              const result = await res.json();
              if (result.success) {
                Alert.alert('Sucesso', 'Produto deletado!');
                loadData();
              }
            } catch (error) {
              Alert.alert('Erro', 'Falha ao deletar produto');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  // Group products by category
  const groupedProducts = products.reduce((groups, product) => {
    const category = categories.find(c => c.id === product.category_id);
    const categoryName = category?.name || 'Sem categoria';
    if (!groups[categoryName]) {
      groups[categoryName] = [];
    }
    groups[categoryName].push(product);
    return groups;
  }, {} as Record<string, Product[]>);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: isDark ? '#000' : '#fff' }]}>
        <ActivityIndicator size="large" color="#ffea07" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#f5f5f5' }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>Produtos</Text>
          <TouchableOpacity
            onPress={() => {
              if (showForm) {
                resetForm();
              } else {
                setShowForm(true);
              }
            }}
            style={styles.addButton}
          >
            <Ionicons name={showForm ? 'close' : 'add'} size={24} color="#ffea07" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {showForm && (
            <View style={[styles.card, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
              <Text style={[styles.cardTitle, { color: isDark ? '#fff' : '#000' }]}>
                {editingId ? 'Editar Produto' : 'Novo Produto'}
              </Text>
              
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#000' : '#f9f9f9', color: isDark ? '#fff' : '#000' }]}
                placeholder="Nome do produto *"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={name}
                onChangeText={setName}
              />
              
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: isDark ? '#000' : '#f9f9f9', color: isDark ? '#fff' : '#000' }]}
                placeholder="Descrição *"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
              
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#000' : '#f9f9f9', color: isDark ? '#fff' : '#000' }]}
                placeholder="Preço (ex: 45.90) *"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />

              <View style={styles.pickerContainer}>
                <Text style={[styles.label, { color: isDark ? '#fff' : '#000' }]}>Categoria: *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPicker}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryOption,
                        categoryId === cat.id && styles.categoryOptionSelected,
                        { backgroundColor: categoryId === cat.id ? '#ffea07' : (isDark ? '#000' : '#f9f9f9') }
                      ]}
                      onPress={() => setCategoryId(cat.id)}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                        { color: categoryId === cat.id ? '#000' : (isDark ? '#fff' : '#000') }
                      ]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Controle de Estoque */}
              <View style={styles.stockContainer}>
                <View style={styles.stockHeader}>
                  <View>
                    <Text style={[styles.label, { color: isDark ? '#fff' : '#000' }]}>Controlar estoque</Text>
                    <Text style={[styles.helperText, { color: isDark ? '#aaa' : '#666' }]}>
                      Ative para controlar quantidade disponível
                    </Text>
                  </View>
                  <Switch
                    value={stockEnabled}
                    onValueChange={setStockEnabled}
                    trackColor={{ false: '#ccc', true: '#ffea07' }}
                    thumbColor={stockEnabled ? '#fff' : '#f4f3f4'}
                  />
                </View>
                
                {stockEnabled && (
                  <TextInput
                    style={[styles.input, { backgroundColor: isDark ? '#000' : '#f9f9f9', color: isDark ? '#fff' : '#000', marginTop: 12 }]}
                    placeholder="Quantidade em estoque"
                    placeholderTextColor={isDark ? '#666' : '#999'}
                    value={stockQuantity}
                    onChangeText={setStockQuantity}
                    keyboardType="number-pad"
                  />
                )}
              </View>

              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                <Ionicons name="image" size={24} color="#ffea07" />
                <Text style={styles.imageButtonText}>
                  {image ? 'Trocar Imagem' : 'Adicionar Imagem'}
                </Text>
              </TouchableOpacity>

              {image && (
                <Image source={{ uri: image }} style={styles.imagePreview} />
              )}
              
              <TouchableOpacity
                style={[styles.primaryButton, { opacity: saving ? 0.5 : 1 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {editingId ? 'Atualizar Produto' : 'Criar Produto'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Products grouped by category */}
          <View style={[styles.card, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
            <Text style={[styles.cardTitle, { color: isDark ? '#fff' : '#000' }]}>
              Produtos Cadastrados ({products.length})
            </Text>

            {Object.entries(groupedProducts).map(([categoryName, categoryProducts]) => (
              <View key={categoryName} style={styles.categoryGroup}>
                <Text style={[styles.categoryGroupTitle, { color: isDark ? '#ffea07' : '#FF6B35' }]}>
                  {categoryName} ({categoryProducts.length})
                </Text>
                
                {categoryProducts.map((product) => (
                  <View key={product.id} style={[styles.productItem, { borderBottomColor: isDark ? '#333' : '#eee' }]}>
                    <View style={styles.productInfo}>
                      {product.image ? (
                        <Image source={{ uri: product.image }} style={styles.productThumb} />
                      ) : (
                        <View style={styles.productThumbPlaceholder}>
                          <Ionicons name="image-outline" size={24} color="#ccc" />
                        </View>
                      )}
                      <View style={styles.productDetails}>
                        <Text style={[styles.productName, { color: isDark ? '#fff' : '#000' }]}>
                          {product.name}
                        </Text>
                        <Text style={[styles.productPrice, { color: '#ffea07' }]}>
                          R$ {product.price.toFixed(2)}
                        </Text>
                        <View style={styles.productMeta}>
                          <Text style={[styles.productStatus, { color: product.active ? '#4CAF50' : '#999' }]}>
                            {product.active ? '● Ativo' : '○ Inativo'}
                          </Text>
                          {product.stock_enabled && (
                            <Text style={[
                              styles.productStock,
                              { color: product.stock_quantity > 0 ? '#4CAF50' : '#F44336' }
                            ]}>
                              📦 {product.stock_quantity} un.
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                    <View style={styles.productActions}>
                      <TouchableOpacity onPress={() => handleToggle(product.id)} style={styles.actionButton}>
                        <Ionicons name={product.active ? 'eye-off' : 'eye'} size={20} color="#2196F3" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleEdit(product)} style={styles.actionButton}>
                        <Ionicons name="pencil" size={20} color="#4CAF50" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(product.id, product.name)} style={styles.actionButton}>
                        <Ionicons name="trash" size={20} color="#F44336" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ))}

            {products.length === 0 && (
              <Text style={[styles.emptyText, { color: isDark ? '#aaa' : '#666' }]}>
                Nenhum produto cadastrado
              </Text>
            )}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    width: 40,
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    marginTop: 2,
  },
  categoryPicker: {
    flexDirection: 'row',
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryOptionSelected: {
    borderColor: '#ffea07',
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  stockContainer: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffea07',
    backgroundColor: 'rgba(255, 234, 7, 0.05)',
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#ffea07',
    borderRadius: 12,
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  imageButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#ffea07',
    fontWeight: '600',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#ffea07',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryGroup: {
    marginBottom: 20,
  },
  categoryGroupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#ffea07',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  productInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  productThumb: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
  },
  productThumbPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  productStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  productStock: {
    fontSize: 12,
    fontWeight: '600',
  },
  productActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
});
