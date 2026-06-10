# Manual Test Checklist

Before deployment, verify all features work correctly.

## PART A: Mock Creation & Management

### A1: IELTS Mock Creation
- [ ] Navigate to Admin > IELTS > Create
- [ ] Fill in mock details (title, type, level, duration, price)
- [ ] Save Listening section with audio file
- [ ] Save Reading section with passages
- [ ] Save Writing section with tasks
- [ ] Save Speaking section with prompts
- [ ] Verify all sections save without errors
- [ ] Check error messages display correctly

### A2: CEFR Mock Creation
- [ ] Navigate to Admin > CEFR > Create
- [ ] Fill in mock details (title, level, duration, price)
- [ ] Save Listening section with audio file
- [ ] Save Reading section with passages
- [ ] Save Writing section with tasks
- [ ] Save Speaking section with prompts
- [ ] Verify all sections save without errors
- [ ] Check error messages display correctly

### A3: Question Bank
- [ ] Navigate to Admin > Question Bank
- [ ] Test filtering by type (speaking, writing, reading, listening)
- [ ] Test filtering by exam type (CEFR, IELTS)
- [ ] Create a new question
- [ ] Edit existing question
- [ ] Toggle question active status
- [ ] Delete a question
- [ ] Test bulk JSON upload functionality
- [ ] Verify JSON format validation works

### A4: Mock List Pages
- [ ] Navigate to Admin > IELTS
- [ ] Verify section completion indicators show (L ✓ R ✓ W ✗ S ✓)
- [ ] Test filtering by type (Academic, General)
- [ ] Test filtering by level (B1, B2, C1, C2)
- [ ] Test filtering by status (published, draft)
- [ ] Navigate to Admin > CEFR
- [ ] Verify section completion indicators show
- [ ] Test filtering by level (A1, A2, B1, B2, C1, C2)

## PART B: AI Speaking

### B1: AI Speaking Practice
- [ ] Navigate to AI Speaking page
- [ ] Test exam type selector (CEFR, IELTS)
- [ ] Test mode selector (Practice, Free)
- [ ] In Practice mode, test Part 1/2/3 selector
- [ ] Verify questions load from database
- [ ] Test "Next question" button
- [ ] Test "Next Part" button
- [ ] Test audio recording
- [ ] Test audio analysis
- [ ] Verify AI feedback displays correctly

## PART C: AI Writing

### C1: AI Writing Practice
- [ ] Navigate to AI Writing page
- [ ] Test exam type selector (CEFR, IELTS)
- [ ] Test mode selector (Practice, Free)
- [ ] In Practice mode, verify prompts load from database
- [ ] Test "Next prompt" button
- [ ] Write an essay
- [ ] Submit for analysis
- [ ] Verify AI feedback displays correctly

## PART D: Payments

### D1: Admin Payment Settings
- [ ] Navigate to Admin > Settings
- [ ] Verify Payment Cards section displays
- [ ] Add new payment card
- [ ] Edit existing payment card
- [ ] Toggle card active status
- [ ] Delete payment card
- [ ] Verify card details display correctly

### D2: Student Payment Modal
- [ ] Navigate to a paid exam as student
- [ ] Verify payment modal opens
- [ ] Check active card details display
- [ ] Verify payment instructions show

### D3: Receipt Upload
- [ ] Upload receipt image
- [ ] Verify file size validation (5MB limit)
- [ ] Check preview displays
- [ ] Verify upload progress bar shows
- [ ] Submit payment request
- [ ] Verify success message

### D4: Admin Payments
- [ ] Navigate to Admin > Payments
- [ ] Test tabs: Pending, Approved, Rejected, All
- [ ] Click on receipt thumbnail to open modal
- [ ] Verify full-size receipt displays
- [ ] Test approve button from modal
- [ ] Test reject button from modal
- [ ] Test AI Check button
- [ ] Verify AI auto-check works

### D5: AI Auto-Check Receipt
- [ ] Click AI Check button on pending payment
- [ ] Verify AI approves valid receipts
- [ ] Verify AI rejects suspicious receipts
- [ ] Check reason displays for rejection

### D6: Mock Access Guard
- [ ] Try to start a paid mock without payment
- [ ] Verify error message: "Bu mockni boshlash uchun to'lov qilishingiz kerak"
- [ ] Make payment and get approval
- [ ] Verify mock can be started after payment
- [ ] Test for both IELTS and CEFR mocks

## PART E: General

### E1: Authentication
- [ ] Test login with valid credentials
- [ ] Test login with invalid credentials
- [ ] Test logout
- [ ] Verify protected routes redirect to login

### E2: Navigation
- [ ] Test all admin menu items
- [ ] Test all student menu items
- [ ] Verify breadcrumbs work
- [ ] Test back navigation

### E3: Responsive Design
- [ ] Test on desktop (1920x1080)
- [ ] Test on laptop (1366x768)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)

## PART F: Deployment Preparation

### F1: Environment Variables
- [ ] Verify all required env vars are set
- [ ] Check NEXT_PUBLIC_API_URL
- [ ] Check DATABASE_URL
- [ ] Check JWT_SECRET
- [ ] Check AI API keys

### F2: Build
- [ ] Run `npm run build` in backend
- [ ] Run `npm run build` in frontend
- [ ] Verify no build errors

### F3: Database
- [ ] Run migrations if needed
- [ ] Verify database connection
- [ ] Check seed data

## Sign-off

- [ ] All tests passed
- [ ] No critical bugs found
- [ ] Ready for deployment

Tester: _______________
Date: _______________
