import React, {useEffect, useLayoutEffect, useMemo, useRef} from 'react';
import {Animated, Easing, PanResponder, StyleSheet, View, useWindowDimensions} from 'react-native';

export default function SwipeCategories({children, pageKey, onSwipe, canSwipeNext, canSwipePrevious}) {
  const {width} = useWindowDimensions();
  const offset = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const transitioning = useRef(false);
  const incoming = useRef(0);
  const alive = useRef(true);
  useLayoutEffect(() => {
    if (!incoming.current) return;
    offset.setValue(incoming.current * 48);
    incoming.current = 0;
    Animated.parallel([
      Animated.timing(offset, {toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
      Animated.timing(opacity, {toValue: 1, duration: 180, useNativeDriver: true}),
    ]).start(() => {transitioning.current = false;});
  }, [pageKey, offset, opacity]);
  const responder = useMemo(() => {
    const horizontal = gesture => gesture.numberActiveTouches <= 1 &&
      Math.abs(gesture.dx) > 18 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5;
    const allowed = dx => dx < 0 ? canSwipeNext : canSwipePrevious;
    const reset = () => Animated.spring(offset, {toValue: 0, useNativeDriver: true, speed: 24, bounciness: 0}).start();
    return PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gesture) => !transitioning.current && horizontal(gesture) && allowed(gesture.dx),
      onPanResponderGrant: () => offset.stopAnimation(),
      onPanResponderMove: (_, gesture) => offset.setValue(Math.max(-width * 0.8, Math.min(width * 0.8, gesture.dx))),
      onPanResponderRelease: (_, gesture) => {
        if (transitioning.current) return;
        const distance = Math.abs(gesture.dx);
        const committed = distance >= Math.min(90, width * 0.22) || (distance >= 30 && Math.abs(gesture.vx) >= 0.5);
        if (horizontal(gesture) && allowed(gesture.dx) && committed) {
          const direction = gesture.dx < 0 ? 1 : -1;
          transitioning.current = true;
          Animated.parallel([
            Animated.timing(offset, {toValue: -direction * width, duration: 160, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
            Animated.timing(opacity, {toValue: 0, duration: 140, useNativeDriver: true}),
          ]).start(({finished}) => {
            if (!alive.current) return;
            if (finished) {
              incoming.current = direction;
              onSwipe(direction);
            } else {
              transitioning.current = false;
              opacity.setValue(1);
              reset();
            }
          });
          return;
        }
        reset();
      },
      onPanResponderTerminate: reset,
      onPanResponderTerminationRequest: () => true,
    });
  }, [width, offset, opacity, onSwipe, canSwipeNext, canSwipePrevious]);
  useEffect(() => {
    alive.current = true;
    return () => {alive.current = false; offset.stopAnimation(); opacity.stopAnimation();};
  }, [offset, opacity]);
  return (
    <View style={styles.viewport} {...responder.panHandlers}>
      <Animated.View style={[styles.page, {opacity, transform: [{translateX: offset}]}]}>{children}</Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {flex: 1, overflow: 'hidden'},
  page: {flex: 1},
});
