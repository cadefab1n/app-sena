import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ADMIN_PASSWORD = 'seven2024'; // Senha padrão - deve ser mudada

export default function AdminLoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!password.trim()) {
      Alert.alert('Erro', 'Digite a senha');
      return;
    }

    setLoading(true);

    // Verificar senha (em produção, fazer via API)
    if (password === ADMIN_PASSWORD) {
      try {
        // Salvar token de autenticação
        await AsyncStorage.setItem('admin_authenticated', 'true');
        await AsyncStorage.setItem('admin_login_time', new Date().toISOString());
        
        Alert.alert('Sucesso', 'Bem-vindo ao painel administrativo!', [
          {
            text: 'OK',
            onPress: () => router.push('/admin-dashboard'),
          },
        ]);
      } catch (error) {
        Alert.alert('Erro', 'Falha ao fazer login');
      }
    } else {
      Alert.alert('Erro', 'Senha incorreta');
    }

    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#f5f5f5' }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/menu')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={64} color="#ffea07" />
            </View>
            <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>
              Painel Administrativo
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? '#aaa' : '#666' }]}>
              Seven Menu Experience
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
            <Text style={[styles.label, { color: isDark ? '#fff' : '#000' }]}>
              Senha de Acesso
            </Text>

            <View style={[styles.passwordContainer, { backgroundColor: isDark ? '#000' : '#f9f9f9' }]}>
              <TextInput
                style={[styles.input, { color: isDark ? '#fff' : '#000' }]}
                placeholder="Digite a senha"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color={isDark ? '#aaa' : '#666'}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, { opacity: loading ? 0.5 : 1 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Ionicons name="lock-open" size={24} color="#000" />
              <Text style={styles.loginButtonText}>
                {loading ? 'Entrando...' : 'Entrar no Painel'}
              </Text>
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#ffea07" />
              <Text style={[styles.infoText, { color: isDark ? '#aaa' : '#666' }]}>
                Acesso restrito apenas para administradores
              </Text>
            </View>
          </View>

          <View style={styles.defaultPassword}>
            <Text style={[styles.defaultPasswordText, { color: isDark ? '#666' : '#999' }]}>
              Senha padrão: seven2024
            </Text>
            <Text style={[styles.defaultPasswordSubtext, { color: isDark ? '#666' : '#999' }]}>
              (Altere a senha após o primeiro acesso)
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  eyeButton: {
    padding: 4,
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: '#ffea07',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 234, 7, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffea07',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    marginLeft: 8,
  },
  defaultPassword: {
    alignItems: 'center',
    marginTop: 32,
  },
  defaultPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  defaultPasswordSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
});
