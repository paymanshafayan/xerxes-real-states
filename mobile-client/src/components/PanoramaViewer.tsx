import React, { useRef, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { View, Image, PanResponder, StyleSheet, Dimensions, Text } from "react-native";
import { colors, radius, typography } from "../theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const VIEWPORT_HEIGHT = 260;
// The panorama image is rendered much wider than the viewport so dragging
// horizontally reveals different parts of it — this is a real "look around"
// interaction (cylindrical pan), not a static placeholder image.
const IMAGE_WIDTH = SCREEN_WIDTH * 3.2;

export function PanoramaViewer({ imageUri, label }: { imageUri: string; label?: string }) {
  const [offsetX, setOffsetX] = useState(-(IMAGE_WIDTH - SCREEN_WIDTH) / 2);
  const startOffset = useRef(offsetX);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 2,
      onPanResponderGrant: () => {
        startOffset.current = offsetX;
      },
      onPanResponderMove: (_, gesture) => {
        let next = startOffset.current + gesture.dx;
        const minOffset = -(IMAGE_WIDTH - SCREEN_WIDTH);
        const maxOffset = 0;
        if (next > maxOffset) next = maxOffset;
        if (next < minOffset) next = minOffset;
        setOffsetX(next);
      },
    })
  ).current;

  return (
    <View style={styles.wrap}>
      <View style={styles.viewport} {...panResponder.panHandlers}>
        <Image
          source={{ uri: imageUri }}
          style={[styles.image, { transform: [{ translateX: offsetX }] }]}
          resizeMode="cover"
        />
      </View>
      <View style={styles.hint}>
        <Text style={[typography.small, { color: "#fff" }]}><Feather name="move" size={14} color="#fff" /> {label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.md, overflow: "hidden", backgroundColor: "#000" },
  viewport: { width: "100%", height: VIEWPORT_HEIGHT, overflow: "hidden" },
  image: { width: IMAGE_WIDTH, height: VIEWPORT_HEIGHT, position: "absolute", left: 0, top: 0 },
  hint: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
});
