import { UserProgress, Note } from '../types';

const USER_PROGRESS_KEY = 'jungAppUserProgress';
const NOTES_KEY = 'jungAppNotes';

export function saveUserProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(USER_PROGRESS_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save user progress:', error);
  }
}

export function loadUserProgress(): UserProgress | null {
  try {
    const stored = localStorage.getItem(USER_PROGRESS_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load user progress:', error);
    return null;
  }
}

export function clearUserProgress(): void {
  try {
    localStorage.removeItem(USER_PROGRESS_KEY);
  } catch (error) {
    console.error('Failed to clear user progress:', error);
  }
}

export function saveNotes(notes: Note[]): void {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch (error) {
    console.error('Failed to save notes:', error);
  }
}

export function loadNotes(): Note[] {
  try {
    const stored = localStorage.getItem(NOTES_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load notes:', error);
    return [];
  }
}

export function saveModuleProgress(moduleId: string, completed: boolean, score?: number): void {
  try {
    const progress = loadUserProgress() || {
      userId: 'default-user',
      completedModules: [],
      quizScores: {},
      totalTime: 0,
      lastAccessed: Date.now(),
      notes: []
    };

    if (completed && !progress.completedModules.includes(moduleId)) {
      progress.completedModules.push(moduleId);
    }

    if (score !== undefined) {
      progress.quizScores[moduleId] = score;
    }

    progress.lastAccessed = Date.now();
    saveUserProgress(progress);
  } catch (error) {
    console.error('Failed to save module progress:', error);
  }
}

export function loadModuleProgress(moduleId: string): { completed: boolean; score?: number } {
  try {
    const progress = loadUserProgress();
    if (!progress) {
      return { completed: false };
    }

    return {
      completed: progress.completedModules.includes(moduleId),
      score: progress.quizScores[moduleId]
    };
  } catch (error) {
    console.error('Failed to load module progress:', error);
    return { completed: false };
  }
}