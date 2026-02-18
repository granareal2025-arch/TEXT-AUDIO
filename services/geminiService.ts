
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { VoiceStyle, Voice } from "../types";

export class GeminiService {
  private ai: any;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async generateSpeech(text: string, voice: Voice, style: VoiceStyle, speed: number): Promise<string> {
    const prompt = `Aja como um profissional de locução do ${voice.country === 'BR' ? 'Brasil' : 'país com código ' + voice.country}.
    Estilo: ${style}.
    Gênero: ${voice.gender === 'F' ? 'Feminino' : 'Masculino'}.
    Velocidade: ${speed === 1 ? 'Normal' : speed > 1 ? 'Rápida' : 'Lenta'}.
    Texto para falar: ${text}`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice.baseVoice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) throw new Error("Falha ao gerar áudio");
      
      return base64Audio;
    } catch (error) {
      console.error("Erro no TTS:", error);
      throw error;
    }
  }

  async transcribeMedia(file: File, type: 'audio' | 'video'): Promise<string> {
    const base64Data = await this.fileToBase64(file);
    const mimeType = file.type || (type === 'audio' ? 'audio/mpeg' : 'video/mp4');

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: "Por favor, transcreva o conteúdo deste arquivo para texto em Português do Brasil com máxima precisão. Retorne apenas o texto da transcrição." }
          ]
        }
      });

      return response.text || "Transcrição não disponível.";
    } catch (error) {
      console.error("Erro na transcrição:", error);
      throw error;
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  }
}
