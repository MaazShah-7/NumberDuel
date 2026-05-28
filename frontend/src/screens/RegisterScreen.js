import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Animated, Easing } from 'react-native';
import { Theme } from '../theme';
import apiService from '../services/apiService';

export default function RegisterScreen({ navigation, route }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const onLoginSuccess = route.params?.onLoginSuccess;

  useEffect(() => {
    // Scale in animation on load
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleRegister = async () => {
    try {
      await apiService.register(username, password);
      Alert.alert('Success', 'Account created successfully!');
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      Alert.alert('Registration Failed', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.formContainer, { transform: [{ scale: scaleAnim }] }]}>
        
        <View style={styles.header}>
          <Text style={styles.title}>JOIN THE DUEL</Text>
          <Text style={styles.subtitle}>Create your profile</Text>
        </View>

        <View style={styles.input3DWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Choose Username"
            placeholderTextColor="#888"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>
        
        <View style={styles.input3DWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Create Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
        
        <TouchableOpacity style={styles.button3DWrapper} activeOpacity={0.7} onPress={handleRegister}>
          <View style={styles.buttonTop}>
            <Text style={styles.buttonText}>REGISTER</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Already a player? <Text style={styles.linkBold}>Log In</Text></Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Deep slate background
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1E293B',
    padding: 30,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 2,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 16,
    marginTop: 5,
  },
  input3DWrapper: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    marginBottom: 20,
    borderTopWidth: 2,
    borderTopColor: '#000', // Inner shadow effect
    borderBottomWidth: 1,
    borderBottomColor: '#334155', // Highlight edge
  },
  input: {
    color: '#F8FAFC',
    padding: 18,
    fontSize: 16,
    fontWeight: '600',
  },
  button3DWrapper: {
    marginTop: 10,
    backgroundColor: '#0284C7', // Darker base for 3D effect
    borderRadius: 15,
    paddingBottom: 6, // This creates the 3D depth
    marginBottom: 20,
  },
  buttonTop: {
    backgroundColor: '#38BDF8', // Lighter top face
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#7DD3FC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  linkText: {
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 15,
  },
  linkBold: {
    color: '#38BDF8',
    fontWeight: 'bold',
  }
});
