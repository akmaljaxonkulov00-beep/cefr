'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

export interface ClozeQuestion {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'OPEN_CLOZE';
  text: string;
  gaps: {
    id: string;
    position: number;
    options?: string[];
    correctAnswer: string;
  }[];
}

interface CefrReadingModuleProps {
  passage: string;
  questions: ClozeQuestion[];
  onAnswerChange: (questionId: string, gapId: string, answer: string) => void;
  answers: Record<string, Record<string, string>>;
}

export default function CefrReadingModule({ passage, questions, onAnswerChange, answers }: CefrReadingModuleProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const renderClozeText = (text: string, question: ClozeQuestion) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Sort gaps by position
    const sortedGaps = [...question.gaps].sort((a, b) => a.position - b.position);

    sortedGaps.forEach((gap, idx) => {
      // Add text before gap
      parts.push(
        <span key={`text-${idx}`} className="text-gray-300">
          {text.slice(lastIndex, gap.position)}
        </span>
      );

      // Add gap component
      if (question.type === 'MULTIPLE_CHOICE') {
        const isActive = activeDropdown === gap.id;
        const selectedAnswer = answers[question.id]?.[gap.id];

        parts.push(
          <span key={`gap-${idx}`} className="inline-block mx-1">
            <select
              value={selectedAnswer || ''}
              onChange={(e) => onAnswerChange(question.id, gap.id, e.target.value)}
              onFocus={() => setActiveDropdown(gap.id)}
              onBlur={() => setActiveDropdown(null)}
              className={`px-2 py-1 rounded border ${
                isActive
                  ? 'border-primary-500 bg-primary-500/20 text-white'
                  : selectedAnswer
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                  : 'border-gray-600 bg-gray-700 text-gray-300'
              }`}
            >
              <option value="">---</option>
              {gap.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </span>
        );
      } else {
        // OPEN_CLOZE - input field
        const selectedAnswer = answers[question.id]?.[gap.id];
        parts.push(
          <span key={`gap-${idx}`} className="inline-block mx-1">
            <input
              type="text"
              value={selectedAnswer || ''}
              onChange={(e) => onAnswerChange(question.id, gap.id, e.target.value)}
              placeholder="___"
              className={`w-20 px-2 py-1 rounded border text-center ${
                selectedAnswer
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                  : 'border-gray-600 bg-gray-700 text-gray-300 placeholder-gray-500'
              }`}
            />
          </span>
        );
      }

      lastIndex = gap.position;
    });

    // Add remaining text
    parts.push(
      <span key="text-end" className="text-gray-300">
        {text.slice(lastIndex)}
      </span>
    );

    return parts;
  };

  return (
    <div className="space-y-6">
      <div className="glass-dark rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Reading & Grammar</h3>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <CheckCircle size={16} className="text-emerald-400" />
              Multiple Choice Cloze
            </span>
            <span className="flex items-center gap-1">
              <AlertCircle size={16} className="text-amber-400" />
              Open Cloze
            </span>
          </div>
        </div>

        {questions.map((question, qIdx) => (
          <div key={question.id} className="mb-6">
            <div className="bg-white/5 rounded-xl p-6">
              <div className="mb-4">
                <span className="text-primary-400 font-semibold text-sm">Question {qIdx + 1}</span>
                <span className="text-gray-500 text-sm ml-2">
                  ({question.type === 'MULTIPLE_CHOICE' ? 'Multiple Choice' : 'Open Cloze'})
                </span>
              </div>

              <div className="text-lg leading-relaxed text-gray-300">
                {renderClozeText(question.text, question)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
