import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import LobbyScreen from './src/screens/LobbyScreen';
import GameScreen from './src/screens/GameScreen';
import ProfileScreen from './src/screens/ProfileScreen';

import socketService from './src/services/socketService';
import { Theme } from './src/theme';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      // Connect and authenticate socket
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
    return <View style={{flex: 1, backgroundColor: Theme.colors.background}} />;
  }

  return (
    <NavigationContainer theme={Theme}>
      <StatusBar style="light" />
      <Stack.Navigator 
        screenOptions={{
          headerStyle: { backgroundColor: '#1A1A2E' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: '#16213E' }
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" options={{ headerShown: false }}>
              {props => <LoginScreen {...props} route={{params: {onLoginSuccess: handleLoginSuccess}}} />}
            </Stack.Screen>
            <Stack.Screen name="Register" options={{ headerShown: false }}>
              {props => <RegisterScreen {...props} route={{params: {onLoginSuccess: handleLoginSuccess}}} />}
            </Stack.Screen>
          </>
        ) : (
          // Main Stack
          <>
            <Stack.Screen name="Home" options={{ title: 'Number Duel' }}>
              {props => <HomeScreen {...props} />}
            </Stack.Screen>
            <Stack.Screen name="Profile" options={{ title: 'My Profile' }}>
              {props => <ProfileScreen {...props} route={{params: {onLogout: handleLogout}}} />}
            </Stack.Screen>
            <Stack.Screen name="Lobby" component={LobbyScreen} options={{ title: 'Matchmaking' }} />
            <Stack.Screen name="Game" component={GameScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
