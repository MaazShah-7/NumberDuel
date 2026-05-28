import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Theme } from '../theme';
import socketService from '../services/socketService';

export default function LobbyScreen({ route, navigation }) {
  const { mode, tier } = route.params;
  const [roomCode, setRoomCode] = useState(null);
  const [status, setStatus] = useState('Waiting for opponent...');

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleRoomCreated = (data) => {
      setRoomCode(data.roomCode);
      setStatus(`Share this code with a friend:\n${data.roomCode}`);
    };

    const handleGameStarted = (data) => {
      navigation.replace('Game', { gameData: data });
    };

    const handleErrorMessage = (msg) => {
      Alert.alert('Error', msg);
      navigation.goBack();
    };

    socket.on('room_created', handleRoomCreated);
    socket.on('game_started', handleGameStarted);
    socket.on('error_message', handleErrorMessage);

    return () => {
      socket.off('room_created', handleRoomCreated);
      socket.off('game_started', handleGameStarted);
      socket.off('error_message', handleErrorMessage);
    };
  }, [navigation]);

  const leaveLobby = () => {
    const socket = socketService.getSocket();
    if (socket) {
      if (mode === 'queue') {
        socket.emit('leave_queue');
      } else {
        socket.emit('leave_room');
      }
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Theme.colors.primary} style={styles.loader} />
      
      <Text style={styles.statusText}>{status}</Text>
      
      {roomCode && mode === 'private' && (
        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>ROOM CODE</Text>
          <Text style={styles.codeValue}>{roomCode}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.cancelButton} onPress={leaveLobby}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loader: {
    marginBottom: 30,
    transform: [{ scale: 1.5 }],
  },
  statusText: {
    fontSize: 20,
    color: Theme.colors.text,
    textAlign: 'center',
    marginBottom: 40,
  },
  codeContainer: {
    backgroundColor: Theme.colors.card,
    padding: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: Theme.colors.accent,
    alignItems: 'center',
    marginBottom: 40,
  },
  codeLabel: {
    color: Theme.colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  codeValue: {
    color: Theme.colors.text,
    fontSize: 48,
    fontWeight: 'bold',
    letterSpacing: 5,
  },
  cancelButton: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ff4444',
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
