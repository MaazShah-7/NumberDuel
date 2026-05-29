import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

export default function LoadingScreen() {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 3D Rotation Loop
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Fade and Scale In
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 20,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Adding a Y-axis rotation for a 3D effect
  const spinY = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.logo3D,
        { 
          opacity: opacityAnim,
          transform: [
            { scale: scaleAnim },
            { rotateY: spinY }, // 3D flip effect
          ]
        }
      ]}>
        <Text style={styles.logoTextHighlight}>DUEL</Text>
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
  logo3D: {
    backgroundColor: '#1E293B',
    paddingVertical: 30,
    paddingHorizontal: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
    zIndex: 2,
  },
  logoTextHighlight: {
    fontSize: 50,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 2,
  },
  logoShadow: {
    position: 'absolute',
    bottom: '40%',
    width: 100,
    height: 15,
    backgroundColor: 'rgba(56, 189, 248, 0.4)',
    borderRadius: 100,
    transform: [{ scaleY: 0.3 }],
  },
  loadingText: {
    marginTop: 60,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#94A3B8',
    letterSpacing: 4,
  }
});
