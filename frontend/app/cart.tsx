import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCartStore } from '../store/cartStore';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function CartScreen() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart, getTotalItems, getTotalPrice } = useCartStore();
  const [whatsapp, setWhatsapp] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#E63946');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [observation, setObservation] = useState('');

  useEffect(() => {
    loadRestaurantInfo();
  }, []);

  const loadRestaurantInfo = async () => {
    try {
      const res = await fetch(`${API_URL}/api/restaurants`);
      const data = await res.json();
      if (data.restaurants?.length > 0) {
        setWhatsapp(data.restaurants[0].whatsapp);
        setRestaurantName(data.restaurants[0].name);
        setPrimaryColor(data.restaurants[0].primary_color || '#E63946');
      }
    } catch (error) {
      console.error('Error loading restaurant:', error);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      Alert.alert('Carrinho vazio', 'Adicione produtos ao carrinho primeiro');
      return;
    }

    if (!whatsapp) {
      Alert.alert('Erro', 'WhatsApp do restaurante não configurado');
      return;
    }

    // Montar mensagem
    let message = `*PEDIDO - ${restaurantName}*\n`;
    message += `━━━━━━━━━━━━━━━━━━\n\n`;
    
    if (customerName) message += `👤 *Cliente:* ${customerName}\n`;
    if (customerAddress) message += `📍 *Endereço:* ${customerAddress}\n`;
    if (customerName || customerAddress) message += `\n`;
    
    message += `*ITENS DO PEDIDO:*\n\n`;
    
    items.forEach((item, idx) => {
      message += `${idx + 1}. ${item.name}\n`;
      message += `   ${item.quantity}x R$ ${item.price.toFixed(2).replace('.', ',')} = R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}\n\n`;
    });
    
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `*TOTAL: R$ ${getTotalPrice().toFixed(2).replace('.', ',')}*\n`;
    
    if (observation) {
      message += `\n📝 *Obs:* ${observation}\n`;
    }
    
    message += `\n_Pedido via Seven Menu_`;

    // Formatar número
    let phone = whatsapp.replace(/\D/g, '');
    if (!phone.startsWith('55')) phone = '55' + phone;

    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;

    try {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
        Alert.alert('WhatsApp', 'Complete o envio na nova aba!', [
          { text: 'Limpar Carrinho', onPress: () => { clearCart(); router.push('/menu'); } },
          { text: 'OK' }
        ]);
      } else {
        await Linking.openURL(url);
        clearCart();
        router.push('/menu');
      }
    } catch (error) {
      Alert.alert('Erro', `Entre em contato: ${whatsapp}`);
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/menu')}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        
        <View style={styles.emptyContent}>
          <Ionicons name="cart-outline" size={80} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Seu carrinho está vazio</Text>
          <Text style={styles.emptySubtitle}>Adicione itens do cardápio</Text>
          <TouchableOpacity 
            style={[styles.emptyBtn, { backgroundColor: primaryColor }]}
            onPress={() => router.push('/menu')}
          >
            <Text style={styles.emptyBtnText}>Ver Cardápio</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/menu')}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seu Pedido</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={[styles.clearText, { color: primaryColor }]}>Limpar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itens ({getTotalItems()})</Text>
          
          {items.map(item => (
            <View key={item.id} style={styles.itemCard}>
              {item.image && (
                <Image source={{ uri: item.image }} style={styles.itemImage} />
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={[styles.itemPrice, { color: primaryColor }]}>
                  R$ {item.price.toFixed(2).replace('.', ',')}
                </Text>
              </View>
              
              <View style={styles.quantityControl}>
                <TouchableOpacity
                  style={styles.quantityBtn}
                  onPress={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeItem(item.id)}
                >
                  <Ionicons name={item.quantity > 1 ? "remove" : "trash-outline"} size={18} color="#666" />
                </TouchableOpacity>
                
                <Text style={styles.quantityText}>{item.quantity}</Text>
                
                <TouchableOpacity
                  style={[styles.quantityBtn, { backgroundColor: primaryColor }]}
                  onPress={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Dados do cliente (opcional) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seus dados (opcional)</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Seu nome"
            placeholderTextColor="#9CA3AF"
            value={customerName}
            onChangeText={setCustomerName}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Endereço de entrega"
            placeholderTextColor="#9CA3AF"
            value={customerAddress}
            onChangeText={setCustomerAddress}
          />
          
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Observações (ex: tirar cebola)"
            placeholderTextColor="#9CA3AF"
            value={observation}
            onChangeText={setObservation}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Resumo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>R$ {getTotalPrice().toFixed(2).replace('.', ',')}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxa de entrega</Text>
            <Text style={styles.summaryValue}>A combinar</Text>
          </View>
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={[styles.totalValue, { color: primaryColor }]}>
              R$ {getTotalPrice().toFixed(2).replace('.', ',')}
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* CTA Fixo */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: '#25D366' }]}
          onPress={handleCheckout}
        >
          <Ionicons name="logo-whatsapp" size={24} color="#fff" />
          <Text style={styles.ctaBtnText}>Finalizar no WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 8,
  },
  emptyBtn: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  clearText: {
    fontSize: 15,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  ctaBtnText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
});
