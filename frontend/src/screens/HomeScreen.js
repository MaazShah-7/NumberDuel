import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { Theme } from '../theme';
import socketService from '../services/socketService';

export default function HomeScreen({ navigation, playerInfo }) {
  const [roomCode, setRoomCode] = useState('');

  const joinQueue = (tier) => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('join_queue', tier);
      navigation.navigate('Lobby', { mode: 'queue', tier });
    }
  };

  const createPrivateRoom = () => {
    const socket = socketService.getSocket();
    if (socket) {
      // Defaulting to 100 stakes, 100 range for demo
      socket.emit('create_private_room', { stakes: 100, range: 100 });
      navigation.navigate('Lobby', { mode: 'private' });
    }
  };

  const joinPrivateRoom = () => {
    if (!roomCode) return;
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('join_private_room', roomCode);
      navigation.navigate('Lobby', { mode: 'private' });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }}>
      {/* Header Profile */}
      <View style={styles.profileCard}>
        <Text style={styles.username}>{playerInfo?.username || 'Connecting...'}</Text>
        <Text style={styles.coins}>💰 {playerInfo?.coins || 0} Coins</Text>
      </View>

      <Text style={styles.sectionTitle}>Global Matchmaking</Text>
      
      {/* Tiers */}
      <TouchableOpacity style={styles.tierButton} onPress={() => joinQueue(1)}>
        <Text style={styles.tierTitle}>Tier 1: Novice</Text>
        <Text style={styles.tierSubtitle}>50 Coins | Guess 1-50</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.tierButton, { borderColor: '#FFC107' }]} onPress={() => joinQueue(2)}>
        <Text style={styles.tierTitle}>Tier 2: Pro</Text>
        <Text style={styles.tierSubtitle}>500 Coins | Guess 1-500</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.tierButton, { borderColor: '#E94560' }]} onPress={() => joinQueue(3)}>
        <Text style={styles.tierTitle}>Tier 3: Legend</Text>
        <Text style={styles.tierSubtitle}>5000 Coins | Guess 1-5000</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Play with Friends</Text>
      
      <TouchableOpacity style={styles.actionButton} onPress={createPrivateRoom}>
        <Text style={styles.actionButtonText}>Create Private Room</Text>
      </TouchableOpacity>

      <View style={styles.joinRow}>
        <TextInput
          style={styles.input}
          placeholder="Enter Room Code"
          placeholderTextColor="#888"
          value={roomCode}
          onChangeText={setRoomCode}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.joinButton} onPress={joinPrivateRoom}>
          <Text style={styles.joinButtonText}>Join</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    padding: 20,
  },
  profileCard: {
    width: '100%',
    backgroundColor: Theme.colors.card,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    elevation: 5,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 10,
  },
  coins: {
    fontSize: 20,
    color: Theme.colors.warning,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Theme.colors.text,
    alignSelf: 'flex-start',
    marginBottom: 15,
    marginTop: 10,
  },
  tierButton: {
    width: '100%',
    backgroundColor: Theme.colors.card,
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 5,
    borderColor: Theme.colors.success,
  },
  tierTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  tierSubtitle: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 5,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    width: '100%',
    marginVertical: 20,
  },
  actionButton: {
    width: '100%',
    backgroundColor: Theme.colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  joinRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: Theme.colors.card,
    color: Theme.colors.text,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginRight: 10,
  },
  joinButton: {
    backgroundColor: Theme.colors.accent,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  joinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
