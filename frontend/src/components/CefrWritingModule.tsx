'use client';

import { useState, useEffect } from 'react';
import { FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export interface CefrWritingTask {
  id: string;
  taskNumber: 1 | 2;
  taskType: 'LETTER' | 'EMAIL' | 'ESSAY' | 'ARTICLE' | 'REVIEW';
  prompt: string;
  bulletPoints?: string[];
  minWords: number;
  maxWords: number;
  timeLimit: number; // in minutes
}

interface CefrWritingModuleProps {
  tasks: CefrWritingTask[];
  onAnswerChange: (taskId: string, answer: string) => void;
  answers: Record<string, string>;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
}

export default function CefrWritingModule({ tasks, onAnswerChange, answers, level }: CefrWritingModuleProps) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [activeTask, setActiveTask] = useState(0);

  useEffect(() => {
    if (tasks.length > 0) {
      setTimeRemaining(tasks[activeTask].timeLimit * 60);
    }
  }, [activeTask, tasks]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getWordCountStatus = (wordCount: number, minWords: number, maxWords: number) => {
    if (wordCount < minWords) {
      return { status: 'too-short', message: `Too short (min: ${minWords})` };
    }
    if (wordCount > maxWords) {
      return { status: 'too-long', message: `Too long (max: ${maxWords})` };
    }
    return { status: 'valid', message: 'Perfect length' };
  };

  const currentTask = tasks[activeTask];
  const currentAnswer = answers[currentTask?.id] || '';
  const wordCount = countWords(currentAnswer);
  const wordCountStatus = currentTask ? getWordCountStatus(wordCount, currentTask.minWords, currentTask.maxWords) : null;

  return (
    <div className="space-y-6">
      <div className="glass-dark rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Writing</h3>
          <div className="flex items-center gap-2 text-gray-400">
            <Clock size={18} />
            <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
          </div>
        </div>

        {/* Task Navigation */}
        {tasks.length > 1 && (
          <div className="flex gap-2 mb-6">
            {tasks.map((task, idx) => (
              <button
                key={task.id}
                onClick={() => setActiveTask(idx)}
                className={`px-4 py-2 rounded-lg transition ${
                  activeTask === idx
                    ? 'gradient-bg text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                Task {task.taskNumber}
              </button>
            ))}
          </div>
        )}

        {currentTask && (
          <div className="space-y-6">
            {/* Task Prompt */}
            <div className="bg-white/5 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={20} className="text-primary-400" />
                <h4 className="text-lg font-semibold text-white">
                  Task {currentTask.taskNumber}: {currentTask.taskType}
                </h4>
              </div>

              <p className="text-gray-300 mb-4">{currentTask.prompt}</p>

              {currentTask.bulletPoints && currentTask.bulletPoints.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-semibold text-gray-400 mb-2">You must include:</h5>
                  <ul className="space-y-2">
                    {currentTask.bulletPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-300 text-sm">
                        <span className="text-primary-400 mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>Word count: {currentTask.minWords} - {currentTask.maxWords}</span>
                  <span>Time: {currentTask.timeLimit} minutes</span>
                </div>
              </div>
            </div>

            {/* Writing Area */}
            <div className="bg-white/5 rounded-xl p-6">
              <textarea
                value={currentAnswer}
                onChange={(e) => onAnswerChange(currentTask.id, e.target.value)}
                placeholder="Start writing your response here..."
                className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-3 text-white h-96 resize-none focus:outline-none focus:border-primary-500"
              />

              {/* Word Count Indicator */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {wordCountStatus && (
                    <>
                      {wordCountStatus.status === 'valid' && (
                        <span className="flex items-center gap-1 text-sm text-emerald-400">
                          <CheckCircle size={16} />
                          {wordCount} words - {wordCountStatus.message}
                        </span>
                      )}
                      {wordCountStatus.status === 'too-short' && (
                        <span className="flex items-center gap-1 text-sm text-amber-400">
                          <AlertCircle size={16} />
                          {wordCount} words - {wordCountStatus.message}
                        </span>
                      )}
                      {wordCountStatus.status === 'too-long' && (
                        <span className="flex items-center gap-1 text-sm text-red-400">
                          <AlertCircle size={16} />
                          {wordCount} words - {wordCountStatus.message}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Word Count Progress Bar */}
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        wordCountStatus?.status === 'valid'
                          ? 'bg-emerald-500'
                          : wordCountStatus?.status === 'too-short'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{
                        width: `${Math.min(100, (wordCount / currentTask.maxWords) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-400">{wordCount}</span>
                </div>
              </div>
            </div>

            {/* Writing Tips */}
            <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-4">
              <h5 className="text-sm font-semibold text-primary-400 mb-2">Tips for {level} Level:</h5>
              <ul className="space-y-1 text-sm text-gray-300">
                {level === 'B1' && (
                  <>
                    <li>• Use simple but correct grammar</li>
                    <li>• Include relevant vocabulary from the topic</li>
                    <li>• Organize your ideas clearly with paragraphs</li>
                  </>
                )}
                {level === 'B2' && (
                  <>
                    <li>• Use a variety of complex structures</li>
                    <li>• Include topic-specific vocabulary</li>
                    <li>• Use linking words to connect ideas</li>
                    <li>• Address all bullet points in detail</li>
                  </>
                )}
                {level === 'C1' && (
                  <>
                    <li>• Use sophisticated vocabulary and idiomatic expressions</li>
                    <li>• Demonstrate advanced grammatical control</li>
                    <li>• Develop arguments with depth and nuance</li>
                    <li>• Use appropriate tone and register</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
