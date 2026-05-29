import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Dimensions, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function AnimatedBackground({ children }) {
  const moveAnim1 = useRef(new Animated.Value(0)).current;
  const moveAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createLoop = (anim, duration) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          })
        ])
      ).start();
    };

    createLoop(moveAnim1, 8000);
    createLoop(moveAnim2, 12000);
  }, []);

  const translate1 = moveAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });

  const translate2 = moveAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -100],
  });

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.blob, 
          styles.blob1, 
          { transform: [{ translateX: translate1 }, { translateY: translate1 }] }
        ]} 
      />
      <Animated.View 
        style={[
          styles.blob, 
          styles.blob2, 
          { transform: [{ translateX: translate2 }, { translateY: translate2 }] }
        ]} 
      />
      
      {/* Semi-transparent overlay to soften the blobs and create a deep 3D space */}
      <View style={styles.overlay} />
      
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Base slate color
  },
  blob: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width,
    opacity: 0.4,
    // Note: React Native blur requires external libraries like expo-blur,
    // so we simulate the soft 3D gradient look with large soft shapes and an overlay.
  },
  blob1: {
    top: -width * 0.5,
    left: -width * 0.5,
    backgroundColor: '#0284C7', // Deep blue
  },
  blob2: {
    bottom: -width * 0.5,
    right: -width * 0.5,
    backgroundColor: '#38BDF8', // Light sky blue
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.7)', // Slate overlay
  },
  content: {
    flex: 1,
    zIndex: 1, // Ensure content is above background
  }
});
