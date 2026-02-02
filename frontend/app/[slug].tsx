import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCartStore } from '../store/cartStore';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Restaurant {
  id: number;
  slug: string;
  name: string;
  description?: string;
  logo?: string;
  banner?: string;
  whatsapp?: string;
  primary_color?: string;
  is_open?: boolean;
  closed_message?: string;
  min_order?: number;
  delivery_fee?: number;
}

interface Category {
  id: number;
  name: string;
  icon?: string;
  image?: string;
}

interface Product {
  id: number;
  category_id: number;
  name: string;
  description?: string;
  price: number;
  promo_price?: number;
  image?: string;
  is_featured?: boolean;
  featured_tag?: string;
}

export default function PublicMenuScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { items, addItem, getTotalItems, getTotalPrice } = useCartStore();
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const loadMenu = useCallback(async () => {
    if (!slug) return;
    
    try {
      setError(null);
      const res = await fetch(`${API_URL}/api/menu/${slug}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          setError('Restaurante não encontrado');
        } else {
          setError('Erro ao carregar cardápio');
        }
        return;
      }
      
      const data = await res.json();
      setRestaurant(data.restaurant);
      setCategories(data.categories || []);
      setProducts(data.products || []);
      
      if (data.categories?.length > 0 && !selectedCategory) {
        setSelectedCategory(data.categories[0].id);
      }
      
      // Track page view
      fetch(`${API_URL}/api/menu/${slug}/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: 'page_view' }),
      }).catch(() => {});
      
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [slug, selectedCategory]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMenu();
  };

  const handleAddToCart = (product: Product) => {
    addItem({
      id: String(product.id),
      name: product.name,
      price: product.promo_price || product.price,
      image: product.image,
    });
    
    // Track add to cart
    fetch(`${API_URL}/api/menu/${slug}/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        event_type: 'add_to_cart',
        product_id: product.id 
      }),
    }).catch(() => {});
  };

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category_id === selectedCategory)
    : products;

  const primaryColor = restaurant?.primary_color || '#E63946';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E63946" />
        <Text style={styles.loadingText}>Carregando cardápio...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#E63946" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadMenu}>
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: primaryColor }]}>
        <View style={styles.headerContent}>
          {restaurant?.logo ? (
            <Image source={{ uri: restaurant.logo }} style={styles.logo} />
          ) : (
            <View style={[styles.logoPlaceholder, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.logoText}>{restaurant?.name?.charAt(0) || 'R'}</Text>
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.restaurantName}>{restaurant?.name}</Text>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: restaurant?.is_open ? '#4CAF50' : '#F44336' }]} />
              <Text style={styles.statusText}>
                {restaurant?.is_open ? 'Aberto agora' : 'Fechado'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Closed message */}
      {!restaurant?.is_open && restaurant?.closed_message && (
        <View style={styles.closedBanner}>
          <Text style={styles.closedText}>{restaurant.closed_message}</Text>
        </View>
      )}

      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && { backgroundColor: primaryColor }
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category.id && styles.categoryTextActive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products */}
      <ScrollView
        style={styles.productsContainer}
        contentContainerStyle={styles.productsContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[primaryColor]} />
        }
      >
        {filteredProducts.map(product => (
          <TouchableOpacity
            key={product.id}
            style={styles.productCard}
            onPress={() => handleAddToCart(product)}
            activeOpacity={0.7}
          >
            {product.image ? (
              <Image source={{ uri: product.image }} style={styles.productImage} />
            ) : (
              <View style={[styles.productImagePlaceholder, { backgroundColor: `${primaryColor}20` }]}>
                <Ionicons name="fast-food-outline" size={32} color={primaryColor} />
              </View>
            )}
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
              {product.description && (
                <Text style={styles.productDescription} numberOfLines={2}>{product.description}</Text>
              )}
              <View style={styles.productPriceRow}>
                {product.promo_price ? (
                  <>
                    <Text style={styles.productOldPrice}>
                      R$ {product.price.toFixed(2).replace('.', ',')}
                    </Text>
                    <Text style={[styles.productPrice, { color: primaryColor }]}>
                      R$ {product.promo_price.toFixed(2).replace('.', ',')}
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.productPrice, { color: primaryColor }]}>
                    R$ {product.price.toFixed(2).replace('.', ',')}
                  </Text>
                )}
              </View>
              {product.is_featured && product.featured_tag && (
                <View style={[styles.featuredBadge, { backgroundColor: primaryColor }]}>
                  <Text style={styles.featuredText}>{product.featured_tag}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: primaryColor }]}
              onPress={() => handleAddToCart(product)}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {filteredProducts.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum produto nesta categoria</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Cart Button */}
      {getTotalItems() > 0 && (
        <TouchableOpacity
          style={[styles.cartButton, { backgroundColor: primaryColor }]}
          onPress={() => router.push(`/cart?slug=${slug}`)}
        >
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{getTotalItems()}</Text>
          </View>
          <Ionicons name="cart" size={24} color="#fff" />
          <Text style={styles.cartButtonText}>Ver carrinho</Text>
          <Text style={styles.cartTotal}>
            R$ {getTotalPrice().toFixed(2).replace('.', ',')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#E63946',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  closedBanner: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    alignItems: 'center',
  },
  closedText: {
    color: '#856404',
    fontSize: 14,
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    maxHeight: 56,
  },
  categoriesContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
  },
  productsContainer: {
    flex: 1,
  },
  productsContent: {
    padding: 12,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: 100,
    height: 100,
  },
  productImagePlaceholder: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    padding: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productOldPrice: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  featuredBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomLeftRadius: 8,
  },
  featuredText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  addButton: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
  },
  cartButton: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  cartBadge: {
    position: 'absolute',
    left: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cartBadgeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  cartButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cartTotal: {
    position: 'absolute',
    right: 16,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
});
