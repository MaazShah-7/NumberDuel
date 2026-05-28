import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './src/screens/HomeScreen';
import LobbyScreen from './src/screens/LobbyScreen';
import GameScreen from './src/screens/GameScreen';
import socketService from './src/services/socketService';
import { Theme } from './src/theme';

const Stack = createNativeStackNavigator();

export default function App() {
  const [playerInfo, setPlayerInfo] = useState(null);

  useEffect(() => {
    const socket = socketService.connect();
    
    // Register player
    socket.emit('register', { username: 'Player_' + Math.floor(Math.random() * 1000) });
    
    socket.on('player_info', (data) => {
      setPlayerInfo(data);
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  return (
    <NavigationContainer theme={Theme}>
      <StatusBar style="light" />
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#1A1A2E' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: '#16213E' }
        }}
      >
        <Stack.Screen name="Home" options={{ title: 'Number Duel' }}>
          {props => <HomeScreen {...props} playerInfo={playerInfo} />}
        </Stack.Screen>
        <Stack.Screen name="Lobby" component={LobbyScreen} options={{ title: 'Matchmaking' }} />
        <Stack.Screen name="Game" component={GameScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
