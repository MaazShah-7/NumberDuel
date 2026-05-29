import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import LobbyScreen from './src/screens/LobbyScreen';
import GameScreen from './src/screens/GameScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import AnimatedBackground from './src/components/AnimatedBackground';

import socketService from './src/services/socketService';
import { Theme } from './src/theme';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Artificial delay to show the nice 3D Loading Screen
    const timer = setTimeout(() => {
      checkToken();
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const checkToken = async () => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      const socket = socketService.connect();
      socket.emit('authenticate', token);
    } else {
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  };

  const handleLoginSuccess = () => {
    checkToken();
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <AnimatedBackground>
        <LoadingScreen />
      </AnimatedBackground>
    );
  }

  // Create a transparent theme so the AnimatedBackground shows through
  const TransparentTheme = {
    ...Theme,
    colors: {
      ...Theme.colors,
      background: 'transparent',
    },
  };

  return (
    <AnimatedBackground>
      <NavigationContainer theme={TransparentTheme}>
        <StatusBar style="light" />
        <Stack.Navigator 
          screenOptions={{
            headerStyle: { backgroundColor: 'rgba(15, 23, 42, 0.8)' },
            headerTintColor: '#38BDF8',
            headerTitleStyle: { fontWeight: '900', letterSpacing: 1 },
            headerTransparent: true,
            contentStyle: { backgroundColor: 'transparent' }
          }}
        >
          {!isAuthenticated ? (
            <>
              <Stack.Screen name="Login" options={{ headerShown: false }}>
                {props => <LoginScreen {...props} route={{params: {onLoginSuccess: handleLoginSuccess}}} />}
              </Stack.Screen>
              <Stack.Screen name="Register" options={{ headerShown: false }}>
                {props => <RegisterScreen {...props} route={{params: {onLoginSuccess: handleLoginSuccess}}} />}
              </Stack.Screen>
            </>
          ) : (
            <>
              <Stack.Screen name="Home" options={{ title: 'NUMBER DUEL', headerTransparent: false }}>
                {props => <HomeScreen {...props} />}
              </Stack.Screen>
              <Stack.Screen name="Profile" options={{ title: 'PROFILE', headerTransparent: false }}>
                {props => <ProfileScreen {...props} route={{params: {onLogout: handleLogout}}} />}
              </Stack.Screen>
              <Stack.Screen name="Lobby" component={LobbyScreen} options={{ title: 'MATCHMAKING', headerTransparent: false }} />
              <Stack.Screen name="Game" component={GameScreen} options={{ headerShown: false }} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AnimatedBackground>
  );
}
