export const saveExamProgress = (mockId: string, userId: string, data: any) => {
  const key = `exam_progress_${mockId}_${userId}`;
  localStorage.setItem(key, JSON.stringify({
    ...data,
    savedAt: new Date().toISOString(),
  }));
};

export const loadExamProgress = (mockId: string, userId: string) => {
  const key = `exam_progress_${mockId}_${userId}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

export const clearExamProgress = (mockId: string, userId: string) => {
  const key = `exam_progress_${mockId}_${userId}`;
  localStorage.removeItem(key);
};

export const saveAdminDraft = (mockId: string, data: any) => {
  const key = `admin_mock_draft_${mockId}`;
  localStorage.setItem(key, JSON.stringify({
    ...data,
    savedAt: new Date().toISOString(),
  }));
};

export const loadAdminDraft = (mockId: string) => {
  const key = `admin_mock_draft_${mockId}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

export const clearAdminDraft = (mockId: string) => {
  const key = `admin_mock_draft_${mockId}`;
  localStorage.removeItem(key);
};
