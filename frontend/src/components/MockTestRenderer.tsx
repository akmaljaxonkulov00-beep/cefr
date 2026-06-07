'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Play, Pause, Clock, ArrowRight, ArrowLeft, FileText, Headphones, PenTool, Mic, AlertTriangle } from 'lucide-react';
import { MockTest, UserAnswers, Question } from '@/types/mock-test';
import toast from 'react-hot-toast';

interface MockTestRendererProps {
  testId: string;
  onComplete: (answers: UserAnswers) => void;
}

export default function MockTestRenderer({ testId, onComplete }: MockTestRendererProps) {
  const [mockTest, setMockTest] = useState<MockTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState<'reading' | 'listening' | 'writing' | 'speaking'>('reading');
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [answers, setAnswers] = useState<UserAnswers>({
    reading: {},
    listening: {},
    writing: {},
    speaking: {},
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileTab, setMobileTab] = useState<'content' | 'questions'>('content');
  const [infractionCount, setInfractionCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Page Visibility API - Anti-cheat
    const handleVisibilityChange = () => {
      if (document.hidden && mockTest) {
        const newCount = infractionCount + 1;
        setInfractionCount(newCount);
        setShowWarningModal(true);

        if (newCount >= 3) {
          toast.error('Test avtomatik tugatildi - 3 ta qoidabuzarlik!');
          onComplete(answers);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [testId, mockTest, infractionCount, answers, onComplete]);

  useEffect(() => {
    fetchTest();
  }, [testId]);

  useEffect(() => {
    if (mockTest && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            toast.error('Vaqt tugadi!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [mockTest, timeRemaining]);

  const fetchTest = async () => {
    try {
      const { data } = await api.get(`/api/exams/${testId}`);
      setMockTest(data);
      setTimeRemaining(data.metadata.duration * 60);
    } catch (error) {
      toast.error('Test yuklab bo\'lmadi');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (section: keyof UserAnswers, itemId: string, questionId: string, value: string | string[]) => {
    setAnswers((prev) => {
      const sectionData = prev[section] as Record<string, any>;
      return {
        ...prev,
        [section]: {
          ...sectionData,
          [itemId]: {
            ...(sectionData[itemId] || {}),
            [questionId]: value,
          },
        },
      };
    });
  };

  const handleWritingAnswer = (taskId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      writing: {
        ...prev.writing,
        [taskId]: value,
      },
    }));
  };

  const handleSpeakingAnswer = (partId: string, questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      speaking: {
        ...prev.speaking,
        [partId]: {
          ...prev.speaking[partId],
          [questionId]: value,
        },
      },
    }));
  };

  const handleComplete = () => {
    onComplete(answers);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!mockTest) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <p className="text-gray-400">Test topilmadi</p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#0f172a] select-none">
      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="glass-dark rounded-2xl p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Qoidabuzarlik!</h3>
              <p className="text-gray-400 mb-4">
                Siz test oynasini tark etdingiz. Bu {infractionCount}-chi qoidabuzarlik.
              </p>
              <p className="text-amber-400 text-sm mb-6">
                3 ta qoidabuzarlikdan so'ng test avtomatik tugatiladi.
              </p>
              <button
                onClick={() => setShowWarningModal(false)}
                className="px-6 py-2 gradient-bg text-white rounded-lg"
              >
                Tushunarli
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="glass-dark border-b border-gray-800 p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{mockTest.metadata.title}</h1>
            <p className="text-gray-400 text-sm">{mockTest.metadata.type} - {mockTest.metadata.level}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white">
              <Clock size={20} />
              <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
            </div>
            <button
              onClick={handleComplete}
              className="px-4 py-2 gradient-bg text-white rounded-lg text-sm"
            >
              Tugatish
            </button>
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex gap-2 mb-6">
          {[
            { id: 'reading' as const, label: 'Reading', icon: FileText },
            { id: 'listening' as const, label: 'Listening', icon: Headphones },
            { id: 'writing' as const, label: 'Writing', icon: PenTool },
            { id: 'speaking' as const, label: 'Speaking', icon: Mic },
          ].map((section) => (
            <button
              key={section.id}
              onClick={() => setCurrentSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                currentSection === section.id
                  ? 'gradient-bg text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              <section.icon size={18} />
              {section.label}
            </button>
          ))}
        </div>

        {/* Section Content */}
        <motion.div
          key={currentSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-dark rounded-2xl p-6"
        >
          {currentSection === 'reading' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Reading</h2>
                {mockTest.reading.passages.length > 1 && (
                  <div className="flex gap-2">
                    {mockTest.reading.passages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentPassageIndex(idx)}
                        className={`px-3 py-1 rounded-lg ${
                          currentPassageIndex === idx
                            ? 'gradient-bg text-white'
                            : 'bg-gray-700 text-gray-400'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Tab Switch */}
              {mounted && isMobile && (
                <div className="sticky top-0 z-20 bg-[#0f172a] border-b border-gray-700 pb-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMobileTab('content')}
                      className={`flex-1 px-4 py-2 rounded-lg ${
                        mobileTab === 'content'
                          ? 'gradient-bg text-white'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      Passage
                    </button>
                    <button
                      onClick={() => setMobileTab('questions')}
                      className={`flex-1 px-4 py-2 rounded-lg ${
                        mobileTab === 'questions'
                          ? 'gradient-bg text-white'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      Questions
                    </button>
                  </div>
                </div>
              )}

              {mockTest.reading.passages[currentPassageIndex] && (
                <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-2 gap-6'}`}>
                  {/* Passage */}
                  {(!isMobile || mobileTab === 'content') && (
                    <div className="bg-white/5 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        {mockTest.reading.passages[currentPassageIndex].title}
                      </h3>
                      <div className="text-gray-300 whitespace-pre-wrap leading-relaxed select-none">
                        {mockTest.reading.passages[currentPassageIndex].content}
                      </div>
                    </div>
                  )}

                  {/* Questions */}
                  {(!isMobile || mobileTab === 'questions') && (
                    <div className="space-y-4">
                      {mockTest.reading.passages[currentPassageIndex].questions.map((question, qIdx) => (
                        <div key={question.id} className="bg-white/5 rounded-xl p-4">
                          <p className="text-white mb-3">
                            <span className="text-primary-400 font-semibold">{qIdx + 1}.</span> {question.question}
                          </p>
                          {question.type === 'MCQ' && question.options && (
                            <div className="space-y-2">
                              {question.options.map((option, oIdx) => (
                                <label key={oIdx} className="flex items-center gap-3 text-gray-300 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`reading-${mockTest.reading.passages[currentPassageIndex].id}-${question.id}`}
                                    value={option}
                                    onChange={(e) =>
                                      handleAnswerChange(
                                        'reading',
                                        mockTest.reading.passages[currentPassageIndex].id,
                                        question.id,
                                        e.target.value
                                      )
                                    }
                                    className="w-4 h-4"
                                  />
                                  {option}
                                </label>
                              ))}
                            </div>
                          )}
                          {question.type === 'FILL_BLANKS' && (
                            <input
                              type="text"
                              placeholder="Javobingizni kiriting"
                              onChange={(e) =>
                                handleAnswerChange(
                                  'reading',
                                  mockTest.reading.passages[currentPassageIndex].id,
                                  question.id,
                                  e.target.value
                                )
                              }
                              className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {currentSection === 'listening' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Listening</h2>
                {mockTest.listening.sections.length > 1 && (
                  <div className="flex gap-2">
                    {mockTest.listening.sections.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSectionIndex(idx)}
                        className={`px-3 py-1 rounded-lg ${
                          currentSectionIndex === idx
                            ? 'gradient-bg text-white'
                            : 'bg-gray-700 text-gray-400'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {mockTest.listening.sections[currentSectionIndex] && (
                <div>
                  {/* Audio Player */}
                  <div className="bg-white/5 rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      {mockTest.listening.sections[currentSectionIndex].title}
                    </h3>
                    {mockTest.listening.sections[currentSectionIndex].audioUrl && (
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="w-12 h-12 gradient-bg rounded-full flex items-center justify-center text-white"
                        >
                          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                        </button>
                        <audio
                          src={mockTest.listening.sections[currentSectionIndex].audioUrl}
                          controls
                          className="flex-1"
                        />
                      </div>
                    )}
                  </div>

                  {/* Questions */}
                  <div className="space-y-4">
                    {mockTest.listening.sections[currentSectionIndex].questions.map((question, qIdx) => (
                      <div key={question.id} className="bg-white/5 rounded-xl p-4">
                        <p className="text-white mb-3">
                          <span className="text-primary-400 font-semibold">{qIdx + 1}.</span> {question.question}
                        </p>
                        {question.type === 'MCQ' && question.options && (
                          <div className="space-y-2">
                            {question.options.map((option, oIdx) => (
                              <label key={oIdx} className="flex items-center gap-3 text-gray-300 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`listening-${mockTest.listening.sections[currentSectionIndex].id}-${question.id}`}
                                  value={option}
                                  onChange={(e) =>
                                    handleAnswerChange(
                                      'listening',
                                      mockTest.listening.sections[currentSectionIndex].id,
                                      question.id,
                                      e.target.value
                                    )
                                  }
                                  className="w-4 h-4"
                                />
                                {option}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentSection === 'writing' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">Writing</h2>

              {/* Mobile Tab Switch */}
              {mounted && isMobile && (
                <div className="sticky top-0 z-20 bg-[#0f172a] border-b border-gray-700 pb-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMobileTab('content')}
                      className={`flex-1 px-4 py-2 rounded-lg ${
                        mobileTab === 'content'
                          ? 'gradient-bg text-white'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      Prompt
                    </button>
                    <button
                      onClick={() => setMobileTab('questions')}
                      className={`flex-1 px-4 py-2 rounded-lg ${
                        mobileTab === 'questions'
                          ? 'gradient-bg text-white'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      Editor
                    </button>
                  </div>
                </div>
              )}

              {mockTest.writing.tasks.map((task, idx) => (
                <div key={task.id} className={`${isMobile ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-2 gap-6'}`}>
                  {/* Prompt */}
                  {(!isMobile || mobileTab === 'content') && (
                    <div className="bg-white/5 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Task {task.taskNumber}</h3>
                        <div className="text-gray-400 text-sm">
                          {task.wordLimit} words • {task.timeLimit} min
                        </div>
                      </div>
                      <p className="text-gray-300 select-none">{task.prompt}</p>
                    </div>
                  )}

                  {/* Editor */}
                  {(!isMobile || mobileTab === 'questions') && (
                    <div className="bg-white/5 rounded-xl p-6">
                      <textarea
                        placeholder="Essayingizni yozing..."
                        onChange={(e) => handleWritingAnswer(task.id, e.target.value)}
                        onPaste={(e) => e.preventDefault()}
                        onDrop={(e) => e.preventDefault()}
                        onContextMenu={(e) => e.preventDefault()}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-3 text-white h-48 resize-none select-none"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {currentSection === 'speaking' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">Speaking</h2>
              {mockTest.speaking.parts.map((part, idx) => (
                <div key={part.id} className="bg-white/5 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Part {part.partNumber}</h3>
                    <div className="text-gray-400 text-sm">{part.timeLimit} min</div>
                  </div>
                  <div className="space-y-4">
                    {part.questions.map((question, qIdx) => (
                      <div key={qIdx}>
                        <p className="text-gray-300 mb-2">{question}</p>
                        <textarea
                          placeholder="Javobingizni yozing..."
                          onChange={(e) => handleSpeakingAnswer(part.id, qIdx.toString(), e.target.value)}
                          className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white h-24"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
