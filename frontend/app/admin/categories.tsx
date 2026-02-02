import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  order: number;
  is_active: boolean;
}

export default function CategoriesScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const loadData = async () => {
    if (!token) return;
    
    try {
      const res = await fetch(`${API_URL}/api/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [token]);

  const openModal = (category?: Category) => {
    setError('');
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        icon: category.icon || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '', icon: '' });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingCategory(null);
    setError('');
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Nome da categoria é obrigatório');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const body = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        icon: formData.icon || null,
      };

      let res;
      if (editingCategory) {
        res = await fetch(`${API_URL}/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`${API_URL}/api/categories`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Erro ao salvar');
      }

      closeModal();
      loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar categoria');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (categoryId: number) => {
    try {
      await fetch(`${API_URL}/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadData();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const icons = ['restaurant', 'pizza', 'fast-food', 'beer', 'cafe', 'ice-cream', 'nutrition', 'wine', 'fish', 'leaf'];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categorias</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Categories List */}
      <ScrollView
        style={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {categories.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="grid-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Nenhuma categoria cadastrada</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => openModal()}>
              <Text style={styles.emptyButtonText}>Criar primeira categoria</Text>
            </TouchableOpacity>
          </View>
        ) : (
          categories.map((category, index) => (
            <View key={category.id} style={styles.categoryCard}>
              <View style={[styles.iconBox, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name={(category.icon || 'restaurant') as any} size={24} color="#8B5CF6" />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.name}</Text>
                {category.description && (
                  <Text style={styles.categoryDesc} numberOfLines={1}>{category.description}</Text>
                )}
              </View>
              <View style={styles.categoryActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openModal(category)}>
                  <Ionicons name="pencil" size={18} color="#8B5CF6" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(category.id)}>
                  <Ionicons name="trash" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={20} color="#DC2626" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Text style={styles.inputLabel}>Nome *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Hambúrgueres"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <Text style={styles.inputLabel}>Descrição</Text>
              <TextInput
                style={styles.input}
                placeholder="Descrição da categoria"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
              />

              <Text style={styles.inputLabel}>Ícone</Text>
              <View style={styles.iconSelector}>
                {icons.map(icon => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      formData.icon === icon && styles.iconOptionActive
                    ]}
                    onPress={() => setFormData({ ...formData, icon })}
                  >
                    <Ionicons name={icon as any} size={24} color={formData.icon === icon ? '#8B5CF6' : '#6B7280'} />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  addButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center', alignItems: 'center',
  },
  list: { flex: 1, padding: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 16, color: '#9CA3AF', marginTop: 12 },
  emptyButton: {
    marginTop: 16, paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: '#8B5CF6', borderRadius: 8,
  },
  emptyButtonText: { color: '#fff', fontWeight: '600' },
  categoryCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12,
    padding: 12, marginBottom: 12,
  },
  iconBox: {
    width: 48, height: 48, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  categoryInfo: { flex: 1, marginLeft: 12 },
  categoryName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  categoryDesc: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  categoryActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  modalBody: { padding: 16 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FEF2F2', padding: 12,
    borderRadius: 8, marginBottom: 16, gap: 8,
  },
  errorText: { flex: 1, fontSize: 14, color: '#DC2626' },
  inputLabel: {
    fontSize: 14, fontWeight: '500', color: '#374151',
    marginBottom: 6, marginTop: 12,
  },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
    padding: 12, fontSize: 15, backgroundColor: '#F9FAFB',
  },
  iconSelector: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8,
  },
  iconOption: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: '#F3F4F6', borderWidth: 2, borderColor: 'transparent',
    justifyContent: 'center', alignItems: 'center',
  },
  iconOptionActive: { borderColor: '#8B5CF6', backgroundColor: '#EDE9FE' },
  modalFooter: {
    flexDirection: 'row', padding: 16, gap: 12,
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 10,
    backgroundColor: '#F3F4F6', alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  saveBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 10,
    backgroundColor: '#8B5CF6', alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
