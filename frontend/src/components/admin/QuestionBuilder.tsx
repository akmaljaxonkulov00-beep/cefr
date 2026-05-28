'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';

export interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false_ng' | 'fill_blank' | 'short_answer' | 'matching' | 'open_cloze' | 'word_formation';
  options?: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
}

interface QuestionBuilderProps {
  questions: Question[];
  onChange: (questions: Question[]) => void;
  partType: 'ielts-reading' | 'cefr-reading' | 'ielts-listening' | 'cefr-listening';
  partNumber: number;
}

const QUESTION_TYPES = {
  'ielts-reading': ['multiple_choice', 'true_false_ng', 'fill_blank', 'short_answer', 'matching'],
  'cefr-reading': ['multiple_choice', 'true_false_ng', 'fill_blank', 'short_answer', 'matching', 'open_cloze', 'word_formation'],
  'ielts-listening': ['fill_blank', 'multiple_choice', 'matching'],
  'cefr-listening': ['multiple_choice', 'true_false_ng', 'fill_blank', 'short_answer'],
};

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: 'Ko\'p tanlov',
  true_false_ng: 'To\'g\'ri / Notog\'ri / Berilmagan',
  fill_blank: 'Bo\'sh joyni to\'ldirish',
  short_answer: 'Qisqa javob',
  matching: 'Moslashtirish',
  open_cloze: 'Ochiq bo\'sh joy',
  word_formation: 'So\'z shakllantirish',
};

export default function QuestionBuilder({ questions, onChange, partType, partNumber }: QuestionBuilderProps) {
  const availableTypes = QUESTION_TYPES[partType] || QUESTION_TYPES['ielts-reading'];

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: '',
      type: availableTypes[0] as any,
      correctAnswer: '',
      points: 1,
    };
    onChange([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    onChange(
      questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const removeQuestion = (id: string) => {
    onChange(questions.filter((q) => q.id !== id));
  };

  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);

  const getQuestionTypeLabel = (type: string) => TYPE_LABELS[type] || type;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Savollar</h3>
        <button
          onClick={addQuestion}
          className="flex items-center gap-2 px-4 py-2 gradient-bg text-white rounded-lg font-medium transition hover:opacity-90"
        >
          <Plus size={18} />
          Savol qo'shish
        </button>
      </div>

      <div className="text-sm text-gray-400">
        Jami: {questions.length} savol | {totalPoints} ball
      </div>

      {partType === 'ielts-reading' && (
        <div className="text-sm text-gray-500 bg-white/5 p-3 rounded-lg">
          IELTS Reading Part 1: 13 savol | Part 2: 13 savol | Part 3: 14 savol
        </div>
      )}

      {partType === 'ielts-listening' && (
        <div className="text-sm text-gray-500 bg-white/5 p-3 rounded-lg">
          IELTS Listening Part {partNumber} uchun odatda 10 ta savol
        </div>
      )}

      <div className="space-y-4">
        {questions.map((question, index) => (
          <div key={question.id} className="glass-dark rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex items-center gap-2 mt-2">
                <GripVertical className="w-5 h-5 text-gray-500 cursor-move" />
                <span className="px-3 py-1 rounded-lg bg-primary-500/20 text-primary-400 text-sm font-medium">
                  Q{index + 1}
                </span>
              </div>
              <div className="flex-1 space-y-4">
                {/* Question Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Savol matni
                  </label>
                  <textarea
                    value={question.text}
                    onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                    className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition resize-none"
                    rows={3}
                    placeholder="Savolni kiriting..."
                  />
                </div>

                {/* Question Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Savol turi
                  </label>
                  <select
                    value={question.type}
                    onChange={(e) => updateQuestion(question.id, 'type', e.target.value)}
                    className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                  >
                    {availableTypes.map((type) => (
                      <option key={type} value={type}>
                        {getQuestionTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type-specific fields */}
                {question.type === 'multiple_choice' && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-300">
                      Variantlar (A, B, C, D)
                    </label>
                    {['A', 'B', 'C', 'D'].map((letter, optIndex) => (
                      <div key={letter} className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-primary-500/20 text-primary-400 flex items-center justify-center font-medium">
                          {letter}
                        </span>
                        <input
                          type="text"
                          value={question.options?.[optIndex] || ''}
                          onChange={(e) => {
                            const newOptions = [...(question.options || ['', '', '', ''])];
                            newOptions[optIndex] = e.target.value;
                            updateQuestion(question.id, 'options', newOptions);
                          }}
                          className="flex-1 bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500 transition"
                          placeholder={`Variant ${letter}`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {question.type === 'true_false_ng' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      To'g'ri javob
                    </label>
                    <div className="flex gap-3">
                      {['TRUE', 'FALSE', 'NOT_GIVEN'].map((value) => (
                        <button
                          key={value}
                          onClick={() => updateQuestion(question.id, 'correctAnswer', value)}
                          className={`flex-1 py-3 rounded-lg font-medium transition ${
                            question.correctAnswer === value
                              ? 'gradient-bg text-white'
                              : 'bg-white/10 text-gray-300 hover:bg-white/20'
                          }`}
                        >
                          {value === 'TRUE' ? 'To\'g\'ri' : value === 'FALSE' ? 'Noto\'g\'ri' : 'Berilmagan'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {question.type === 'fill_blank' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      To'g'ri javob
                    </label>
                    <input
                      type="text"
                      value={question.correctAnswer}
                      onChange={(e) => updateQuestion(question.id, 'correctAnswer', e.target.value)}
                      className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                      placeholder="To'g'ri javobni kiriting..."
                    />
                  </div>
                )}

                {question.type === 'short_answer' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      To'g'ri javob
                    </label>
                    <input
                      type="text"
                      value={question.correctAnswer}
                      onChange={(e) => updateQuestion(question.id, 'correctAnswer', e.target.value)}
                      className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                      placeholder="Javobni kiriting..."
                    />
                  </div>
                )}

                {question.type === 'matching' && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-300">
                      Moslashtirish juftlari
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Chap tomon (sarlavha)</label>
                        <input
                          type="text"
                          value={question.options?.[0] || ''}
                          onChange={(e) => {
                            const newOptions = [...(question.options || ['', ''])];
                            newOptions[0] = e.target.value;
                            updateQuestion(question.id, 'options', newOptions);
                          }}
                          className="w-full bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 transition"
                          placeholder="Sarlavha"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">O'ng tomon (harf)</label>
                        <input
                          type="text"
                          value={question.options?.[1] || ''}
                          onChange={(e) => {
                            const newOptions = [...(question.options || ['', ''])];
                            newOptions[1] = e.target.value;
                            updateQuestion(question.id, 'options', newOptions);
                          }}
                          className="w-full bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 transition"
                          placeholder="A, B, C..."
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">To'g'ri javob (mos keladigan harf)</label>
                      <input
                        type="text"
                        value={question.correctAnswer}
                        onChange={(e) => updateQuestion(question.id, 'correctAnswer', e.target.value)}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 transition"
                        placeholder="A, B, C..."
                      />
                    </div>
                  </div>
                )}

                {question.type === 'open_cloze' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      To'g'ri so'z
                    </label>
                    <input
                      type="text"
                      value={question.correctAnswer}
                      onChange={(e) => updateQuestion(question.id, 'correctAnswer', e.target.value)}
                      className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                      placeholder="To'g'ri so'zni kiriting..."
                    />
                  </div>
                )}

                {question.type === 'word_formation' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Asosiy so'z
                      </label>
                      <input
                        type="text"
                        value={question.options?.[0] || ''}
                        onChange={(e) => {
                          const newOptions = [...(question.options || ['', ''])];
                          newOptions[0] = e.target.value;
                          updateQuestion(question.id, 'options', newOptions);
                        }}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                        placeholder="Asosiy so'z"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        To'g'ri shakl
                      </label>
                      <input
                        type="text"
                        value={question.correctAnswer}
                        onChange={(e) => updateQuestion(question.id, 'correctAnswer', e.target.value)}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                        placeholder="O'zgartirilgan shakl"
                      />
                    </div>
                  </div>
                )}

                {/* Points */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ball
                  </label>
                  <input
                    type="number"
                    value={question.points}
                    onChange={(e) => updateQuestion(question.id, 'points', parseInt(e.target.value) || 1)}
                    className="w-24 bg-white/5 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                    min="1"
                  />
                </div>

                {/* Explanation (optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Izoh (ixtiyoriy)
                  </label>
                  <textarea
                    value={question.explanation || ''}
                    onChange={(e) => updateQuestion(question.id, 'explanation', e.target.value)}
                    className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition resize-none"
                    rows={2}
                    placeholder="Izohni kiriting..."
                  />
                </div>
              </div>

              <button
                onClick={() => removeQuestion(question.id)}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {questions.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-xl">
          <p className="text-gray-400 mb-4">Hali savol qo'shilmagan</p>
          <button
            onClick={addQuestion}
            className="inline-flex items-center gap-2 px-4 py-2 gradient-bg text-white rounded-lg font-medium transition hover:opacity-90"
          >
            <Plus size={18} />
            Birinchi savolni qo'shish
          </button>
        </div>
      )}
    </div>
  );
}
