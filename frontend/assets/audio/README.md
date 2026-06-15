# Folder Audio

Folder ini digunakan untuk menyimpan file audio/suara lokal yang akan digunakan di dalam aplikasi.

## Struktur
- `meditations/`: Letakkan file audio untuk guided meditation di sini (contoh: `meditasi_tidur.mp3`, `relaksasi_pagi.mp3`).
- `breathing/`: Letakkan file efek suara (SFX) untuk fitur napas di sini. 
  - Contoh file: `inhale.mp3` (suara tarik napas) dan `exhale.mp3` (suara embuskan napas).

## Cara Penggunaan di Expo (React Native)
Anda bisa memanggil file audio lokal di dalam kode menggunakan `require`:

```javascript
import { Audio } from 'expo-av';

// Contoh memutar suara tarik napas
const playInhale = async () => {
  const { sound } = await Audio.Sound.createAsync(
    require('../../assets/audio/breathing/inhale.mp3')
  );
  await sound.playAsync();
};
```
