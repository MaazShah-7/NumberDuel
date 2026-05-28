import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, FlatList, Animated } from 'react-native';
import { Theme } from '../theme';
import socketService from '../services/socketService';

export default function GameScreen({ route, navigation }) {
  const { gameData } = route.params;
  const socket = socketService.getSocket();
  const myId = socket.id;

  const [phase, setPhase] = useState('setup'); // 'setup', 'battle', 'finished'
  const [targetNumber, setTargetNumber] = useState('');
  const [guess, setGuess] = useState('');
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [turn, setTurn] = useState(null);
  const [history, setHistory] = useState([]);
  const [gameOverData, setGameOverData] = useState(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('target_set_success', () => setWaitingForOpponent(true));
    
    socket.on('battle_started', (data) => {
      setPhase('battle');
      setTurn(data.turn);
      setWaitingForOpponent(false);
    });

    socket.on('turn_changed', (data) => {
      setTurn(data.turn);
    });

    socket.on('guess_result', (move) => {
      setHistory(prev => [move, ...prev]);
    });

    socket.on('game_over', (data) => {
      setPhase('finished');
      setGameOverData(data);
    });

    socket.on('opponent_left', () => {
      Alert.alert('Victory!', 'Your opponent disconnected.');
      navigation.replace('Home');
    });

    socket.on('error_message', (msg) => Alert.alert('Error', msg));

    return () => {
      socket.off('target_set_success');
      socket.off('battle_started');
      socket.off('turn_changed');
      socket.off('guess_result');
      socket.off('game_over');
      socket.off('opponent_left');
      socket.off('error_message');
    };
  }, [navigation]);

  const submitTarget = () => {
    const num = parseInt(targetNumber);
    if (isNaN(num) || num < 1 || num > gameData.range) {
      Alert.alert('Invalid Number', `Please enter a number between 1 and ${gameData.range}`);
      return;
    }
    socket.emit('set_target_number', num);
  };

  const submitGuess = () => {
    if (turn !== myId) return;
    const num = parseInt(guess);
    if (isNaN(num) || num < 1 || num > gameData.range) {
      Alert.alert('Invalid Guess', `Please enter a number between 1 and ${gameData.range}`);
      return;
    }
    socket.emit('submit_guess', num);
    setGuess('');
  };

  const leaveGame = () => {
    socket.emit('leave_room');
    navigation.replace('Home');
  };

  const renderHistoryItem = ({ item }) => {
    const isMe = item.guesser === myId;
    let resultColor = Theme.colors.warning;
    if (item.result === 'Correct') resultColor = Theme.colors.success;
    if (item.result === 'Higher') resultColor = '#3498db';
    if (item.result === 'Lower') resultColor = '#e74c3c';

    return (
      <View style={[styles.historyItem, isMe ? styles.historyItemMe : styles.historyItemOpponent]}>
        <Text style={styles.historyName}>{isMe ? 'You' : item.guesserName} guessed {item.guess}</Text>
        <Text style={[styles.historyResult, { color: resultColor }]}>{item.result}</Text>
      </View>
    );
  };

  if (phase === 'setup') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Setup Phase</Text>
        <Text style={styles.subtitle}>Pick your secret number between 1 and {gameData.range}</Text>
        
        {waitingForOpponent ? (
          <Text style={styles.waitingText}>Waiting for opponent to pick...</Text>
        ) : (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={targetNumber}
              onChangeText={setTargetNumber}
              placeholder="Your Secret Number"
              placeholderTextColor="#888"
            />
            <TouchableOpacity style={styles.button} onPress={submitTarget}>
              <Text style={styles.buttonText}>Lock In</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  if (phase === 'finished' && gameOverData) {
    const isWinner = gameOverData.winner === myId;
    const isDraw = !gameOverData.winner; // Just in case we add draw later
    
    // Calculate total guesses
    const totalGuesses = gameOverData.history ? gameOverData.history.length : 0;
    
    // Get targets
    const myTarget = gameOverData.targets ? gameOverData.targets[myId] : '?';
    const opponentId = gameData.players?.find(p => p.id !== myId)?.id;
    const opponentTarget = (gameOverData.targets && opponentId) ? gameOverData.targets[opponentId] : '?';
    const opponentName = gameData.players?.find(p => p.id !== myId)?.username || 'Opponent';

    return (
      <View style={styles.postMatchContainer}>
        <Text style={[styles.postMatchTitle, { color: isWinner ? Theme.colors.success : '#ff4444' }]}>
          {isWinner ? 'VICTORY' : 'DEFEAT'}
        </Text>
        
        <Text style={styles.winnerText}>
          {isWinner ? 'You outsmarted your opponent!' : `${gameOverData.winnerName} found your number!`}
        </Text>

        <View style={styles.scoreboard}>
          <Text style={styles.scoreboardTitle}>MATCH SCOREBOARD</Text>
          
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Your Target:</Text>
            <Text style={styles.scoreValue}>{myTarget}</Text>
          </View>
          
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>{opponentName}'s Target:</Text>
            <Text style={styles.scoreValue}>{opponentTarget}</Text>
          </View>

          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Total Turns:</Text>
            <Text style={styles.scoreValue}>{totalGuesses}</Text>
          </View>
          
          <View style={[styles.scoreRow, styles.potRow]}>
            <Text style={styles.scoreLabel}>Coins Earned:</Text>
            <Text style={[styles.scoreValue, { color: isWinner ? Theme.colors.success : '#ff4444' }]}>
              {isWinner ? '+' : '-'}{gameOverData.pot / 2} 💰
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.returnButton} onPress={leaveGame}>
          <Text style={styles.returnButtonText}>RETURN TO LOBBY</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Range: 1 - {gameData.range}</Text>
        <View style={[styles.turnIndicator, turn === myId ? styles.myTurn : styles.theirTurn]}>
          <Text style={styles.turnText}>{turn === myId ? 'YOUR TURN' : "OPPONENT'S TURN"}</Text>
        </View>
      </View>

      {/* History */}
      <FlatList
        data={history}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderHistoryItem}
        contentContainerStyle={styles.historyList}
        inverted
      />

      {/* Controls */}
      <View style={styles.controls}>
        <TextInput
          style={[styles.input, { flex: 1, marginRight: 10, opacity: turn === myId ? 1 : 0.5 }]}
          keyboardType="numeric"
          value={guess}
          onChangeText={setGuess}
          placeholder="Enter Guess"
          placeholderTextColor="#888"
          editable={turn === myId}
        />
        <TouchableOpacity 
          style={[styles.button, { opacity: turn === myId ? 1 : 0.5 }]} 
          onPress={submitGuess}
          disabled={turn !== myId}
        >
          <Text style={styles.buttonText}>Guess</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Theme.colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 40,
  },
  waitingText: {
    fontSize: 20,
    color: Theme.colors.warning,
    textAlign: 'center',
    marginTop: 20,
  },
  inputContainer: {
    width: '100%',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: Theme.colors.card,
    color: Theme.colors.text,
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: Theme.colors.primary,
    padding: 20,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    color: '#aaa',
    fontSize: 16,
  },
  turnIndicator: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  myTurn: {
    backgroundColor: Theme.colors.success,
  },
  theirTurn: {
    backgroundColor: Theme.colors.border,
  },
  turnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  historyList: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  historyItem: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    maxWidth: '80%',
  },
  historyItemMe: {
    backgroundColor: Theme.colors.accent,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 0,
  },
  historyItemOpponent: {
    backgroundColor: Theme.colors.card,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 0,
  },
  historyName: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 5,
  },
  historyResult: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    marginTop: 10,
  },
  winnerText: {
    fontSize: 20,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 30,
  },
  potText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Theme.colors.warning,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  postMatchContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postMatchTitle: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  scoreboard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
    marginBottom: 40,
  },
  scoreboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#38BDF8',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 1,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  potRow: {
    borderBottomWidth: 0,
    marginTop: 10,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#0F172A',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 18,
    color: '#F8FAFC',
    fontWeight: 'bold',
  },
  returnButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 15,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#38BDF8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  returnButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  }
});
