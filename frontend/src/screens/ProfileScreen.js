import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Theme } from '../theme';
import apiService from '../services/apiService';
import socketService from '../services/socketService';

export default function ProfileScreen({ navigation, route }) {
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pfp, setPfp] = useState('');

  const onLogout = route.params?.onLogout;

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await apiService.getProfile();
      setProfile(data);
      setUsername(data.username);
      setPfp(data.pfp);
    } catch (err) {
      Alert.alert('Error', 'Could not load profile');
    }
  };

  const handleUpdate = async () => {
    try {
      const updates = { username, pfp };
      if (password) updates.password = password;
      const updatedData = await apiService.updateProfile(updates);
      setProfile(updatedData);
      setPassword('');
      Alert.alert('Success', 'Profile updated!');
    } catch (err) {
      Alert.alert('Update Failed', err.message);
    }
  };

  const handleLogout = async () => {
    await apiService.logout();
    socketService.disconnect();
    if (onLogout) onLogout();
  };

  if (!profile) return <View style={styles.container}><Text style={styles.title}>Loading...</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>My Profile</Text>

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <Text style={styles.statText}>🏆 Rank Score: {profile.totalScore || 0}</Text>
        <Text style={styles.statText}>🎮 Matches Played: {profile.matchesPlayed}</Text>
        <Text style={[styles.statText, { color: Theme.colors.success }]}>🏆 Won: {profile.matchesWon}</Text>
        <Text style={[styles.statText, { color: '#ff4444' }]}>❌ Lost: {profile.matchesLost}</Text>
      </View>

      <Text style={styles.sectionTitle}>Edit Profile</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Profile Picture (Emoji or URL)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 🦊 or https://..."
          placeholderTextColor="#888"
          value={pfp}
          onChangeText={setPfp}
        />

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        
        <Text style={styles.label}>New Password (leave blank to keep current)</Text>
        <TextInput
          style={styles.input}
          placeholder="New Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity style={styles.button} onPress={handleUpdate}>
          <Text style={styles.buttonText}>Save Changes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: '#ff4444', marginTop: 20 }]} onPress={handleLogout}>
          <Text style={styles.buttonText}>Log Out</Text>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Theme.colors.primary,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  statsCard: {
    backgroundColor: Theme.colors.card,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 30,
  },
  statText: {
    fontSize: 18,
    color: Theme.colors.text,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 15,
  },
  form: {
    width: '100%',
  },
  label: {
    color: '#aaa',
    marginBottom: 5,
    fontSize: 14,
  },
  input: {
    backgroundColor: Theme.colors.card,
    color: Theme.colors.text,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: Theme.colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
