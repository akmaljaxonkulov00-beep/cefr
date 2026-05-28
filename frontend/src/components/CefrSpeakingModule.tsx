'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Play, Pause, Clock, ArrowRight, ArrowLeft, Image as ImageIcon } from 'lucide-react';

export interface CefrSpeakingPart {
  id: string;
  partNumber: 1 | 2 | 3;
  title: string;
  description: string;
  questions: string[];
  imageUrls?: string[]; // For Part 2 - comparison images
  bulletPoints?: string[]; // For Part 2 - tasks/bullet points
  preparationTime: number; // in seconds
  responseTime: number; // in seconds
}

interface CefrSpeakingModuleProps {
  parts: CefrSpeakingPart[];
  onRecordingComplete: (partId: string, audioBlob: Blob) => void;
  level: 'B1' | 'B2' | 'C1';
}

export default function CefrSpeakingModule({ parts, onRecordingComplete, level }: CefrSpeakingModuleProps) {
  const [currentPart, setCurrentPart] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [phase, setPhase] = useState<'intro' | 'preparation' | 'response' | 'complete'>('intro');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<Record<string, Blob>>({});
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentPartData = parts[currentPart];

  useEffect(() => {
    if (currentPartData && phase === 'preparation') {
      setTimeRemaining(currentPartData.preparationTime);
    } else if (currentPartData && phase === 'response') {
      setTimeRemaining(currentPartData.responseTime);
    }
  }, [currentPart, phase, currentPartData]);

  useEffect(() => {
    if (timeRemaining > 0 && (phase === 'preparation' || phase === 'response')) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining, phase]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedAudio((prev) => ({
          ...prev,
          [currentPartData.id]: audioBlob,
        }));
        onRecordingComplete(currentPartData.id, audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Microphone access is required for this test. Please allow microphone access and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handlePhaseComplete = () => {
    if (phase === 'preparation') {
      setPhase('response');
      startRecording();
    } else if (phase === 'response') {
      stopRecording();
      setPhase('complete');
    }
  };

  const handleStartPart = () => {
    setPhase('preparation');
  };

  const handleNextPart = () => {
    if (currentPart < parts.length - 1) {
      setCurrentPart(currentPart + 1);
      setPhase('intro');
      setTimeRemaining(0);
    }
  };

  const handlePlayRecording = () => {
    if (recordedAudio[currentPartData.id]) {
      const audioUrl = URL.createObjectURL(recordedAudio[currentPartData.id]);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleStopPlaying = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="space-y-6">
      <div className="glass-dark rounded-2xl p-6">
        {/* Part Navigation */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Speaking</h3>
          <div className="flex gap-2">
            {parts.map((part, idx) => (
              <button
                key={part.id}
                onClick={() => {
                  setCurrentPart(idx);
                  setPhase('intro');
                }}
                className={`px-3 py-1 rounded-lg text-sm ${
                  currentPart === idx
                    ? 'gradient-bg text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                Part {part.partNumber}
              </button>
            ))}
          </div>
        </div>

        {/* Phase Indicator */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm">
            {parts.map((part, idx) => (
              <div key={part.id} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    idx < currentPart
                      ? 'bg-emerald-500 text-white'
                      : idx === currentPart
                      ? 'gradient-bg text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {idx < currentPart ? '✓' : part.partNumber}
                </div>
                {idx < parts.length - 1 && <ArrowRight size={16} className="text-gray-600" />}
              </div>
            ))}
          </div>
        </div>

        {/* Timer */}
        {(phase === 'preparation' || phase === 'response') && (
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-3 bg-white/5 rounded-full px-6 py-3">
              <Clock size={24} className={phase === 'response' && isRecording ? 'text-red-400' : 'text-primary-400'} />
              <span className="font-mono text-2xl text-white">{formatTime(timeRemaining)}</span>
              {phase === 'response' && isRecording && (
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
          </div>
        )}

        {/* Content */}
        {currentPartData && (
          <div className="space-y-6">
            {/* Intro Phase */}
            {phase === 'intro' && (
              <div className="text-center space-y-6">
                <div>
                  <h4 className="text-2xl font-bold text-white mb-2">Part {currentPartData.partNumber}</h4>
                  <p className="text-gray-400">{currentPartData.title}</p>
                </div>

                <div className="bg-white/5 rounded-xl p-6 text-left">
                  <p className="text-gray-300 mb-4">{currentPartData.description}</p>
                  
                  {currentPartData.questions.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-semibold text-gray-400 mb-2">Questions:</h5>
                      <ul className="space-y-2">
                        {currentPartData.questions.map((question, idx) => (
                          <li key={idx} className="text-gray-300 text-sm">
                            {idx + 1}. {question}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>Preparation: {currentPartData.preparationTime}s</span>
                      <span>Response: {currentPartData.responseTime}s</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleStartPart}
                  className="px-8 py-3 gradient-bg text-white rounded-xl font-semibold"
                >
                  Start Part {currentPartData.partNumber}
                </button>
              </div>
            )}

            {/* Preparation Phase */}
            {phase === 'preparation' && (
              <div className="text-center space-y-4">
                <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-6">
                  <h5 className="text-lg font-semibold text-primary-400 mb-2">Preparation Time</h5>
                  <p className="text-gray-300">Read the questions and prepare your response.</p>
                </div>

                {currentPartData.questions.length > 0 && (
                  <div className="bg-white/5 rounded-xl p-6 text-left">
                    <h5 className="text-sm font-semibold text-gray-400 mb-3">Questions:</h5>
                    <ul className="space-y-3">
                      {currentPartData.questions.map((question, idx) => (
                        <li key={idx} className="text-gray-300">
                          <span className="text-primary-400 font-semibold">{idx + 1}.</span> {question}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Response Phase */}
            {phase === 'response' && (
              <div className="space-y-6">
                {/* Part 2 - Split Layout with Images */}
                {currentPartData.partNumber === 2 && currentPartData.imageUrls && currentPartData.imageUrls.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Images */}
                    <div className="space-y-4">
                      <h5 className="text-sm font-semibold text-gray-400 mb-3">Compare the photos:</h5>
                      <div className="grid grid-cols-2 gap-4">
                        {currentPartData.imageUrls.map((url, idx) => (
                          <div key={idx} className="bg-white/5 rounded-xl overflow-hidden">
                            {url ? (
                              <img
                                src={url}
                                alt={`Comparison ${idx + 1}`}
                                className="w-full h-48 object-cover"
                              />
                            ) : (
                              <div className="w-full h-48 flex items-center justify-center bg-gray-700">
                                <ImageIcon size={48} className="text-gray-500" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bullet Points */}
                    {currentPartData.bulletPoints && currentPartData.bulletPoints.length > 0 && (
                      <div className="bg-white/5 rounded-xl p-6">
                        <h5 className="text-sm font-semibold text-gray-400 mb-3">Tasks:</h5>
                        <ul className="space-y-3">
                          {currentPartData.bulletPoints.map((point, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-300 text-sm">
                              <span className="text-primary-400 mt-1">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Recording Indicator */}
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-4 bg-red-500/10 border border-red-500/30 rounded-full px-8 py-4">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-red-400 font-semibold">Recording...</span>
                  </div>
                </div>

                {/* Questions */}
                {currentPartData.questions.length > 0 && (
                  <div className="bg-white/5 rounded-xl p-6">
                    <h5 className="text-sm font-semibold text-gray-400 mb-3">Questions:</h5>
                    <ul className="space-y-3">
                      {currentPartData.questions.map((question, idx) => (
                        <li key={idx} className="text-gray-300">
                          <span className="text-primary-400 font-semibold">{idx + 1}.</span> {question}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Complete Phase */}
            {phase === 'complete' && (
              <div className="text-center space-y-6">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
                  <h5 className="text-lg font-semibold text-emerald-400 mb-2">Recording Complete!</h5>
                  <p className="text-gray-300">Your response has been recorded successfully.</p>
                </div>

                {recordedAudio[currentPartData.id] && (
                  <div className="bg-white/5 rounded-xl p-6">
                    <h5 className="text-sm font-semibold text-gray-400 mb-3">Review your recording:</h5>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={handlePlayRecording}
                        disabled={isPlaying}
                        className="w-12 h-12 gradient-bg rounded-full flex items-center justify-center text-white disabled:opacity-50"
                      >
                        <Play size={20} />
                      </button>
                      <button
                        onClick={handleStopPlaying}
                        disabled={!isPlaying}
                        className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-white disabled:opacity-50"
                      >
                        <Pause size={20} />
                      </button>
                      <audio
                        ref={audioRef}
                        onEnded={handleAudioEnded}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-center gap-4">
                  {currentPart < parts.length - 1 ? (
                    <button
                      onClick={handleNextPart}
                      className="px-8 py-3 gradient-bg text-white rounded-xl font-semibold"
                    >
                      Next Part
                      <ArrowRight size={20} className="inline ml-2" />
                    </button>
                  ) : (
                    <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl px-8 py-3">
                      <span className="text-primary-400 font-semibold">All parts completed!</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Level Tips */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="bg-white/5 rounded-xl p-4">
            <h5 className="text-sm font-semibold text-gray-400 mb-2">Tips for {level} Level:</h5>
            <ul className="space-y-1 text-sm text-gray-300">
              {level === 'B1' && (
                <>
                  <li>• Speak clearly and at a natural pace</li>
                  <li>• Use simple but correct vocabulary</li>
                  <li>• Give short, direct answers to questions</li>
                </>
              )}
              {level === 'B2' && (
                <>
                  <li>• Use a variety of vocabulary and expressions</li>
                  <li>• Develop your answers with examples</li>
                  <li>• Use appropriate linking words</li>
                  <li>• Show ability to discuss abstract topics</li>
                </>
              )}
              {level === 'C1' && (
                <>
                  <li>• Use sophisticated vocabulary and idiomatic language</li>
                  <li>• Express complex ideas with precision</li>
                  <li>• Use appropriate discourse markers</li>
                  <li>• Demonstrate critical thinking skills</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
