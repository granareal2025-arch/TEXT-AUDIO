
import { Voice } from './types';

export const COUNTRIES = [
  { code: 'BR', name: 'Brasil' },
  { code: 'PT', name: 'Portugal' },
  { code: 'AO', name: 'Angola' },
  { code: 'MZ', name: 'Moçambique' },
  { code: 'CV', name: 'Cabo Verde' }
];

const BASE_VOICES = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

const generateVoices = (countryCode: string, count: number): Voice[] => {
  const voices: Voice[] = [];
  for (let i = 1; i <= count; i++) {
    const isFemale = i % 2 === 0;
    const baseIndex = (i - 1) % BASE_VOICES.length;
    voices.push({
      id: `${countryCode}-v${i}`,
      name: `${isFemale ? 'Voz Feminina' : 'Voz Masculina'} ${i}`,
      country: countryCode,
      gender: isFemale ? 'F' : 'M',
      baseVoice: BASE_VOICES[baseIndex]
    });
  }
  return voices;
};

// Database simulation: 30 voices per country
export const VOICE_DATABASE: Record<string, Voice[]> = {
  'BR': generateVoices('BR', 30),
  'PT': generateVoices('PT', 30),
  'AO': generateVoices('AO', 30),
  'MZ': generateVoices('MZ', 30),
  'CV': generateVoices('CV', 30)
};

export const DEFAULT_COUNTRY = 'BR';
