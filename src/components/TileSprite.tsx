import React from 'react';
import { Image, View } from 'react-native';
import { getServerUrl } from '../api/client';

const TILE_SIZE = 16; // source tile size in pixels
const TILEMAP_COLS = 16; // columns in tilemap_packed.png

interface Props {
  tileIndex: number;
  displaySize?: number;
}

export default function TileSprite({ tileIndex, displaySize = 32 }: Props) {
  const serverUrl = getServerUrl();
  if (!serverUrl) return <View style={{ width: displaySize, height: displaySize }} />;

  const col = tileIndex % TILEMAP_COLS;
  const row = Math.floor(tileIndex / TILEMAP_COLS);
  const offsetX = -(col * TILE_SIZE);
  const offsetY = -(row * TILE_SIZE);
  const scale = displaySize / TILE_SIZE;

  const imageUri = `http://${serverUrl.replace(/^https?:\/\//, '')}/dungeon_tiles.png`;

  return (
    <View style={{ width: displaySize, height: displaySize, overflow: 'hidden' }}>
      <Image
        source={{ uri: imageUri }}
        style={{
          position: 'absolute',
          width: TILEMAP_COLS * TILE_SIZE * scale,
          height: 100 * TILE_SIZE * scale, // generous height for the full tilemap
          left: offsetX * scale,
          top: offsetY * scale,
        }}
        resizeMode="stretch"
      />
    </View>
  );
}
