import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { getServerUrl } from '../api/client';

interface SpriteInfo {
  src: string;
  fr?: number;
  fs?: number;
  type?: string;
}

interface Props {
  monsterId: string;
  displaySize?: number;
  spriteInfo?: SpriteInfo;
}

// Emoji fallback for monsters without sprites
const MONSTER_EMOJIS: Record<string, string> = {
  green_slime: '🟢', rat: '🐀', tiny_spider: '🕷️', forest_imp: '😈',
  wisp: '👻', evil_shroom: '🍄', goblin: '👺', skeleton: '💀',
  reaper: '☠️', cave_bat: '🦇', void_devil: '👿', mimic: '📦',
  frost_golem: '🧊', giant_spider: '🕸️', cave_troll: '🧌', sandworm: '🪱',
  volcano_drake: '🐉', dark_drake: '🐲',
};

export default function MonsterSprite({ monsterId, displaySize = 64, spriteInfo }: Props) {
  const frameAnim = useRef(new Animated.Value(0)).current;
  const [frameIndex, setFrameIndex] = useState(0);
  const [imgError, setImgError] = useState(false);
  const serverUrl = getServerUrl();

  const frames = spriteInfo?.fr ?? 1;
  const frameSize = spriteInfo?.fs ?? 16;
  const scale = displaySize / frameSize;

  useEffect(() => {
    if (frames <= 1) return;
    const interval = setInterval(() => {
      setFrameIndex(i => (i + 1) % frames);
    }, 120);
    return () => clearInterval(interval);
  }, [frames]);

  if (imgError || !serverUrl || !spriteInfo) {
    const emoji = MONSTER_EMOJIS[monsterId] ?? '👾';
    return (
      <View style={[styles.emojiContainer, { width: displaySize, height: displaySize }]}>
        <Text style={{ fontSize: displaySize * 0.6 }}>{emoji}</Text>
      </View>
    );
  }

  const imageUri = `http://${serverUrl.replace(/^https?:\/\//, '')}${spriteInfo.src}`;

  if (spriteInfo.type === 'img' || frames <= 1) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={{ width: displaySize, height: displaySize }}
        resizeMode="contain"
        onError={() => setImgError(true)}
      />
    );
  }

  // Animated sprite strip: show frame by clipping overflow
  const stripWidth = frameSize * frames;
  const offsetX = -(frameIndex * frameSize);

  return (
    <View
      style={{
        width: displaySize,
        height: displaySize,
        overflow: 'hidden',
      }}
    >
      <Image
        source={{ uri: imageUri }}
        style={{
          width: stripWidth * scale,
          height: displaySize,
          marginLeft: offsetX * scale,
        }}
        resizeMode="stretch"
        onError={() => setImgError(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  emojiContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
