import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// expo-secure-store hard-caps each key's value at 2048 bytes and throws if
// you exceed it. A Supabase session (access + refresh JWT plus metadata)
// routinely goes over that, so values are split across `${key}_0`,
// `${key}_1`, ... with a `${key}_chunks` sentinel recording the count.
// (On web there's no such limit, so it just uses localStorage directly.)
const CHUNK_SIZE = 2000;

async function getChunkedItem(key: string): Promise<string | null> {
  const chunkCountRaw = await SecureStore.getItemAsync(`${key}_chunks`);
  if (chunkCountRaw === null) {
    return await SecureStore.getItemAsync(key);
  }
  const chunkCount = parseInt(chunkCountRaw, 10);
  const chunks = await Promise.all(
    Array.from({ length: chunkCount }, (_, i) => SecureStore.getItemAsync(`${key}_${i}`)),
  );
  return chunks.every((chunk) => chunk !== null) ? chunks.join('') : null;
}

async function setChunkedItem(key: string, value: string): Promise<void> {
  if (value.length <= CHUNK_SIZE) {
    await SecureStore.setItemAsync(key, value);
    await SecureStore.deleteItemAsync(`${key}_chunks`);
    return;
  }

  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += CHUNK_SIZE) {
    chunks.push(value.slice(i, i + CHUNK_SIZE));
  }
  await Promise.all(chunks.map((chunk, i) => SecureStore.setItemAsync(`${key}_${i}`, chunk)));
  await SecureStore.setItemAsync(`${key}_chunks`, String(chunks.length));
  await SecureStore.deleteItemAsync(key);
}

async function removeChunkedItem(key: string): Promise<void> {
  const chunkCountRaw = await SecureStore.getItemAsync(`${key}_chunks`);
  if (chunkCountRaw !== null) {
    const chunkCount = parseInt(chunkCountRaw, 10);
    await Promise.all(Array.from({ length: chunkCount }, (_, i) => SecureStore.deleteItemAsync(`${key}_${i}`)));
    await SecureStore.deleteItemAsync(`${key}_chunks`);
  }
  await SecureStore.deleteItemAsync(key);
}

export const LargeSecureStore = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    }
    return await getChunkedItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await setChunkedItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await removeChunkedItem(key);
  },
};
