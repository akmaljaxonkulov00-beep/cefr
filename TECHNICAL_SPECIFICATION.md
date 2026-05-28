# IELTS & CEFR Mock Test Platform - Technical Specification (TZ)

## Table of Contents
1. [System Overview](#system-overview)
2. [Database Architecture](#database-architecture)
3. [Technology Stack](#technology-stack)
4. [API Endpoints](#api-endpoints)
5. [AI Proctoring Architecture](#ai-proctoring-architecture)
6. [AI Grading Architecture](#ai-grading-architecture)
7. [User Workflow](#user-workflow)
8. [Security Considerations](#security-considerations)

---

## 1. System Overview

### 1.1 Purpose
Online Mock Test platform for IELTS (Academic/General) and CEFR (B1, B2, C1) examinations with AI-powered proctoring and grading.

### 1.2 Core Features
- Multi-format exam support (IELTS & CEFR)
- Skill-based testing (Listening, Reading, Writing, Speaking, Lexical Competence)
- AI-powered proctoring (camera monitoring)
- AI-powered grading (Writing & Speaking)
- Split-screen interface for reading/audio + questions
- Auto-submit with timer management
- Rich admin panel for test construction

---

## 2. Database Architecture

### 2.1 ERD Overview

```
Users → Centers → Exams → Questions → UserAnswers → Results
                    ↓                ↓
               ExamParts → ProctoringEvents
                    ↓
               AudioFiles, MediaFiles
```

### 2.2 Database Schema (Prisma)

#### 2.2.1 Users Table
```prisma
model User {
  id                String    @id @default(uuid())
  email             String    @unique
  password          String    // bcrypt hashed
  name              String
  role              UserRole  // STUDENT, TEACHER, CENTER_ADMIN, SUPER_ADMIN
  avatar            String?
  xp                Int       @default(0)
  streak            Int       @default(0)
  centerId          String?
  subscriptionId    String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  center            Center?   @relation(fields: [centerId], references: [id])
  subscription      Subscription? @relation(fields: [subscriptionId], references: [id])
  examResults       Result[]
  userAnswers       UserAnswer[]
  proctoringEvents  ProctoringEvent[]
  speakingRecords   SpeakingRecord[]
  
  @@index([email])
  @@index([centerId])
  @@map("users")
}

enum UserRole {
  STUDENT
  TEACHER
  CENTER_ADMIN
  SUPER_ADMIN
}
```

#### 2.2.2 Centers Table
```prisma
model Center {
  id              String   @id @default(uuid())
  name            String
  address         String?
  adminEmail      String   @unique
  adminPassword   String   // bcrypt hashed
  mockLimit       Int      @default(100)
  subscriptionType String  @default("BASIC")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  users           User[]
  exams           Exam[]
  
  @@index([adminEmail])
  @@map("centers")
}
```

#### 2.2.3 Exams Table
```prisma
model Exam {
  id                  String      @id @default(uuid())
  title               String
  type                ExamType    // IELTS_ACADEMIC, IELTS_GENERAL, CEFR_B1, CEFR_B2, CEFR_C1
  duration            Int         // Total duration in minutes
  level               String?     // CEFR level or IELTS target band
  createdBy           String
  centerId            String?
  requiresPayment     Boolean     @default(true)
  priceUzs            Int?
  paymentInstructions String?
  isPublished         Boolean     @default(false)
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt
  
  creator             User        @relation("ExamCreator", fields: [createdBy], references: [id])
  center              Center?     @relation(fields: [centerId], references: [id])
  questions           Question[]
  results             Result[]
  examParts           ExamPart[]
  
  @@index([type])
  @@index([centerId])
  @@index([createdBy])
  @@map("exams")
}

enum ExamType {
  IELTS_ACADEMIC
  IELTS_GENERAL
  CEFR_B1
  CEFR_B2
  CEFR_C1
}
```

#### 2.2.4 Exam Parts Table
```prisma
model ExamPart {
  id          String   @id @default(uuid())
  examId      String
  skill       SkillType
  partNumber  String   // "1", "1.1", "2", etc.
  title       String
  duration    Int      // Duration in minutes for this part
  order       Int
  createdAt   DateTime @default(now())
  
  exam        Exam     @relation(fields: [examId], references: [id], onDelete: Cascade)
  
  @@unique([examId, skill, partNumber])
  @@index([examId, skill])
  @@map("exam_parts")
}

enum SkillType {
  LISTENING
  READING
  WRITING
  SPEAKING
  LEXICAL_COMPETENCE
}
```

#### 2.2.5 Questions Table
```prisma
model Question {
  id          String        @id @default(uuid())
  examId      String
  examPartId  String?
  skill       SkillType
  part        String?       // "1", "1.1", "2", etc.
  subPart     String?       // "1", "2", "3" for list items within a part
  question    String        // Question text (can be HTML for rich content)
  type        QuestionType
  options     Json?         // Array of options for MCQ
  answer      String?       // Correct answer
  passage     String?       // Reading passage or audio transcript
  mediaUrl    String?       // URL to audio/image file
  order       Int           @default(0)
  points      Int           @default(1)
  createdAt   DateTime      @default(now())
  
  exam        Exam          @relation(fields: [examId], references: [id], onDelete: Cascade)
  examPart    ExamPart?     @relation(fields: [examPartId], references: [id])
  userAnswers UserAnswer[]
  
  @@index([examId, order])
  @@index([examId, skill, part])
  @@map("questions")
}

enum QuestionType {
  MCQ                    // Multiple Choice
  FILL_BLANKS            // Fill in the blanks
  MATCHING               // Matching
  TRUE_FALSE             // True/False
  SHORT_ANSWER           // Short answer
  ESSAY                  // Essay/Writing task
  SPEAKING               // Speaking task
  LEXICAL_CHOICE         // Vocabulary/Grammar choice
}
```

#### 2.2.6 User Answers Table
```prisma
model UserAnswer {
  id          String   @id @default(uuid())
  resultId    String
  questionId  String
  answer      String?  // User's answer
  isCorrect   Boolean?
  points      Float    @default(0)
  timeSpent   Int?     // Time spent in seconds
  createdAt   DateTime @default(now())
  
  result      Result   @relation(fields: [resultId], references: [id], onDelete: Cascade)
  question    Question @relation(fields: [questionId], references: [id])
  user        User     @relation(fields: [userId], references: [id])
  userId      String
  
  @@index([resultId])
  @@index([questionId])
  @@index([userId])
  @@map("user_answers")
}
```

#### 2.2.7 Results Table
```prisma
model Result {
  id                String    @id @default(uuid())
  userId            String
  examId            String
  score             Float     // Overall score (0-100 or IELTS band)
  ieltsBand         Float?    // IELTS band score (0-9)
  cefrLevel         String?   // CEFR level (A1-C2)
  skillScores       Json?     // Individual skill scores
  answers           Json?     // Complete answers object
  integrityScore     Float?    // Proctoring integrity score (0-100)
  integrityReport    Json?     // Detailed proctoring report
  aiFeedback        Json?     // AI feedback for writing/speaking
  timeSpent         Int?      // Total time spent in seconds
  status            ResultStatus
  startedAt         DateTime  @default(now())
  completedAt       DateTime?
  
  user              User      @relation(fields: [userId], references: [id])
  exam              Exam      @relation(fields: [examId], references: [id])
  userAnswers       UserAnswer[]
  
  @@index([userId])
  @@index([examId])
  @@index([status])
  @@map("results")
}

enum ResultStatus {
  IN_PROGRESS
  COMPLETED
  SUBMITTED
  GRADED
  FLAGGED
}
```

#### 2.2.8 Proctoring Events Table
```prisma
model ProctoringEvent {
  id          String   @id @default(uuid())
  userId      String
  resultId    String?
  eventType   String   // "TAB_SWITCH", "FULLSCREEN_EXIT", "MULTIPLE_DETECTED", "NO_FACE", "SUSPICIOUS_OBJECT"
  timestamp   DateTime @default(now())
  details     Json?    // Additional event details
  screenshot  String?  // Base64 screenshot (if applicable)
  
  user        User     @relation(fields: [userId], references: [id])
  result      Result?  @relation(fields: [resultId], references: [id])
  
  @@index([userId])
  @@index([resultId])
  @@index([eventType])
  @@map("proctoring_events")
}
```

#### 2.2.9 Speaking Records Table
```prisma
model SpeakingRecord {
  id          String   @id @default(uuid())
  userId      String
  questionId  String?
  audioUrl    String   // URL to recorded audio file
  transcript  String?  // Whisper API transcript
  aiAnalysis  Json?    // AI analysis (fluency, pronunciation, grammar)
  duration    Int      // Duration in seconds
  createdAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@map("speaking_records")
}
```

#### 2.2.10 Media Files Table
```prisma
model MediaFile {
  id          String   @id @default(uuid())
  fileName    String
  fileType    String   // "AUDIO", "IMAGE", "PDF"
  fileUrl     String
  fileSize    Int
  uploadedBy  String
  createdAt   DateTime @default(now())
  
  @@index([fileType])
  @@map("media_files")
}
```

---

## 3. Technology Stack

### 3.1 Frontend (React/Next.js)

#### Core Framework
- **Next.js 14+** (App Router) - Server-side rendering, API routes, optimized performance
- **React 18+** - UI library with hooks and concurrent features
- **TypeScript** - Type safety and better developer experience

#### UI Components & Styling
- **TailwindCSS** - Utility-first CSS framework
- **shadcn/ui** - Modern, accessible component library built on Radix UI
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Beautiful icon library

#### State Management
- **Zustand** - Lightweight state management
- **React Query (TanStack Query)** - Server state management, caching, synchronization

#### Audio Recording
- **MediaRecorder API** - Native browser API for audio recording
- **react-media-recorder** - React wrapper for MediaRecorder
- **Web Audio API** - Advanced audio processing if needed

#### Split Screen & Layout
- **CSS Grid/Flexbox** - Native CSS for split-screen layouts
- **react-split-pane** - Resizable split panes (optional)
- **react-resizable-panels** - Modern alternative for resizable panels

#### Rich Text Editor (Admin Panel)
- **Tiptap** - Headless rich text editor
- **React Quill** - Alternative rich text editor
- **Lexical** - Meta's modern rich text editor

#### File Upload
- **react-dropzone** - Drag and drop file upload
- **uppy** - Advanced file upload with progress tracking

#### Real-time Features
- **Socket.io-client** - Real-time communication for timer sync, proctoring alerts

#### Other Utilities
- **date-fns** - Date manipulation
- **axios** - HTTP client
- **react-hot-toast** - Toast notifications
- **zod** - Schema validation

### 3.2 Backend (Node.js/NestJS)

#### Core Framework
- **NestJS 10+** - Progressive Node.js framework with TypeScript
- **Express** - Underlying HTTP server (via NestJS)

#### Database & ORM
- **PostgreSQL** - Primary database (relational, robust)
- **Prisma ORM** - Type-safe database client, migrations
- **Redis** - Caching, session management, rate limiting

#### Authentication & Security
- **Passport.js** - Authentication middleware
- **JWT (jsonwebtoken)** - Token-based authentication
- **bcryptjs** - Password hashing
- **Helmet** - Security headers
- **Rate Limiting** - DDoS protection

#### File Storage
- **AWS S3 / MinIO** - Object storage for audio, images, PDFs
- **Multer** - File upload handling
- **Sharp** - Image processing

#### AI Integration
- **OpenAI SDK** - GPT-4o for writing grading
- **OpenAI Whisper API** - Speech-to-text for speaking tests
- **OpenAI Vision API** - Proctoring image analysis (optional)

#### Real-time
- **Socket.io** - WebSocket server for real-time features
- **Redis Pub/Sub** - Message broker for scaling

#### Background Jobs
- **Bull Queue** - Job queue with Redis
- **node-cron** - Scheduled tasks

#### Monitoring & Logging
- **Winston** - Logging
- **Sentry** - Error tracking
- **Prometheus + Grafana** - Metrics and monitoring (optional)

### 3.3 AI Services

#### Writing Grading
- **GPT-4o API** - Advanced text analysis
- **Custom prompts** for IELTS/CEFR grading criteria

#### Speaking Grading
- **Whisper API** - Speech-to-text transcription
- **GPT-4o API** - Text analysis for fluency, pronunciation, grammar

#### Proctoring
- **OpenAI Vision API** - Image analysis for suspicious objects
- **Face detection API** (optional) - Face recognition and tracking

---

## 4. API Endpoints

### 4.1 Authentication Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | User registration | Public |
| POST | `/auth/login` | User login | Public |
| POST | `/auth/logout` | User logout | Private |
| POST | `/auth/refresh` | Refresh access token | Public |
| POST | `/auth/forgot-password` | Request password reset | Public |
| POST | `/auth/reset-password` | Reset password | Public |
| GET | `/auth/profile` | Get current user profile | Private |
| PATCH | `/auth/profile` | Update user profile | Private |
| POST | `/auth/google` | Google OAuth login | Public |

### 4.2 Exam Management Endpoints (Admin)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| POST | `/exams` | Create new exam | Private | TEACHER, CENTER_ADMIN, SUPER_ADMIN |
| GET | `/exams` | Get all exams (filtered) | Private | ALL |
| GET | `/exams/:id` | Get exam by ID | Private | ALL |
| PATCH | `/exams/:id` | Update exam | Private | TEACHER, CENTER_ADMIN, SUPER_ADMIN |
| DELETE | `/exams/:id` | Delete exam | Private | CENTER_ADMIN, SUPER_ADMIN |
| POST | `/exams/:id/publish` | Publish exam | Private | CENTER_ADMIN, SUPER_ADMIN |
| POST | `/exams/:id/duplicate` | Duplicate exam | Private | TEACHER, CENTER_ADMIN, SUPER_ADMIN |
| POST | `/exams/upload-pdf` | Upload PDF exam | Private | TEACHER, CENTER_ADMIN, SUPER_ADMIN |
| POST | `/exams/create-mock` | Create mock test with parts | Private | CENTER_ADMIN, SUPER_ADMIN |
| POST | `/exams/upload-mock-file` | Upload mock file (AI processing) | Private | SUPER_ADMIN |
| PATCH | `/exams/:id/price` | Update exam price | Private | CENTER_ADMIN, SUPER_ADMIN |
| GET | `/exams/:id/parts` | Get exam parts structure | Private | ALL |
| GET | `/exams/:id/questions` | Get questions by skill/part | Private | ALL |

### 4.3 Question Management Endpoints

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| POST | `/exams/:examId/questions` | Add question to exam | Private | TEACHER, CENTER_ADMIN, SUPER_ADMIN |
| GET | `/exams/:examId/questions` | Get all questions for exam | Private | ALL |
| PATCH | `/questions/:id` | Update question | Private | TEACHER, CENTER_ADMIN, SUPER_ADMIN |
| DELETE | `/questions/:id` | Delete question | Private | TEACHER, CENTER_ADMIN, SUPER_ADMIN |
| POST | `/questions/bulk` | Bulk import questions | Private | TEACHER, CENTER_ADMIN, SUPER_ADMIN |
| POST | `/questions/:id/media` | Upload media for question | Private | TEACHER, CENTER_ADMIN, SUPER_ADMIN |

### 4.4 Exam Session Endpoints (Student)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/exams/:id/start` | Start exam session | Private |
| GET | `/exams/:id/session` | Get current session state | Private |
| POST | `/exams/:id/answer` | Submit answer for question | Private |
| POST | `/exams/:id/submit` | Submit entire exam | Private |
| POST | `/exams/:id/proctor` | Log proctoring event | Private |
| GET | `/exams/:id/timer` | Get remaining time | Private |
| POST | `/exams/:id/extend-time` | Extend time (admin only) | Private |

### 4.5 Speaking Test Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/speaking/upload` | Upload speaking audio | Private |
| GET | `/speaking/:id` | Get speaking record | Private |
| POST | `/speaking/:id/transcribe` | Request transcription (Whisper) | Private |
| GET | `/speaking/:id/analysis` | Get AI analysis | Private |

### 4.6 Results & Analytics Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/results/mine` | Get my results | Private |
| GET | `/results/:id` | Get result by ID | Private |
| GET | `/results/:id/feedback` | Get detailed feedback | Private |
| GET | `/results/center` | Get center results (admin) | Private |
| GET | `/analytics/my` | Get my analytics | Private |
| GET | `/analytics/center` | Get center analytics (admin) | Private |
| GET | `/analytics/global` | Get global analytics (super admin) | Private |
| GET | `/reports/revenue` | Get revenue report | Private |
| GET | `/reports/participation` | Get participation report | Private |

### 4.7 AI Grading Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/ai/grade-writing` | Grade writing task | Private |
| POST | `/ai/grade-speaking` | Grade speaking task | Private |
| POST | `/ai/analyze-proctoring` | Analyze proctoring images | Private |

### 4.8 Media Management Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/media/upload` | Upload media file | Private |
| GET | `/media/:id` | Get media file | Private |
| DELETE | `/media/:id` | Delete media file | Private |
| GET | `/media/presigned-url` | Get presigned upload URL | Private |

### 4.9 Center Management Endpoints

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/centers` | Get all centers | Private | SUPER_ADMIN |
| POST | `/centers` | Create new center | Private | SUPER_ADMIN |
| GET | `/centers/:id` | Get center by ID | Private | ALL |
| PATCH | `/centers/:id` | Update center | Private | SUPER_ADMIN, CENTER_ADMIN |
| DELETE | `/centers/:id` | Delete center | Private | SUPER_ADMIN |
| POST | `/centers/:id/assign-user` | Assign user to center | Private | CENTER_ADMIN, SUPER_ADMIN |
| POST | `/centers/:id/create-admin` | Create center admin | Private | SUPER_ADMIN |
| PATCH | `/centers/:id/limits` | Update center limits | Private | SUPER_ADMIN |

### 4.10 User Management Endpoints

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/users` | Get all users (filtered) | Private | SUPER_ADMIN, CENTER_ADMIN |
| GET | `/users/:id` | Get user by ID | Private | ALL |
| PATCH | `/users/:id` | Update user | Private | SUPER_ADMIN, CENTER_ADMIN |
| DELETE | `/users/:id` | Delete user | Private | SUPER_ADMIN |
| PATCH | `/users/:id/role` | Change user role | Private | SUPER_ADMIN |
| GET | `/users/center-students` | Get center students | Private | CENTER_ADMIN |

---

## 5. AI Proctoring Architecture

### 5.1 System Overview

AI Proctoring monitors exam sessions through:
1. **Camera monitoring** - Detects suspicious behavior
2. **Browser behavior tracking** - Tab switches, fullscreen exits
3. **Audio monitoring** - Background noise detection
4. **Screen monitoring** - Multiple windows/tabs detection

### 5.2 Architecture Diagram

```
Frontend (Browser)
    ↓
    ├─ Camera Stream (WebRTC)
    ├─ Screen Capture API
    ├─ Browser Events (tab switch, fullscreen)
    ↓
WebSocket (Socket.io)
    ↓
Backend (NestJS)
    ↓
    ├─ Proctoring Service
    ├─ Event Logger
    ↓
AI Analysis (OpenAI Vision API)
    ↓
Database (Proctoring Events)
```

### 5.3 Implementation Details

#### 5.3.1 Frontend Proctoring Component

```typescript
// components/ProctoringMonitor.tsx
interface ProctoringConfig {
  enableCamera: boolean;
  enableScreenCapture: boolean;
  enableAudioMonitoring: boolean;
  sensitivity: 'low' | 'medium' | 'high';
}

class ProctoringMonitor {
  private socket: Socket;
  private mediaStream: MediaStream;
  private intervalId: NodeJS.Timeout;
  
  async startMonitoring(examId: string, config: ProctoringConfig) {
    // Request camera access
    if (config.enableCamera) {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: config.enableAudioMonitoring
      });
      
      // Capture frames every 5 seconds
      this.intervalId = setInterval(() => {
        this.captureAndSendFrame();
      }, 5000);
    }
    
    // Monitor browser events
    this.setupBrowserEventListeners();
  }
  
  private captureAndSendFrame() {
    const videoTrack = this.mediaStream.getVideoTracks()[0];
    const imageCapture = new ImageCapture(videoTrack);
    
    imageCapture.takePhoto()
      .then(blob => this.convertToBase64(blob))
      .then(base64 => {
        this.socket.emit('proctoring:frame', {
          examId: this.examId,
          frame: base64,
          timestamp: Date.now()
        });
      });
  }
  
  private setupBrowserEventListeners() {
    // Detect tab switch
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.logEvent('TAB_SWITCH');
      }
    });
    
    // Detect fullscreen exit
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) {
        this.logEvent('FULLSCREEN_EXIT');
      }
    });
    
    // Detect multiple windows (via localStorage)
    window.addEventListener('storage', (e) => {
      if (e.key === 'exam_session_active') {
        this.logEvent('MULTIPLE_WINDOWS');
      }
    });
  }
  
  private logEvent(eventType: string, details?: any) {
    this.socket.emit('proctoring:event', {
      examId: this.examId,
      eventType,
      timestamp: Date.now(),
      details
    });
  }
}
```

#### 5.3.2 Backend Proctoring Service

```typescript
// services/proctoring.service.ts
@Injectable()
export class ProctoringService {
  constructor(
    private prisma: PrismaService,
    private openaiService: OpenAIService,
  ) {}
  
  async logEvent(userId: string, resultId: string, eventType: string, details?: any) {
    await this.prisma.proctoringEvent.create({
      data: {
        userId,
        resultId,
        eventType,
        details,
        timestamp: new Date(),
      },
    });
    
    // Check if this is a critical event
    if (this.isCriticalEvent(eventType)) {
      await this.handleCriticalEvent(userId, resultId, eventType);
    }
  }
  
  async analyzeFrame(userId: string, frameBase64: string) {
    // Use OpenAI Vision API to analyze frame
    const analysis = await this.openaiService.analyzeImage({
      image: frameBase64,
      prompt: `Analyze this image for exam proctoring. Check for:
      1. Is there a person visible?
      2. Are there any suspicious objects (phones, notes, other people)?
      3. Is the person looking at the screen?
      4. Are there any multiple monitors visible?
      
      Return JSON with: { hasPerson, suspiciousObjects, lookingAtScreen, multipleMonitors, confidence }`
    });
    
    if (analysis.suspiciousObjects || !analysis.lookingAtScreen) {
      await this.logEvent(userId, null, 'SUSPICIOUS_BEHAVIOR', analysis);
    }
    
    return analysis;
  }
  
  async calculateIntegrityScore(resultId: string) {
    const events = await this.prisma.proctoringEvent.findMany({
      where: { resultId },
    });
    
    let score = 100;
    const criticalEvents = events.filter(e => this.isCriticalEvent(e.eventType));
    const warningEvents = events.filter(e => this.isWarningEvent(e.eventType));
    
    score -= criticalEvents.length * 20;
    score -= warningEvents.length * 5;
    
    return Math.max(0, score);
  }
  
  private isCriticalEvent(eventType: string): boolean {
    return ['TAB_SWITCH', 'FULLSCREEN_EXIT', 'MULTIPLE_WINDOWS', 'NO_FACE'].includes(eventType);
  }
  
  private isWarningEvent(eventType: string): boolean {
    return ['SUSPICIOUS_OBJECT', 'LOOKING_AWAY'].includes(eventType);
  }
}
```

#### 5.3.3 WebSocket Gateway

```typescript
// gateways/proctoring.gateway.ts
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/proctoring'
})
export class ProctoringGateway {
  constructor(private proctoringService: ProctoringService) {}
  
  @SubscribeMessage('proctoring:event')
  async handleEvent(
    client: Socket,
    payload: { examId: string; eventType: string; details?: any }
  ) {
    const userId = client.data.userId;
    await this.proctoringService.logEvent(userId, payload.examId, payload.eventType, payload.details);
    
    // Notify admin if critical event
    if (this.proctoringService.isCriticalEvent(payload.eventType)) {
      this.server.emit(`admin:alert:${userId}`, {
        type: 'CRITICAL',
        event: payload.eventType,
        timestamp: new Date(),
      });
    }
  }
  
  @SubscribeMessage('proctoring:frame')
  async handleFrame(
    client: Socket,
    payload: { examId: string; frame: string; timestamp: number }
  ) {
    const userId = client.data.userId;
    const analysis = await this.proctoringService.analyzeFrame(userId, payload.frame);
    
    // Send analysis back to client
    client.emit('proctoring:analysis', analysis);
  }
}
```

### 5.4 Proctoring Event Types

| Event Type | Severity | Description |
|------------|----------|-------------|
| TAB_SWITCH | Critical | User switched to another tab |
| FULLSCREEN_EXIT | Critical | User exited fullscreen mode |
| MULTIPLE_WINDOWS | Critical | Multiple browser windows detected |
| NO_FACE | Critical | No face detected in camera |
| SUSPICIOUS_OBJECT | Warning | Suspicious object detected |
| LOOKING_AWAY | Warning | User not looking at screen |
| AUDIO_ANOMALY | Warning | Unusual audio detected |
| COPY_PASTE | Warning | Copy/paste detected |

---

## 6. AI Grading Architecture

### 6.1 System Overview

AI Grading provides automated evaluation for:
1. **Writing Tasks** - Grammar, vocabulary, coherence, task achievement
2. **Speaking Tasks** - Fluency, pronunciation, grammar, vocabulary

### 6.2 Architecture Diagram

```
User Submission
    ↓
Backend (NestJS)
    ↓
    ├─ Writing → GPT-4o API → Analysis & Scoring
    ├─ Speaking → Whisper API → Transcript → GPT-4o API → Analysis & Scoring
    ↓
Database (Results, AI Feedback)
```

### 6.3 Writing Grading Implementation

#### 6.3.1 GPT-4o Prompt for IELTS Writing

```typescript
// services/ai-grading.service.ts
@Injectable()
export class AIGradingService {
  constructor(private openai: OpenAI) {}
  
  async gradeIELTSWriting(submission: {
    taskType: 'TASK_1' | 'TASK_2';
    prompt: string;
    response: string;
    wordCount: number;
  }) {
    const criteria = submission.taskType === 'TASK_1' 
      ? ['Task Achievement', 'Coherence & Cohesion', 'Lexical Resource', 'Grammatical Range & Accuracy']
      : ['Task Response', 'Coherence & Cohesion', 'Lexical Resource', 'Grammatical Range & Accuracy'];
    
    const prompt = `
You are an IELTS examiner. Grade the following ${submission.taskType} response.

Task: ${submission.prompt}
Student Response: ${submission.response}
Word Count: ${submission.wordCount}

Evaluate based on IELTS criteria:
${criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Return a JSON response with:
{
  "overallBand": number (0-9),
  "criteriaScores": {
    "${criteria[0]}": number (0-9),
    "${criteria[1]}": number (0-9),
    "${criteria[2]}": number (0-9),
    "${criteria[3]}": number (0-9)
  },
  "strengths": string[],
  "weaknesses": string[],
  "detailedFeedback": string,
  "suggestions": string[],
  "grammarErrors": [{ "error": string, "correction": string, "type": string }],
  "vocabularyAnalysis": {
    "score": number,
    "advancedWords": string[],
    "repeatedWords": string[]
  }
}
`;
    
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });
    
    return JSON.parse(completion.choices[0].message.content);
  }
  
  async gradeCEFRWriting(submission: {
    level: 'B1' | 'B2' | 'C1';
    prompt: string;
    response: string;
  }) {
    const prompt = `
You are a CEFR examiner. Grade the following writing response for ${submission.level} level.

Task: ${submission.prompt}
Student Response: ${submission.response}

Evaluate based on CEFR criteria:
1. Content (Task fulfillment)
2. Organisation (Coherence and cohesion)
3. Language accuracy (Grammar and vocabulary)
4. Appropriacy (Register and style)

Return a JSON response with:
{
  "overallScore": number (0-100),
  "cefrLevel": string (A1-C2),
  "criteriaScores": {
    "content": number (0-100),
    "organisation": number (0-100),
    "languageAccuracy": number (0-100),
    "appropriateness": number (0-100)
  },
  "strengths": string[],
  "areasForImprovement": string[],
  "detailedFeedback": string,
  "grammarErrors": [{ "error": string, "correction": string }],
  "vocabularyFeedback": string
}
`;
    
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });
    
    return JSON.parse(completion.choices[0].message.content);
  }
}
```

### 6.4 Speaking Grading Implementation

#### 6.4.1 Whisper + GPT-4o Pipeline

```typescript
// services/speaking-grading.service.ts
@Injectable()
export class SpeakingGradingService {
  constructor(
    private openai: OpenAI,
    private prisma: PrismaService,
  ) {}
  
  async gradeSpeaking(audioFile: Buffer, question: string, examType: 'IELTS' | 'CEFR') {
    // Step 1: Transcribe audio using Whisper
    const transcript = await this.transcribeAudio(audioFile);
    
    // Step 2: Analyze speaking using GPT-4o
    const analysis = await this.analyzeSpeaking(transcript, question, examType);
    
    // Step 3: Calculate scores
    const scores = this.calculateSpeakingScores(analysis, examType);
    
    return {
      transcript,
      analysis,
      scores,
    };
  }
  
  private async transcribeAudio(audioFile: Buffer): Promise<string> {
    const transcription = await this.openai.audio.transcriptions.create({
      file: new File([audioFile], 'audio.mp3', { type: 'audio/mpeg' }),
      model: 'whisper-1',
      language: 'en',
    });
    
    return transcription.text;
  }
  
  private async analyzeSpeaking(transcript: string, question: string, examType: 'IELTS' | 'CEFR') {
    const prompt = examType === 'IELTS'
      ? this.getIELTSSpeakingPrompt(question, transcript)
      : this.getCEFRSpeakingPrompt(question, transcript);
    
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });
    
    return JSON.parse(completion.choices[0].message.content);
  }
  
  private getIELTSSpeakingPrompt(question: string, transcript: string): string {
    return `
You are an IELTS examiner. Evaluate the following speaking response.

Question: ${question}
Student Response: ${transcript}

Evaluate based on IELTS Speaking criteria:
1. Fluency and Coherence
2. Lexical Resource
3. Grammatical Range and Accuracy
4. Pronunciation

Return a JSON response with:
{
  "overallBand": number (0-9),
  "criteriaScores": {
    "fluencyAndCoherence": number (0-9),
    "lexicalResource": number (0-9),
    "grammaticalRange": number (0-9),
    "pronunciation": number (0-9)
  },
  "strengths": string[],
  "weaknesses": string[],
  "detailedFeedback": string,
  "vocabularyAnalysis": {
    "variety": string,
    "advancedWords": string[],
    "repetitions": string[]
  },
  "grammarAnalysis": {
    "accuracy": string,
    "complexity": string,
    "errors": [{ "error": string, "correction": string }]
  },
  "fluencyAnalysis": {
    "pace": string,
    "hesitations": number,
    "fillerWords": string[]
  }
}
`;
  }
  
  private getCEFRSpeakingPrompt(question: string, transcript: string): string {
    return `
You are a CEFR examiner. Evaluate the following speaking response.

Question: ${question}
Student Response: ${transcript}

Evaluate based on CEFR Speaking criteria:
1. Range (Grammar and vocabulary)
2. Accuracy (Grammar and vocabulary)
3. Fluency
4. Interaction
5. Coherence

Return a JSON response with:
{
  "overallScore": number (0-100),
  "cefrLevel": string (A1-C2),
  "criteriaScores": {
    "range": number (0-100),
    "accuracy": number (0-100),
    "fluency": number (0-100),
    "interaction": number (0-100),
    "coherence": number (0-100)
  },
  "strengths": string[],
  "areasForImprovement": string[],
  "detailedFeedback": string
}
`;
  }
  
  private calculateSpeakingScores(analysis: any, examType: 'IELTS' | 'CEFR') {
    // Calculate weighted scores based on analysis
    // Implementation depends on specific scoring algorithm
    return analysis;
  }
}
```

### 6.5 Grading Workflow

```typescript
// services/exam-grading.service.ts
@Injectable()
export class ExamGradingService {
  constructor(
    private aiGradingService: AIGradingService,
    private speakingGradingService: SpeakingGradingService,
    private prisma: PrismaService,
  ) {}
  
  async gradeExam(resultId: string) {
    const result = await this.prisma.result.findUnique({
      where: { id: resultId },
      include: {
        exam: true,
        userAnswers: {
          include: { question: true },
        },
      },
    });
    
    if (!result) throw new NotFoundException('Result not found');
    
    // Grade objective questions (Listening, Reading, Lexical)
    const objectiveScores = await this.gradeObjectiveQuestions(result.userAnswers);
    
    // Grade writing tasks
    const writingScores = await this.gradeWritingTasks(result.userAnswers, result.exam.type);
    
    // Grade speaking tasks
    const speakingScores = await this.gradeSpeakingTasks(result.userAnswers, result.exam.type);
    
    // Calculate overall score
    const overallScore = this.calculateOverallScore(
      objectiveScores,
      writingScores,
      speakingScores,
      result.exam.type,
    );
    
    // Update result
    await this.prisma.result.update({
      where: { id: resultId },
      data: {
        score: overallScore.total,
        ieltsBand: overallScore.band,
        cefrLevel: overallScore.cefrLevel,
        skillScores: {
          listening: objectiveScores.listening,
          reading: objectiveScores.reading,
          lexical: objectiveScores.lexical,
          writing: writingScores,
          speaking: speakingScores,
        },
        aiFeedback: {
          writing: writingScores.feedback,
          speaking: speakingScores.feedback,
        },
        status: 'GRADED',
      },
    });
    
    return overallScore;
  }
  
  private async gradeObjectiveQuestions(userAnswers: UserAnswer[]) {
    const scores = { listening: 0, reading: 0, lexical: 0 };
    
    for (const answer of userAnswers) {
      const question = answer.question;
      
      if (['MCQ', 'TRUE_FALSE', 'FILL_BLANKS', 'MATCHING'].includes(question.type)) {
        const isCorrect = this.checkAnswer(answer.answer, question.answer);
        if (isCorrect) {
          if (question.skill === 'LISTENING') scores.listening += question.points;
          if (question.skill === 'READING') scores.reading += question.points;
          if (question.skill === 'LEXICAL_COMPETENCE') scores.lexical += question.points;
        }
      }
    }
    
    return scores;
  }
  
  private checkAnswer(userAnswer: string, correctAnswer: string): boolean {
    // Normalize answers for comparison
    const normalize = (str: string) => str.trim().toLowerCase();
    return normalize(userAnswer) === normalize(correctAnswer);
  }
  
  private calculateOverallScore(
    objective: any,
    writing: any,
    speaking: any,
    examType: ExamType,
  ) {
    if (examType.includes('IELTS')) {
      // IELTS 9-band scoring
      const totalCorrect = objective.listening + objective.reading;
      const listeningBand = this.convertToIELTSBand(totalCorrect, 40);
      const readingBand = this.convertToIELTSBand(totalCorrect, 40);
      const writingBand = writing.overallBand;
      const speakingBand = speaking.overallBand;
      
      const overallBand = (listeningBand + readingBand + writingBand + speakingBand) / 4;
      
      return {
        total: overallBand,
        band: overallBand,
        cefrLevel: null,
      };
    } else {
      // CEFR percentage scoring
      const totalPossible = 100; // Adjust based on exam structure
      const totalScore = (objective.listening + objective.reading + objective.lexical) / totalPossible * 100;
      const writingScore = writing.overallScore;
      const speakingScore = speaking.overallScore;
      
      const overallScore = (totalScore + writingScore + speakingScore) / 3;
      const cefrLevel = this.convertToCEFRLevel(overallScore);
      
      return {
        total: overallScore,
        band: null,
        cefrLevel,
      };
    }
  }
  
  private convertToIELTSBand(correct: number, total: number): number {
    const percentage = (correct / total) * 100;
    if (percentage >= 90) return 9;
    if (percentage >= 80) return 8;
    if (percentage >= 70) return 7;
    if (percentage >= 60) return 6;
    if (percentage >= 50) return 5;
    if (percentage >= 40) return 4;
    if (percentage >= 30) return 3;
    if (percentage >= 20) return 2;
    return 1;
  }
  
  private convertToCEFRLevel(score: number): string {
    if (score >= 90) return 'C2';
    if (score >= 80) return 'C1';
    if (score >= 65) return 'B2';
    if (score >= 50) return 'B1';
    if (score >= 35) return 'A2';
    return 'A1';
  }
}
```

---

## 7. User Workflow

### 7.1 Exam Taking Flow

```
1. User logs in
   ↓
2. User selects exam type (IELTS/CEFR)
   ↓
3. User selects specific exam
   ↓
4. System checks payment/subscription
   ↓
5. User clicks "Start Test"
   ↓
6. System requests fullscreen mode
   ↓
7. System starts proctoring (camera, browser monitoring)
   ↓
8. Timer starts for first skill
   ↓
9. User completes questions (split-screen interface)
   ↓
10. Time expires or user submits
   ↓
11. Auto-submit or manual submit
   ↓
12. Move to next skill (repeat 8-11)
   ↓
13. All skills completed
   ↓
14. Final submission
   ↓
15. Proctoring stops
   ↓
16. System grades objective questions immediately
   ↓
17. System queues AI grading for writing/speaking
   ↓
18. Results displayed (objective scores first, AI scores later)
```

### 7.2 Admin Exam Creation Flow

```
1. Admin logs in
   ↓
2. Admin navigates to "Create Exam"
   ↓
3. Admin selects exam type (IELTS/CEFR)
   ↓
4. Admin enters exam details (title, duration, level)
   ↓
5. System creates exam structure with default parts
   ↓
6. Admin adds questions for each part:
   - Listening: Upload audio + add questions
   - Reading: Add passage + add questions
   - Writing: Add task prompt
   - Speaking: Add task prompt + optional audio
   ↓
7. Admin reviews and publishes exam
   ↓
8. Exam becomes available to students
```

---

## 8. Security Considerations

### 8.1 Authentication & Authorization
- JWT tokens with short expiration (15 minutes access, 7 days refresh)
- Role-based access control (RBAC)
- Password hashing with bcrypt (salt rounds: 12)
- Rate limiting on authentication endpoints

### 8.2 Data Protection
- HTTPS/TLS encryption for all communications
- Database encryption at rest
- Sensitive data (passwords) never logged
- PII compliance (GDPR, local regulations)

### 8.3 Exam Integrity
- Proctoring event logging
- Integrity score calculation
- Flag suspicious results for manual review
- Time-based answer submission validation

### 8.4 File Upload Security
- File type validation (whitelist approach)
- File size limits
- Virus scanning (ClamAV or similar)
- S3 presigned URLs with expiration

### 8.5 API Security
- CORS configuration
- Request validation with DTOs
- SQL injection prevention (Prisma ORM)
- XSS protection (input sanitization)

### 8.6 AI API Security
- API key rotation
- Usage monitoring and rate limiting
- Cost tracking and alerts
- Fallback mechanisms for AI failures

---

## 9. Deployment Architecture

### 9.1 Recommended Infrastructure

```
Load Balancer (AWS ALB / Nginx)
    ↓
Frontend (Next.js) - Vercel / AWS S3 + CloudFront
    ↓
Backend (NestJS) - AWS ECS / Kubernetes
    ↓
Database (PostgreSQL) - AWS RDS
    ↓
Cache (Redis) - AWS ElastiCache
    ↓
File Storage (S3) - AWS S3
    ↓
WebSocket Server - Socket.io with Redis adapter
```

### 9.2 Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AI Services
OPENAI_API_KEY=sk-...
WHISPER_API_KEY=sk-...

# AWS
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=mock-test-uploads

# App
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-domain.com
```

---

## 10. Performance Optimization

### 10.1 Database Optimization
- Indexing on frequently queried fields
- Connection pooling (Prisma)
- Read replicas for analytics queries
- Query optimization with Prisma includes/selects

### 10.2 Caching Strategy
- Redis for session data
- CDN for static assets (S3 + CloudFront)
- API response caching (React Query)
- Database query caching

### 10.3 Frontend Optimization
- Code splitting (Next.js automatic)
- Image optimization (Next.js Image component)
- Lazy loading components
- Service worker for offline support

### 10.4 AI API Optimization
- Batch processing for multiple submissions
- Response caching for similar prompts
- Fallback to simpler models for high load
- Queue system for async grading (Bull Queue)

---

## 11. Monitoring & Logging

### 11.1 Metrics to Track
- API response times
- Database query performance
- AI API usage and costs
- Exam completion rates
- Proctoring event frequency
- User engagement metrics

### 11.2 Logging Strategy
- Structured logging with Winston
- Log levels: error, warn, info, debug
- Centralized log aggregation (ELK stack or CloudWatch)
- Alerting for critical errors

### 11.3 Error Tracking
- Sentry for error tracking
- User context in error reports
- Performance monitoring
- Release tracking

---

## 12. Future Enhancements

### 12.1 Planned Features
- Mobile app (React Native)
- Offline exam mode
- Adaptive testing (difficulty adjustment)
- Peer review system
- Gamification elements
- Advanced analytics dashboard
- Integration with LMS systems

### 12.2 Scalability Considerations
- Horizontal scaling for backend
- Database sharding for large datasets
- Microservices architecture for specific features
- CDN edge locations for global distribution

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-27  
**Author:** Technical Architecture Team
