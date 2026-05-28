'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Plus, Trash2, FileText, Headphones, PenTool, Mic } from 'lucide-react';
import { MockTest, Question, ReadingPassage, ListeningSection, WritingTask, SpeakingPart } from '@/types/mock-test';

interface MockUploadFormProps {
  onSubmit: (mockTest: Partial<MockTest>) => void;
  onCancel: () => void;
  loading: boolean;
  initialType?: 'CEFR' | 'IELTS';
}

export default function MockUploadForm({ onSubmit, onCancel, loading, initialType }: MockUploadFormProps) {
  const [currentTab, setCurrentTab] = useState(0);
  const [mockTest, setMockTest] = useState<Partial<MockTest>>({
    metadata: {
      id: '',
      title: '',
      type: initialType || 'CEFR',
      level: 'B1',
      duration: 120,
      createdAt: new Date().toISOString(),
      createdBy: '',
    },
    reading: {
      passages: [],
      timeLimit: 60,
    },
    listening: {
      sections: [],
      timeLimit: 30,
    },
    writing: {
      tasks: [],
      timeLimit: 60,
    },
    speaking: {
      parts: [],
      timeLimit: 15,
    },
  });

  const tabs = [
    { id: 0, label: 'General Info & Listening', icon: Headphones },
    { id: 1, label: 'Reading', icon: FileText },
    { id: 2, label: 'Writing & Speaking', icon: PenTool },
  ];

  const addListeningSection = () => {
    const isCEFR = mockTest.metadata?.type === 'CEFR';
    const currentSections = mockTest.listening?.sections || [];
    
    const newSection: ListeningSection = {
      id: Date.now().toString(),
      title: isCEFR 
        ? `Part ${(currentSections.length + 1)}` 
        : `Section ${(currentSections.length + 1)}`,
      audioUrl: '',
      transcript: '',
      questions: [],
    };
    setMockTest({
      ...mockTest,
      listening: {
        sections: [...currentSections, newSection],
        timeLimit: isCEFR ? 25 : 30,
      },
    });
  };

  const addReadingPassage = () => {
    const isCEFR = mockTest.metadata?.type === 'CEFR';
    const currentPassages = mockTest.reading?.passages || [];
    
    const newPassage: ReadingPassage = {
      id: Date.now().toString(),
      title: isCEFR 
        ? `Part ${(currentPassages.length + 1)}` 
        : `Passage ${(currentPassages.length + 1)}`,
      content: '',
      paragraphs: [''],
      questions: [],
    };
    setMockTest({
      ...mockTest,
      reading: {
        passages: [...currentPassages, newPassage],
        timeLimit: isCEFR ? 45 : 60,
      },
    });
  };

  const addWritingTask = () => {
    const isCEFR = mockTest.metadata?.type === 'CEFR';
    const currentTasks = mockTest.writing?.tasks || [];
    
    let taskNumber: 1 | 2 | 1.1 | 1.2;
    if (isCEFR) {
      if (currentTasks.length === 0) taskNumber = 1.1;
      else if (currentTasks.length === 1) taskNumber = 1.2;
      else taskNumber = 2;
    } else {
      taskNumber = (currentTasks.length + 1) as 1 | 2;
    }

    const newTask: WritingTask = {
      id: Date.now().toString(),
      taskNumber,
      prompt: '',
      wordLimit: isCEFR ? 200 : 250,
      timeLimit: isCEFR ? 30 : 40,
    };
    setMockTest({
      ...mockTest,
      writing: {
        tasks: [...currentTasks, newTask],
        timeLimit: mockTest.writing?.timeLimit || 60,
      },
    });
  };

  const addSpeakingPart = () => {
    const isCEFR = mockTest.metadata?.type === 'CEFR';
    const currentParts = mockTest.speaking?.parts || [];
    
    let partNumber: 1 | 2 | 3;
    if (isCEFR) {
      // CEFR has 3 parts
      partNumber = (currentParts.length + 1) as 1 | 2 | 3;
    } else {
      // IELTS also has 3 parts but different structure
      partNumber = (currentParts.length + 1) as 1 | 2 | 3;
    }

    const newPart: SpeakingPart = {
      id: Date.now().toString(),
      partNumber,
      questions: [],
      timeLimit: isCEFR ? 5 : 15,
    };
    setMockTest({
      ...mockTest,
      speaking: {
        parts: [...currentParts, newPart],
        timeLimit: mockTest.speaking?.timeLimit || 15,
      },
    });
  };

  const handleSubmit = () => {
    onSubmit(mockTest);
  };

  return (
    <div className="glass-dark rounded-2xl p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Mock Test Yaratish</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              currentTab === tab.id
                ? 'gradient-bg text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={currentTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-6"
      >
        {currentTab === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Mock nomi</label>
                <input
                  type="text"
                  value={mockTest.metadata?.title || ''}
                  onChange={(e) =>
                    setMockTest({
                      ...mockTest,
                      metadata: { ...mockTest.metadata!, title: e.target.value },
                    })
                  }
                  className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Test Type *</label>
                <select
                  value={mockTest.metadata?.type || 'CEFR'}
                  onChange={(e) =>
                    setMockTest({
                      ...mockTest,
                      metadata: { ...mockTest.metadata!, type: e.target.value as 'IELTS' | 'CEFR' },
                    })
                  }
                  className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="CEFR">CEFR</option>
                  <option value="IELTS">IELTS</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Daraja</label>
                <select
                  value={mockTest.metadata?.level || 'B1'}
                  onChange={(e) =>
                    setMockTest({
                      ...mockTest,
                      metadata: { ...mockTest.metadata!, level: e.target.value as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' },
                    })
                  }
                  className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="C1">C1</option>
                  <option value="C2">C2</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Davomiylik (daqiqa)</label>
                <input
                  type="number"
                  value={mockTest.metadata?.duration || 120}
                  onChange={(e) =>
                    setMockTest({
                      ...mockTest,
                      metadata: { ...mockTest.metadata!, duration: parseInt(e.target.value) },
                    })
                  }
                  className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Listening Sections</h3>
                <button
                  onClick={addListeningSection}
                  className="flex items-center gap-2 px-3 py-1 gradient-bg text-white rounded-lg text-sm"
                >
                  <Plus size={16} />
                  Section qo'shish
                </button>
              </div>
              {mockTest.listening?.sections?.map((section, idx) => (
                <div key={section.id} className="bg-white/5 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Section nomi</label>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => {
                          const sections = [...mockTest.listening!.sections!];
                          sections[idx] = { ...sections[idx], title: e.target.value };
                          setMockTest({
                            ...mockTest,
                            listening: { ...mockTest.listening!, sections },
                          });
                        }}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Audio URL</label>
                      <input
                        type="text"
                        value={section.audioUrl}
                        onChange={(e) => {
                          const sections = [...mockTest.listening!.sections!];
                          sections[idx] = { ...sections[idx], audioUrl: e.target.value };
                          setMockTest({
                            ...mockTest,
                            listening: { ...mockTest.listening!, sections },
                          });
                        }}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Transcript</label>
                    <textarea
                      value={section.transcript || ''}
                      onChange={(e) => {
                        const sections = [...mockTest.listening!.sections!];
                        sections[idx] = { ...sections[idx], transcript: e.target.value };
                        setMockTest({
                          ...mockTest,
                          listening: { ...mockTest.listening!, sections },
                        });
                      }}
                      className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white h-24"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentTab === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Reading Passages</h3>
              <button
                onClick={addReadingPassage}
                className="flex items-center gap-2 px-3 py-1 gradient-bg text-white rounded-lg text-sm"
              >
                <Plus size={16} />
                Passage qo'shish
              </button>
            </div>
            {mockTest.reading?.passages?.map((passage, idx) => (
              <div key={passage.id} className="bg-white/5 rounded-lg p-4 mb-4">
                <div className="mb-4">
                  <label className="block text-gray-400 text-sm mb-2">Passage nomi</label>
                  <input
                    type="text"
                    value={passage.title}
                    onChange={(e) => {
                      const passages = [...mockTest.reading!.passages!];
                      passages[idx] = { ...passages[idx], title: e.target.value };
                      setMockTest({
                        ...mockTest,
                        reading: { ...mockTest.reading!, passages },
                      });
                    }}
                    className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Content</label>
                  <textarea
                    value={passage.content}
                    onChange={(e) => {
                      const passages = [...mockTest.reading!.passages!];
                      passages[idx] = { ...passages[idx], content: e.target.value };
                      setMockTest({
                        ...mockTest,
                        reading: { ...mockTest.reading!, passages },
                      });
                    }}
                    className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white h-32"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {currentTab === 2 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Writing Tasks</h3>
                <button
                  onClick={addWritingTask}
                  className="flex items-center gap-2 px-3 py-1 gradient-bg text-white rounded-lg text-sm"
                >
                  <Plus size={16} />
                  Task qo'shish
                </button>
              </div>
              {mockTest.writing?.tasks?.map((task, idx) => (
                <div key={task.id} className="bg-white/5 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Task Number</label>
                      <select
                        value={task.taskNumber}
                        onChange={(e) => {
                          const tasks = [...mockTest.writing!.tasks!];
                          tasks[idx] = { ...tasks[idx], taskNumber: parseInt(e.target.value) as 1 | 2 };
                          setMockTest({
                            ...mockTest,
                            writing: { ...mockTest.writing!, tasks },
                          });
                        }}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      >
                        <option value={1}>Task 1</option>
                        <option value={2}>Task 2</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Word Limit</label>
                      <input
                        type="number"
                        value={task.wordLimit}
                        onChange={(e) => {
                          const tasks = [...mockTest.writing!.tasks!];
                          tasks[idx] = { ...tasks[idx], wordLimit: parseInt(e.target.value) };
                          setMockTest({
                            ...mockTest,
                            writing: { ...mockTest.writing!, tasks },
                          });
                        }}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Time Limit (min)</label>
                      <input
                        type="number"
                        value={task.timeLimit}
                        onChange={(e) => {
                          const tasks = [...mockTest.writing!.tasks!];
                          tasks[idx] = { ...tasks[idx], timeLimit: parseInt(e.target.value) };
                          setMockTest({
                            ...mockTest,
                            writing: { ...mockTest.writing!, tasks },
                          });
                        }}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Prompt</label>
                    <textarea
                      value={task.prompt}
                      onChange={(e) => {
                        const tasks = [...mockTest.writing!.tasks!];
                        tasks[idx] = { ...tasks[idx], prompt: e.target.value };
                        setMockTest({
                          ...mockTest,
                          writing: { ...mockTest.writing!, tasks },
                        });
                      }}
                      className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white h-24"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Speaking Parts</h3>
                <button
                  onClick={addSpeakingPart}
                  className="flex items-center gap-2 px-3 py-1 gradient-bg text-white rounded-lg text-sm"
                >
                  <Plus size={16} />
                  Part qo'shish
                </button>
              </div>
              {mockTest.speaking?.parts?.map((part, idx) => (
                <div key={part.id} className="bg-white/5 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Part Number</label>
                      <select
                        value={part.partNumber}
                        onChange={(e) => {
                          const parts = [...mockTest.speaking!.parts!];
                          parts[idx] = { ...parts[idx], partNumber: parseInt(e.target.value) as 1 | 2 | 3 };
                          setMockTest({
                            ...mockTest,
                            speaking: { ...mockTest.speaking!, parts },
                          });
                        }}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      >
                        <option value={1}>Part 1</option>
                        <option value={2}>Part 2</option>
                        <option value={3}>Part 3</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Time Limit (min)</label>
                      <input
                        type="number"
                        value={part.timeLimit}
                        onChange={(e) => {
                          const parts = [...mockTest.speaking!.parts!];
                          parts[idx] = { ...parts[idx], timeLimit: parseInt(e.target.value) };
                          setMockTest({
                            ...mockTest,
                            speaking: { ...mockTest.speaking!, parts },
                          });
                        }}
                        className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Questions (comma separated)</label>
                    <textarea
                      value={part.questions.join(', ')}
                      onChange={(e) => {
                        const parts = [...mockTest.speaking!.parts!];
                        parts[idx] = { ...parts[idx], questions: e.target.value.split(', ') };
                        setMockTest({
                          ...mockTest,
                          speaking: { ...mockTest.speaking!, parts },
                        });
                      }}
                      className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white h-24"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t border-gray-700">
        <button
          onClick={() => setCurrentTab(Math.max(0, currentTab - 1))}
          disabled={currentTab === 0}
          className="flex items-center gap-2 px-6 py-2 bg-gray-700 text-white rounded-xl disabled:opacity-50"
        >
          <ArrowLeft size={18} />
          Orqaga
        </button>
        {currentTab === tabs.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 gradient-bg text-white rounded-xl disabled:opacity-50"
          >
            {loading ? 'Yaratilmoqda...' : 'Yaratish'}
          </button>
        ) : (
          <button
            onClick={() => setCurrentTab(Math.min(tabs.length - 1, currentTab + 1))}
            className="flex items-center gap-2 px-6 py-2 gradient-bg text-white rounded-xl"
          >
            Keyingi
            <ArrowRight size={18} />
          </button>
        )}
      </div>

      <button
        onClick={onCancel}
        className="w-full mt-4 px-6 py-2 bg-gray-700 text-white rounded-xl"
      >
        Bekor qilish
      </button>
    </div>
  );
}
