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
          toValue: 1.15,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
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
      <View style={styles.logoShadow} />
      
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
    shadowColor: '#FF4B1F', // primaryOrange glow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 30,
    elevation: 20,
    zIndex: 2,
    borderRadius: 100, // Makes the glow circular
    backgroundColor: 'rgba(255, 75, 31, 0.1)', // slight inner glow tint
  },
  logoImage: {
    width: 200,
    height: 200,
  },
  logoShadow: {
    position: 'absolute',
    bottom: '35%',
    width: 120,
    height: 20,
    backgroundColor: 'rgba(255, 75, 31, 0.3)',
    borderRadius: 100,
    transform: [{ scaleY: 0.3 }],
  },
  loadingText: {
    marginTop: 60,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 4,
  }
});
