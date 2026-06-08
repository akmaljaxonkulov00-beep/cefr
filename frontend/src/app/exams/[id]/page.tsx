'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { Clock, AlertTriangle, ChevronLeft, ChevronRight, CheckCircle, Shield, CreditCard, Mic, MicOff, Play, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { saveExamProgress, loadExamProgress, clearExamProgress } from '@/lib/exam-persistence';
import { getUser } from '@/lib/auth';

type Access = {
  unlocked: boolean;
  messageUz: string;
  paymentInstructions?: string | null;
  priceUzs?: number | null;
};

function integrityScoreFromEvents(events: { type: string }[]) {
  const w: Record<string, number> = {
    TAB_BLUR: 14,
    FULLSCREEN_EXIT: 20,
    COPY_ATTEMPT: 28,
    WEBCAM_DENIED: 26,
    MULTI_FACE: 40,
    WEBCAM_HEARTBEAT: 0,
    WEBCAM_ON: 0,
    EXAM_START: 0,
  };
  let s = 0;
  for (const e of events) s += w[e.type] ?? 6;
  return Math.min(100, Math.round(s));
}

export default function ExamDetail() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : params.id?.[0] ?? '';
  const router = useRouter();
  const [exam, setExam] = useState<any>(null);
  const [access, setAccess] = useState<Access | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentPart, setCurrentPart] = useState<string>('READING');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [webcamOn, setWebcamOn] = useState(false);
  const examSurfaceRef = useRef<HTMLDivElement>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const submittedRef = useRef(false);
  const integrityEventsRef = useRef<{ type: string; ts: string; detail?: Record<string, unknown> }[]>([]);
  
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const pushIntegrity = useCallback((type: string, detail?: Record<string, unknown>) => {
    integrityEventsRef.current.push({ type, ts: new Date().toISOString(), detail });
  }, []);

  const reportProctor = useCallback(
    async (eventType: string, detail?: Record<string, unknown>) => {
      pushIntegrity(eventType, detail);
      if (!id) return;
      try {
        await api.post(`/api/exams/session/${id}/proctor`, { eventType, detail });
      } catch {
        /* ignore */
      }
    },
    [id, pushIntegrity],
  );

  // Auto-save exam progress every 30 seconds
  useEffect(() => {
    if (!started || finished) return;

    const autoSave = setInterval(() => {
      const user = getUser();
      if (user && id) {
        saveExamProgress(id, user.id, {
          answers,
          timeLeft,
          currentQuestion,
          currentPart,
          savedAt: new Date().toISOString(),
        });
      }
    }, 30000);

    return () => clearInterval(autoSave);
  }, [started, finished, answers, timeLeft, currentQuestion, currentPart, id]);

  // Load saved progress on mount
  useEffect(() => {
    const user = getUser();
    if (user && id && !started) {
      const saved = loadExamProgress(id, user.id);
      if (saved && saved.answers) {
        const timeDiff = saved.savedAt ? new Date().getTime() - new Date(saved.savedAt).getTime() : 0;
        const minutesAgo = Math.floor(timeDiff / 60000);
        
        if (confirm(`Davom ettirilmagan imtihon topildi (${minutesAgo} daqiqa oldin). Davom ettirishni xohlaysizmi?`)) {
          setAnswers(saved.answers);
          setTimeLeft(saved.timeLeft || (exam?.duration || 60) * 60);
          setCurrentQuestion(saved.currentQuestion || 0);
          setCurrentPart(saved.currentPart || 'READING');
        } else {
          clearExamProgress(id, user.id);
        }
      }
    }
  }, [id, started, exam]);

  // Clear saved progress after successful submit
  useEffect(() => {
    if (result) {
      const user = getUser();
      if (user && id) {
        clearExamProgress(id, user.id);
      }
    }
  }, [result, id]);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/api/exams/${id}`)
      .then(({ data }) => {
        setExam(data.exam);
        setAccess(data.access);
        setTimeLeft((data.exam?.duration ?? 60) * 60);
      })
      .catch(() => toast.error('Imtihon topilmadi'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFinish = useCallback(async () => {
    if (submittedRef.current || !exam) return;
    submittedRef.current = true;
    setFinished(true);
    try {
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
    } catch {
      /* ignore */
    }

    let score = 0;
    const total = exam?.questions?.length || 1;
    exam?.questions?.forEach((q: any) => {
      if (answers[q.id] === q.answer) score++;
    });
    const percentage = Math.round((score / total) * 100);
    const integrityScore = integrityScoreFromEvents(integrityEventsRef.current);
    const integrityReport = { events: integrityEventsRef.current };

    try {
      const { data } = await api.post(`/api/exams/${id}/submit`, {
        answers,
        score: percentage,
        integrityScore,
        integrityReport,
      });
      setResult(data);
      toast.success('Imtihon yuborildi!');
    } catch {
      toast.error('Yuborishda xatolik');
      submittedRef.current = false;
      setFinished(false);
    }
    webcamStreamRef.current?.getTracks().forEach((t) => t.stop());
    webcamStreamRef.current = null;
  }, [exam, answers, id]);

  useEffect(() => {
    if (!started || finished || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, finished, timeLeft, handleFinish]);

  useEffect(() => {
    if (!started || finished || result) return;
    reportProctor('EXAM_START', {});
    const t = requestAnimationFrame(() => {
      const el = examSurfaceRef.current || document.documentElement;
      el.requestFullscreen?.().catch(() => {
        toast('To‘liq ekran yoqilmadi; monitoring davom etadi.', { icon: 'ℹ️' });
      });
    });
    return () => cancelAnimationFrame(t);
  }, [started, finished, result, reportProctor]);

  useEffect(() => {
    if (!started || finished) return;

    const onVisibility = () => {
      if (document.hidden) {
        reportProctor('TAB_BLUR', { at: new Date().toISOString() });
        toast.error('Varaq almashtirildi — qayd etildi.');
      } else {
        const el = examSurfaceRef.current || document.documentElement;
        if (!document.fullscreenElement) {
          el.requestFullscreen?.().catch(() => {});
        }
      }
    };

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        reportProctor('FULLSCREEN_EXIT', { at: new Date().toISOString() });
        toast('To‘liq ekran o‘chirildi. Qayta yoqilmoqda…', { icon: '⚠️' });
        const el = examSurfaceRef.current || document.documentElement;
        setTimeout(() => el.requestFullscreen?.().catch(() => {}), 300);
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, [started, finished, reportProctor]);

  useEffect(() => {
    if (!started || finished) return;
    let interval: ReturnType<typeof setInterval>;

    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        webcamStreamRef.current = stream;
        setWebcamOn(true);
        reportProctor('WEBCAM_ON', { tracks: stream.getVideoTracks().length });
        interval = setInterval(() => {
          reportProctor('WEBCAM_HEARTBEAT', { at: new Date().toISOString() });
        }, 45000);
      } catch {
        setWebcamOn(false);
        reportProctor('WEBCAM_DENIED', {});
        toast.error('Kamera ruxsati talab qilinadi.');
      }
    };

    startWebcam();
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [started, finished, reportProctor]);

  const beginExam = () => {
    if (!access?.unlocked) {
      toast.error('Avval to‘lovni tasdiqlating');
      return;
    }
    integrityEventsRef.current = [];
    setStarted(true);
  };

  const blockClipboard = (e: React.ClipboardEvent) => {
    if (!started || finished) return;
    e.preventDefault();
    reportProctor('COPY_ATTEMPT', { type: e.type });
    toast.error('Nusxa ko‘chirish va qo‘yish imtihon davomida o‘chirilgan.');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      toast.success('Yozish boshlandi');
    } catch (error) {
      toast.error('Mikrofon ruxsati talab qilinadi');
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      toast.success('Yozish yakunlandi');
    }
  };

  const resetRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  if (loading)
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!exam)
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <p className="text-gray-400">Imtihon topilmadi</p>
      </div>
    );

  if (result)
    return (
      <div className="min-h-screen bg-[#0f172a] flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-dark rounded-2xl p-8 max-w-md w-full text-center"
          >
            <CheckCircle size={64} className="text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Yakunlandi!</h2>
            <div className="text-5xl font-bold gradient-text mb-2">{result.score}%</div>
            {result.cefrLevel && <p className="text-gray-400 mb-6">CEFR: {result.cefrLevel}</p>}
            <div className="flex gap-4">
              <button onClick={() => router.push('/exams')} className="flex-1 py-3 glass rounded-xl text-white hover:bg-white/10 transition">
                Ro‘yxatga
              </button>
              <button onClick={() => router.push('/results')} className="flex-1 py-3 gradient-bg rounded-xl text-white transition">
                Natijalar
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    );

  if (!started) {
    const locked = access && !access.unlocked;
    return (
      <div className="min-h-screen bg-[#0f172a] flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-dark rounded-2xl p-8 max-w-lg w-full">
            <h2 className="text-2xl font-bold text-white mb-2">{exam.title}</h2>
            <div className="space-y-2 mb-6 text-gray-400 text-sm">
              <p>Turi: {exam.type}</p>
              <p>Vaqt: {exam.duration} daqiqa</p>
              {exam.level && <p>Daraja: {exam.level}</p>}
            </div>

            {locked ? (
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-amber-500/15 border border-amber-500/40 rounded-xl text-amber-100 text-sm">
                  <p className="font-medium mb-2">To‘lov talab qilinadi</p>
                  <p>{access?.messageUz}</p>
                  {access?.paymentInstructions && (
                    <pre className="mt-3 whitespace-pre-wrap text-gray-200 text-xs bg-black/30 p-3 rounded-lg">{access.paymentInstructions}</pre>
                  )}
                  {access?.priceUzs != null && <p className="mt-2 text-gray-300">Summa: {access.priceUzs} so‘m</p>}
                </div>
                <Link
                  href={`/payment/exam/${id}`}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl gradient-bg text-white font-semibold"
                >
                  <CreditCard size={18} /> To‘lov sahifasiga o‘tish
                </Link>
              </div>
            ) : (
              <div className="space-y-3 p-4 bg-amber-500/10 rounded-lg mb-6 text-amber-100 text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <p>To‘liq ekran, varaq nazorati, bufer bloklash va kamera monitoringi yoqiladi.</p>
                </div>
                <div className="flex items-start gap-2">
                  <Shield size={18} className="text-primary-300 shrink-0 mt-0.5" />
                  <p>Shubhali harakatlar balli hisoblanadi va admin panelda ko‘rinadi.</p>
                </div>
              </div>
            )}

            <button
              onClick={beginExam}
              disabled={!!locked}
              className="w-full gradient-bg hover:gradient-bg-hover text-white font-semibold py-3 rounded-xl transition disabled:opacity-40"
            >
              {locked ? 'To‘lov kutilmoqda' : 'Boshlash'}
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  const question = exam.questions?.[currentQuestion];
  const qLen = exam.questions?.length || 1;
  const progress = ((currentQuestion + 1) / qLen) * 100;

  // Group questions by part
  const questionsByPart = exam?.questions?.reduce((acc: any, q: any, idx: number) => {
    const part = q.type || 'READING';
    if (!acc[part]) acc[part] = [];
    acc[part].push({ ...q, originalIndex: idx });
    return acc;
  }, {}) || {};

  const parts = exam?.type === 'CEFR' 
    ? ['READING', 'LISTENING', 'WRITING', 'SPEAKING']
    : ['READING', 'LISTENING', 'WRITING', 'SPEAKING'];

  const currentPartQuestions = questionsByPart[currentPart] || [];
  const currentPartIndex = currentPartQuestions.findIndex((q: any) => q.originalIndex === currentQuestion);
  const partProgress = currentPartQuestions.length > 0 ? ((currentPartIndex + 1) / currentPartQuestions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#0f172a] flex" ref={examSurfaceRef}>
      <Sidebar />
      <main className="flex-1 p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header with timer */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-semibold text-white">{exam.title}</h2>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className={`px-2 py-1 rounded-lg ${webcamOn ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-700 text-gray-300'}`}>
                Kamera: {webcamOn ? 'faol' : 'yo\'q'}
              </span>
              <span className="px-2 py-1 rounded-lg bg-gray-700 text-gray-300">Monitoring faol</span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${timeLeft < 60 ? 'bg-red-500/20 text-red-400' : 'glass text-gray-300'}`}>
              <Clock size={18} />
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Part Navigation */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {parts.map((part) => (
              <button
                key={part}
                onClick={() => {
                  setCurrentPart(part);
                  const firstQuestionInPart = questionsByPart[part]?.[0];
                  if (firstQuestionInPart) setCurrentQuestion(firstQuestionInPart.originalIndex);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  currentPart === part
                    ? 'gradient-bg text-white'
                    : 'glass text-gray-300 hover:bg-white/10'
                }`}
              >
                {part}
              </button>
            ))}
          </div>

          <div className="w-full h-2 bg-gray-700 rounded-full mb-4">
            <div className="h-full gradient-bg rounded-full transition-all" style={{ width: `${partProgress}%` }} />
          </div>

          {/* Split-screen layout */}
          {question && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {/* Left panel: Passage/Audio */}
              <div className="glass-dark rounded-2xl p-6 h-fit max-h-[600px] overflow-y-auto">
                {question.passage && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Matn</h3>
                    <div className="p-4 bg-white/5 rounded-xl text-gray-300 text-sm leading-relaxed select-none">
                      {question.passage}
                    </div>
                  </div>
                )}
                {question.mediaUrl && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Audio</h3>
                    <audio controls className="w-full" src={question.mediaUrl}>
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
              </div>

              {/* Right panel: Question and options */}
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-dark rounded-2xl p-6 h-fit"
                onCopy={blockClipboard}
                onCut={blockClipboard}
                onPaste={blockClipboard}
              >
                <div className="mb-4">
                  <p className="text-white text-lg select-none">{question.question}</p>
                </div>
                {question.options && Array.isArray(question.options) && (
                  <div className="space-y-3">
                    {question.options.map((option: string, i: number) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setAnswers({ ...answers, [question.id]: option })}
                        className={`w-full text-left p-4 rounded-xl border transition ${
                          answers[question.id] === option
                            ? 'border-primary-500 bg-primary-500/10 text-white'
                            : 'border-gray-700 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
                {question.type === 'ESSAY' && (
                  <div className="space-y-3">
                    <textarea
                      value={answers[question.id] || ''}
                      onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                      className="w-full h-48 p-4 bg-white/5 border border-gray-700 rounded-xl text-gray-300 resize-none focus:border-primary-500 focus:outline-none"
                      placeholder="Javobingizni yozing..."
                    />
                    <div className="text-xs text-gray-400">
                      So\'zlar soni: {(answers[question.id] || '').split(/\s+/).filter(Boolean).length}
                    </div>
                  </div>
                )}
                {question.type === 'SPEAKING' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-xl">
                      <p className="text-gray-300 text-sm mb-4">{question.question}</p>
                      
                      {/* Recording controls */}
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        {!isRecording && !audioUrl && (
                          <button
                            onClick={startRecording}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
                          >
                            <Mic size={18} />
                            Yozishni boshlash
                          </button>
                        )}
                        
                        {isRecording && (
                          <button
                            onClick={stopRecording}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                          >
                            <Square size={18} />
                            To'xtatish ({formatTime(recordingTime)})
                          </button>
                        )}
                        
                        {audioUrl && (
                          <>
                            <button
                              onClick={resetRecording}
                              className="flex items-center gap-2 px-4 py-2 glass hover:bg-white/10 text-white rounded-lg transition"
                            >
                              <MicOff size={18} />
                              Qayta yozish
                            </button>
                          </>
                        )}
                      </div>

                      {/* Audio player */}
                      {audioUrl && (
                        <div className="space-y-3">
                          <audio controls className="w-full" src={audioUrl}>
                            Your browser does not support the audio element.
                          </audio>
                          <button
                            onClick={() => {
                              if (audioBlob) {
                                setAnswers({ ...answers, [question.id]: 'AUDIO_RECORDED' });
                                toast.success('Audio saqlandi');
                              }
                            }}
                            className="w-full py-2 gradient-bg rounded-xl text-white font-medium transition"
                          >
                            Tasdiqlash
                          </button>
                        </div>
                      )}

                      {isRecording && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          Yozilmoqda...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                const newIndex = currentPartIndex - 1;
                if (newIndex >= 0) {
                  setCurrentQuestion(currentPartQuestions[newIndex].originalIndex);
                }
              }}
              disabled={currentPartIndex === 0}
              className="flex items-center gap-2 px-6 py-3 glass rounded-xl text-gray-300 hover:text-white disabled:opacity-30 transition"
            >
              <ChevronLeft size={18} /> Oldingi
            </button>

            {currentPartIndex < currentPartQuestions.length - 1 ? (
              <button
                type="button"
                onClick={() => {
                  setCurrentQuestion(currentPartQuestions[currentPartIndex + 1].originalIndex);
                }}
                className="flex items-center gap-2 px-6 py-3 gradient-bg rounded-xl text-white transition"
              >
                Keyingi <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 rounded-xl text-white hover:bg-emerald-700 transition"
              >
                Yakunlash <CheckCircle size={18} />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
