import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://numberduel-production.up.railway.app'; // Change to IP address for local testing, or Render URL

class ApiService {
  async register(username, password) {
    const res = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    await AsyncStorage.setItem('token', data.token);
    return data;
  }

  async login(username, password) {
    const res = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    await AsyncStorage.setItem('token', data.token);
    return data;
  }

  async logout() {
    await AsyncStorage.removeItem('token');
  }

  async getProfile() {
    const token = await AsyncStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }

  async updateProfile(updates) {
    const token = await AsyncStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/profile`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }
}

export default new ApiService();
