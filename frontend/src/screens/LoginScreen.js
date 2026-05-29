import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Animated, Easing } from 'react-native';
import { Theme } from '../theme';
import apiService from '../services/apiService';

export default function LoginScreen({ navigation, route }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Animation values
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const onLoginSuccess = route.params?.onLoginSuccess;

  useEffect(() => {
    // Floating animation for the 3D logo box
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 15,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Scale in animation on load
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 20,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogin = async () => {
    try {
      await apiService.login(username, password);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      Alert.alert('Login Failed', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { transform: [{ translateY: floatAnim }, { scale: scaleAnim }] }]}>
        <View style={styles.logo3D}>
          <Text style={styles.logoText}>NUMBER</Text>
          <Text style={styles.logoTextHighlight}>DUEL</Text>
        </View>
        <View style={styles.logoShadow} />
      </Animated.View>

      <Animated.View style={[styles.formContainer, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.input3DWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#888"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.input3DWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.button3DWrapper} activeOpacity={0.7} onPress={handleLogin}>
          <View style={styles.buttonTop}>
            <Text style={styles.buttonText}>LAUNCH</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register', { onLoginSuccess })}>
          <Text style={styles.linkText}>New Player? <Text style={styles.linkBold}>Create Account</Text></Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
    zIndex: 10,
  },
  logo3D: {
    backgroundColor: '#1E293B',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center',
    // 3D Shadow properties
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 20,
    zIndex: 2,
  },
  logoShadow: {
    position: 'absolute',
    bottom: -30,
    width: 150,
    height: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 100,
    transform: [{ scaleY: 0.3 }],
    filter: 'blur(10px)', // Works on web, React Native uses elevation/shadow
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 4,
  },
  logoTextHighlight: {
    fontSize: 42,
    fontWeight: '900',
    color: '#38BDF8', // Vivid Sky Blue
    letterSpacing: 2,
    textShadowColor: 'rgba(56, 189, 248, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
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
