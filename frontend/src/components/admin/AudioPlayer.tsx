'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, X, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  url: string;
  filename: string;
  onRemove: () => void;
}

export default function AudioPlayer({ url, filename, onRemove }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = (parseFloat(e.target.value) / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border-2 border-green-500 bg-green-500/5 rounded-xl p-4">
      <audio ref={audioRef} src={url} />
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white hover:opacity-90 transition"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <div className="flex items-center gap-2 text-gray-400">
            <Volume2 size={16} />
            <span className="text-sm">{filename}</span>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="p-2 text-gray-400 hover:text-red-400 transition"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-gray-400 text-sm w-12">{formatTime(currentTime)}</span>
        <input
          type="range"
          min="0"
          max="100"
          value={duration > 0 ? (currentTime / duration) * 100 : 0}
          onChange={handleSeek}
          className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
        <span className="text-gray-400 text-sm w-12">{formatTime(duration)}</span>
      </div>
    </div>
  );
}
