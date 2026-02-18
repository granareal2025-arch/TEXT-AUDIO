
export enum AppTab {
  TTS = 'tts',
  STT = 'stt',
  VIDEO_TRANSCRIPTION = 'video',
  SETTINGS = 'settings'
}

export enum VoiceStyle {
  JOURNALISTIC = 'Jornalístico/Reportagem',
  NARRATIVE = 'Narrativo/Calmo',
  CASUAL = 'Casual/Amigável',
  FORMAL = 'Formal/Institucional'
}

export interface Voice {
  id: string;
  name: string;
  country: string;
  gender: 'M' | 'F';
  baseVoice: string; // Mapping to Gemini Voice names: Kore, Puck, Charon, Fenrir, Zephyr
}

export interface TranscriptionResult {
  text: string;
  confidence?: number;
}
