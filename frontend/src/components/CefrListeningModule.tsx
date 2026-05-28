'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, AlertCircle } from 'lucide-react';

interface CefrListeningModuleProps {
  audioUrl: string;
  transcript?: string;
  questions: Array<{
    id: string;
    question: string;
    options?: string[];
    type: 'MCQ' | 'SHORT_ANSWER';
  }>;
  onAnswerChange: (questionId: string, answer: string) => void;
  answers: Record<string, string>;
  maxPlays?: number;
}

export default function CefrListeningModule({
  audioUrl,
  transcript,
  questions,
  onAnswerChange,
  answers,
  maxPlays = 2,
}: CefrListeningModuleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlayPause = () => {
    if (playCount >= maxPlays) return;

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play();
      setIsPlaying(true);
      if (playCount === 0) {
        setPlayCount(1);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (playCount === 1) {
      setPlayCount(2);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingPlays = maxPlays - playCount;

  return (
    <div className="space-y-6">
      <div className="glass-dark rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Listening</h3>
          <div className="flex items-center gap-2">
            {remainingPlays > 0 ? (
              <span className="text-sm text-gray-400">
                {remainingPlays} play{remainingPlays > 1 ? 's' : ''} remaining
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sm text-red-400">
                <AlertCircle size={16} />
                No plays remaining
              </span>
            )}
          </div>
        </div>

        {/* Audio Player */}
        <div className="bg-white/5 rounded-xl p-6 mb-6">
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            className="hidden"
          />

          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handlePlayPause}
              disabled={playCount >= maxPlays}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
                playCount >= maxPlays
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'gradient-bg text-white hover:opacity-90'
              }`}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>

            <div className="flex-1">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full gradient-bg transition-all duration-300"
                  style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <Volume2 size={20} className="text-gray-400" />
          </div>

          {transcript && (
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="text-sm text-primary-400 hover:text-primary-300 transition"
            >
              {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
            </button>
          )}

          {showTranscript && transcript && (
            <div className="mt-4 p-4 bg-white/5 rounded-lg">
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{transcript}</p>
            </div>
          )}
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((question, idx) => (
            <div key={question.id} className="bg-white/5 rounded-xl p-4">
              <p className="text-white mb-3">
                <span className="text-primary-400 font-semibold">{idx + 1}.</span> {question.question}
              </p>

              {question.type === 'MCQ' && question.options && (
                <div className="space-y-2">
                  {question.options.map((option, oIdx) => (
                    <label
                      key={oIdx}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                        answers[question.id] === option
                          ? 'bg-primary-500/20 border border-primary-500 text-white'
                          : 'bg-gray-700/50 border border-gray-600 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`listening-${question.id}`}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={(e) => onAnswerChange(question.id, e.target.value)}
                        className="w-4 h-4"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'SHORT_ANSWER' && (
                <input
                  type="text"
                  placeholder="Type your answer..."
                  value={answers[question.id] || ''}
                  onChange={(e) => onAnswerChange(question.id, e.target.value)}
                  className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
