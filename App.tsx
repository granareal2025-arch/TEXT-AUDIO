
import React, { useState, useEffect, useRef } from 'react';
import { AppTab, VoiceStyle, Voice } from './types';
import { VOICE_DATABASE, COUNTRIES, DEFAULT_COUNTRY } from './constants';
import { GeminiService } from './services/geminiService';
import { decodeBase64Audio, pcmToAudioBuffer, audioBufferToWav } from './utils/audioUtils';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.TTS);
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [selectedVoice, setSelectedVoice] = useState<Voice>(VOICE_DATABASE[DEFAULT_COUNTRY][0]);
  const [selectedStyle, setSelectedStyle] = useState<VoiceStyle>(VoiceStyle.JOURNALISTIC);
  const [speed, setSpeed] = useState(1.0);
  const [ttsText, setTtsText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [sttFile, setSttFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  const geminiRef = useRef<GeminiService | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    geminiRef.current = new GeminiService();
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
  }, []);

  useEffect(() => {
    setSelectedVoice(VOICE_DATABASE[selectedCountry][0]);
  }, [selectedCountry]);

  const handleGenerateTTS = async () => {
    if (!ttsText || !geminiRef.current || !audioContextRef.current) return;
    setIsGenerating(true);
    setAudioUrl(null);
    setAudioBuffer(null);

    try {
      const base64 = await geminiRef.current.generateSpeech(ttsText, selectedVoice, selectedStyle, speed);
      const rawData = decodeBase64Audio(base64);
      const buffer = await pcmToAudioBuffer(rawData, audioContextRef.current);
      
      setAudioBuffer(buffer);
      const blob = audioBufferToWav(buffer);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      // Playback
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = speed;
      source.connect(audioContextRef.current.destination);
      source.start();
    } catch (error) {
      alert("Erro ao gerar áudio: " + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTranscribe = async (type: 'audio' | 'video') => {
    if (!sttFile || !geminiRef.current) return;
    setIsGenerating(true);
    setTranscription("Processando arquivo... Por favor, aguarde.");

    try {
      const result = await geminiRef.current.transcribeMedia(sttFile, type);
      setTranscription(result);
    } catch (error) {
      alert("Erro na transcrição: " + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `vozpro-audio-${selectedVoice.id}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-200">
      {/* Sidebar */}
      <aside className="w-64 glass border-r border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5 flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white">V</div>
          <h1 className="text-xl font-bold tracking-tight text-white">VozPró <span className="text-xs font-normal opacity-50">v1.0</span></h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab(AppTab.TTS)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === AppTab.TTS ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30' : 'hover:bg-white/5 text-slate-400'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
            <span className="font-medium">Text-to-Speech</span>
          </button>
          
          <button 
            onClick={() => setActiveTab(AppTab.STT)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === AppTab.STT ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30' : 'hover:bg-white/5 text-slate-400'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            <span className="font-medium">Speech-to-Text</span>
          </button>

          <button 
            onClick={() => setActiveTab(AppTab.VIDEO_TRANSCRIPTION)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === AppTab.VIDEO_TRANSCRIPTION ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30' : 'hover:bg-white/5 text-slate-400'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            <span className="font-medium">Vídeo para Texto</span>
          </button>
        </nav>

        <div className="p-4 border-t border-white/5 space-y-4">
          <div className="bg-slate-900 rounded-xl p-3 text-xs border border-white/5">
             <p className="opacity-50 mb-1">Status do Sistema</p>
             <div className="flex items-center space-x-2">
               <div className="w-2 h-2 bg-green-500 rounded-full"></div>
               <span className="text-white font-medium">Motor de IA Online</span>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-slate-950 to-slate-950">
        
        {activeTab === AppTab.TTS && (
          <div className="max-w-4xl mx-auto space-y-8">
            <header>
              <h2 className="text-3xl font-bold text-white mb-2">Estúdio de Voz Profissional</h2>
              <p className="text-slate-400">Gere locuções realistas com tecnologia neural de ponta.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-400">Idioma / País</label>
                <select 
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-400">Selecione a Voz ({VOICE_DATABASE[selectedCountry].length} disponíveis)</label>
                <select 
                  value={selectedVoice.id}
                  onChange={(e) => setSelectedVoice(VOICE_DATABASE[selectedCountry].find(v => v.id === e.target.value)!)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {VOICE_DATABASE[selectedCountry].map(v => <option key={v.id} value={v.id}>{v.name} ({v.gender})</option>)}
                </select>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-400">Estilo de Locução</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(VoiceStyle).map(style => (
                    <button
                      key={style}
                      onClick={() => setSelectedStyle(style)}
                      className={`px-4 py-2 text-xs rounded-lg border transition-all ${selectedStyle === style ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/20'}`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-400">Velocidade: {speed}x</label>
                <input 
                  type="range" min="0.5" max="2.0" step="0.1" value={speed} 
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 px-1">
                  <span>Mais Lento</span>
                  <span>Normal</span>
                  <span>Mais Rápido</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-400">Conteúdo para Locução (Sem limites de texto)</label>
              <textarea 
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value)}
                placeholder="Cole seu script aqui... Use vírgulas e pontos para pausas naturais."
                className="w-full h-48 bg-slate-900 border border-white/10 rounded-2xl p-6 outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all placeholder:opacity-30"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={handleGenerateTTS}
                disabled={isGenerating || !ttsText}
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl font-bold flex items-center justify-center space-x-3 shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Processando Áudio...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/></svg>
                    <span>Gerar Áudio</span>
                  </>
                )}
              </button>

              {audioUrl && (
                <button 
                  onClick={downloadAudio}
                  className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold flex items-center justify-center space-x-3 shadow-xl shadow-emerald-600/20 transition-all active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  <span>Baixar MP3/WAV</span>
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === AppTab.STT && (
          <div className="max-w-4xl mx-auto space-y-8">
            <header>
              <h2 className="text-3xl font-bold text-white mb-2">Conversão de Áudio para Texto</h2>
              <p className="text-slate-400">Transcreva reuniões, podcasts ou notas de voz com precisão absoluta.</p>
            </header>

            <div className="glass rounded-3xl p-12 border-dashed border-2 border-white/10 hover:border-indigo-500/50 transition-all flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-2">
                <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
              </div>
              <div>
                <h4 className="text-lg font-medium">Arraste seu arquivo de áudio</h4>
                <p className="text-sm text-slate-500">MP3, WAV, M4A ou AAC (até 100MB)</p>
              </div>
              <input 
                type="file" 
                accept="audio/*" 
                onChange={(e) => setSttFile(e.target.files ? e.target.files[0] : null)}
                className="hidden" id="audio-upload"
              />
              <label htmlFor="audio-upload" className="cursor-pointer px-6 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium border border-white/10 transition-all">
                {sttFile ? sttFile.name : 'Selecionar Arquivo'}
              </label>
            </div>

            {sttFile && (
              <button 
                onClick={() => handleTranscribe('audio')}
                disabled={isGenerating}
                className="w-full py-4 bg-indigo-600 rounded-xl font-bold hover:bg-indigo-500 transition-all flex items-center justify-center space-x-2"
              >
                {isGenerating ? 'Transcrevendo...' : 'Iniciar Transcrição'}
              </button>
            )}

            {transcription && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Resultado</h3>
                  <button onClick={() => navigator.clipboard.writeText(transcription)} className="text-xs text-indigo-400 hover:text-indigo-300">Copiar Texto</button>
                </div>
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {transcription}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === AppTab.VIDEO_TRANSCRIPTION && (
          <div className="max-w-4xl mx-auto space-y-8">
            <header>
              <h2 className="text-3xl font-bold text-white mb-2">Vídeo para Texto</h2>
              <p className="text-slate-400">Extraia falas e diálogos de arquivos de vídeo MP4, MOV ou AVI.</p>
            </header>

            <div className="glass rounded-3xl p-12 border-dashed border-2 border-white/10 flex flex-col items-center justify-center text-center space-y-4">
               <svg className="w-12 h-12 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
               <h4 className="text-lg font-medium">Importar Vídeo</h4>
               <input 
                type="file" 
                accept="video/*" 
                onChange={(e) => setSttFile(e.target.files ? e.target.files[0] : null)}
                className="hidden" id="video-upload"
              />
              <label htmlFor="video-upload" className="cursor-pointer px-6 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium border border-white/10">
                {sttFile ? sttFile.name : 'Selecionar Vídeo'}
              </label>
            </div>

            {sttFile && (
              <button 
                onClick={() => handleTranscribe('video')}
                disabled={isGenerating}
                className="w-full py-4 bg-pink-600 rounded-xl font-bold hover:bg-pink-500 transition-all"
              >
                {isGenerating ? 'Analisando Vídeo...' : 'Transcrever Vídeo'}
              </button>
            )}

            {transcription && (
              <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 text-slate-300 leading-relaxed whitespace-pre-wrap">
                {transcription}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Instructions for "Setup" */}
      <div className="fixed bottom-6 right-6">
        <div className="group relative">
           <button className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center hover:bg-slate-700 border border-white/10 shadow-lg">
             <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
           </button>
           <div className="absolute bottom-full right-0 mb-4 w-64 glass p-4 rounded-xl text-xs space-y-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all transform translate-y-2 group-hover:translate-y-0">
             <p className="font-bold text-indigo-400">Instalação e Setup</p>
             <p>Este sistema é uma PWA (Progressive Web App). Para "Instalar":</p>
             <ol className="list-decimal list-inside space-y-1 text-slate-400">
               <li>Clique no ícone de instalar na barra do navegador.</li>
               <li>Ele funcionará como um executável nativo.</li>
               <li>Para offline completo, o cache local armazena o front-end.</li>
             </ol>
             <p className="text-[10px] opacity-40 italic mt-2">Requer conexão para o processamento de IA pesado via Gemini API.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default App;
