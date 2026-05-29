import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { Theme } from '../theme';
import socketService from '../services/socketService';

export default function HomeScreen({ navigation }) {
  const [playerInfo, setPlayerInfo] = useState(null);
  const [range, setRange] = useState('100');
  const [roomCode, setRoomCode] = useState('');

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    socket.on('player_info', (data) => {
      setPlayerInfo(data);
    });

    socket.on('error_message', (msg) => {
      Alert.alert('Error', msg);
    });

    return () => {
      socket.off('player_info');
      socket.off('error_message');
    };
  }, []);

  const handleJoinRandomMatch = () => {
    const rangeNum = parseInt(range);
    if (isNaN(rangeNum) || rangeNum < 2) {
      Alert.alert('Invalid Range', 'Please enter a valid range (e.g. 100)');
      return;
    }
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('join_queue', rangeNum);
      navigation.navigate('Lobby', { mode: 'queue', range: rangeNum });
    }
  };

  const handleCreatePrivateRoom = () => {
    const rangeNum = parseInt(range);
    if (isNaN(rangeNum) || rangeNum < 2) {
      Alert.alert('Invalid Range', 'Please enter a valid range (e.g. 100)');
      return;
    }
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('create_private_room', rangeNum);
      navigation.navigate('Lobby', { mode: 'private' });
    }
  };

  const handleJoinPrivateRoom = () => {
    if (!roomCode || roomCode.length !== 7) {
      Alert.alert('Invalid Code', 'Please enter a 7-digit room code');
      return;
    }
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('join_private_room', roomCode);
      navigation.navigate('Lobby', { mode: 'private' });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }}>
      {/* Header Profile */}
      <TouchableOpacity style={styles.profileCard} onPress={() => navigation.navigate('Profile')}>
        <Text style={styles.pfp}>{playerInfo?.pfp || '👤'}</Text>
        <Text style={styles.username}>{playerInfo?.username || 'Connecting...'}</Text>
        <Text style={styles.coins}>🏆 {playerInfo?.totalScore || 0} Rank Score</Text>
        <Text style={styles.editHint}>Tap to view/edit profile</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Select Tier</Text>
      <View style={styles.tiersContainer}>
        {[100, 500, 1000].map(tier => (
          <TouchableOpacity 
            key={tier} 
            style={[styles.tierButton, parseInt(range) === tier && styles.tierButtonActive]}
            onPress={() => setRange(tier.toString())}
          >
            <Text style={[styles.tierText, parseInt(range) === tier && styles.tierTextActive]}>1 - {tier}</Text>
            <Text style={styles.tierSubText}>{tier} Coins</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Play</Text>
      
      <TouchableOpacity style={styles.playButton} onPress={handleJoinRandomMatch}>
        <Text style={styles.playButtonText}>Join Random Match</Text>
        <Text style={styles.playSubtitle}>Plays against someone with the same range</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.playButton, { backgroundColor: Theme.colors.accent }]} onPress={handleCreatePrivateRoom}>
        <Text style={styles.playButtonText}>Create Private Room</Text>
        <Text style={styles.playSubtitle}>Generate a 7-digit code for a friend</Text>
      </TouchableOpacity>

      <View style={styles.joinRow}>
        <TextInput
          style={styles.input}
          placeholder="7-Digit Room Code"
          placeholderTextColor="#888"
          value={roomCode}
          onChangeText={setRoomCode}
          keyboardType="numeric"
          maxLength={7}
        />
        <TouchableOpacity style={styles.joinButton} onPress={handleJoinPrivateRoom}>
          <Text style={styles.joinButtonText}>Join</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 20,
  },
  profileCard: {
    width: '100%',
    backgroundColor: Theme.colors.card,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    elevation: 5,
  },
  pfp: {
    fontSize: 48,
    marginBottom: 10,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 5,
  },
  coins: {
    fontSize: 20,
    color: Theme.colors.warning,
    fontWeight: '600',
  },
  editHint: {
    color: '#888',
    fontSize: 12,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Theme.colors.text,
    alignSelf: 'flex-start',
    marginBottom: 15,
    marginTop: 10,
  },
  tiersContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tierButton: {
    flex: 1,
    backgroundColor: Theme.colors.card,
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  tierButtonActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
  },
  tierText: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  tierTextActive: {
    color: Theme.colors.primary,
  },
  tierSubText: {
    color: '#888',
    fontSize: 12,
    marginTop: 5,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    width: '100%',
    marginVertical: 20,
  },
  playButton: {
    width: '100%',
    backgroundColor: Theme.colors.primary,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  playButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  playSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 5,
  },
  joinRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
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
    backgroundColor: Theme.colors.success,
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
