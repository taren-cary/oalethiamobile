import { Image } from 'expo-image';
import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

const MIN_SPLASH_MS = 2500;

interface AnimatedSplashScreenProps {
  onFinish: () => void;
}

export function AnimatedSplashScreen({ onFinish }: AnimatedSplashScreenProps) {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const animationFinishedRef = useRef(false);
  const hasCalledFinishRef = useRef(false);

  const tryFinish = useCallback(() => {
    if (hasCalledFinishRef.current) return;
    if (minTimeElapsed && animationFinishedRef.current) {
      hasCalledFinishRef.current = true;
      onFinish();
    }
  }, [minTimeElapsed, onFinish]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (minTimeElapsed) tryFinish();
  }, [minTimeElapsed, tryFinish]);

  const handleAnimationFinish = useCallback(() => {
    animationFinishedRef.current = true;
    tryFinish();
  }, [tryFinish]);

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/oalethiamobilebackground.jpeg')}
        style={styles.backgroundImage}
        contentFit="cover"
      />
      <View style={styles.lottieWrapper} pointerEvents="none">
        <LottieView
          source={require('@/assets/Oalethia Splash Screen Animation.json')}
          autoPlay
          loop={false}
          onAnimationFinish={handleAnimationFinish}
          style={styles.lottie}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  lottieWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: 280,
    height: 272,
  },
});
