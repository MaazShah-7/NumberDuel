import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image } from 'react-native';

export default function LoadingScreen() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sound visualizer pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();

    // Fade In
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.logoWrapper,
        { 
          opacity: opacityAnim,
          transform: [
            { scale: pulseAnim }
          ]
        }
      ]}>
        <Image 
          source={require('../../assets/circle-logo.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>
      
      <Animated.Text style={[styles.loadingText, { opacity: opacityAnim }]}>
        INITIALIZING...
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007BFF', // Blue glow to match the logo
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 50,
    elevation: 25,
    zIndex: 2,
    borderRadius: 150, 
    backgroundColor: 'rgba(0, 123, 255, 0.05)', 
  },
  logoImage: {
    width: 250,
    height: 250,
  },
  loadingText: {
    marginTop: 60,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 4,
  }
});
