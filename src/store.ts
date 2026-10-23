import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FlashcardData } from '@/types/flashcard';
import type { SavedLesson, LessonContent } from '@/types/lesson';
import { calculateReview, isDue, type ReviewRating } from '@/lib/srs';
import { COURSE_CONTENT } from '@/data/courseContent';

export interface FlashcardDeck {
    id: string;
    title: string;
    cards: FlashcardData[];
    createdAt: number;
}

export type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export interface UserProgress {
    completedNodes: string[];
    isOnboarded: boolean;
    userGoal?: string;
    streak: number;
    lastActiveDate?: string; // Local YYYY-MM-DD of the last lesson or review
    xp: number;
}

interface AppState {
    apiKey: string;
    setApiKey: (key: string) => void;

    // Flashcards
    decks: FlashcardDeck[];
    addDeck: (title: string, cards: FlashcardData[]) => string;
    deleteDeck: (id: string) => void;
    addCardsToDeck: (title: string, cards: FlashcardData[]) => number; // Returns number of new cards
    reviewCard: (deckId: string, cardIndex: number, rating: ReviewRating) => void;
    getDueCards: (deckId: string) => FlashcardData[];

    // Lessons
    savedLessons: SavedLesson[];
    saveLesson: (content: LessonContent, relatedDeckId?: string) => void;
    deleteLesson: (id: string) => void;
    // Generated content for course path nodes, so revisiting a node doesn't regenerate it
    nodeLessons: Record<string, LessonContent>;
    cacheNodeLesson: (nodeId: string, content: LessonContent) => void;
    clearNodeLesson: (nodeId: string) => void;

    // Audio
    audioSettings: {
        enabled: boolean;
        provider: 'browser' | 'openai';
        voiceURI: string | null;
        openaiVoice: OpenAIVoice;
        speed: number;
        autoPlay: boolean;
        narration: boolean;
    };
    setAudioSettings: (settings: Partial<AppState['audioSettings']>) => void;

    // Roleplay persistence
    chatSessions: Record<string, { role: string, content: string }[]>;
    saveChatSession: (scenarioId: string, messages: { role: string, content: string }[]) => void;
    clearChatSession: (scenarioId: string) => void;

    // Error profiling
    errorProfile: {
        tags: Record<string, number>;
        lastMistakes: { prompt: string, error: string, correct: string, timestamp: number }[];
    };
    logError: (tag: string, mistake: { prompt: string, error: string, correct: string }) => void;

    // Progress
    userProgress: UserProgress;
    completeLesson: (nodeId: string | undefined, stats: { total: number; correct: number }) => number; // Returns XP earned
    recordActivity: () => void;
    completeOnboarding: (placement: 'beginner' | 'some' | 'confident', goal?: string) => void;
    resetProgress: () => void;
}

const newId = () => Date.now().toString() + Math.random().toString(36).substring(2);

const localDate = (offsetDays = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Streak shown to the user: it lapses once a full day passes without activity.
export const currentStreak = (progress: UserProgress) => {
    if (!progress.lastActiveDate) return 0;
    return progress.lastActiveDate === localDate() || progress.lastActiveDate === localDate(-1)
        ? progress.streak
        : 0;
};

const bumpStreak = (progress: UserProgress): UserProgress => {
    const today = localDate();
    if (progress.lastActiveDate === today) return progress;
    const streak = progress.lastActiveDate === localDate(-1) ? progress.streak + 1 : 1;
    return { ...progress, streak, lastActiveDate: today };
};

const INITIAL_PROGRESS: UserProgress = {
    completedNodes: [],
    isOnboarded: false,
    streak: 0,
    xp: 0,
};

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            apiKey: '',
            setApiKey: (key) => set({ apiKey: key.trim() }),

            decks: [],
            addDeck: (title, cards) => {
                const id = newId();
                set((state) => ({
                    decks: [...state.decks, { id, title, cards, createdAt: Date.now() }]
                }));
                return id;
            },
            deleteDeck: (id) => set((state) => ({
                decks: state.decks.filter(d => d.id !== id)
            })),
            addCardsToDeck: (title, cards) => {
                const deck = get().decks.find(d => d.title === title);
                const known = new Set((deck?.cards ?? []).map(c => c.russian.toLowerCase()));
                const fresh = cards.filter(c => c.russian && !known.has(c.russian.toLowerCase()));
                if (fresh.length === 0) return 0;
                if (deck) {
                    set((state) => ({
                        decks: state.decks.map(d => d.id === deck.id ? { ...d, cards: [...d.cards, ...fresh] } : d)
                    }));
                } else {
                    get().addDeck(title, fresh);
                }
                return fresh.length;
            },

            reviewCard: (deckId, cardIndex, rating) => {
                set((state) => ({
                    decks: state.decks.map(d => {
                        if (d.id !== deckId) return d;
                        const card = d.cards[cardIndex];
                        if (!card) return d;
                        const cards = [...d.cards];
                        cards[cardIndex] = { ...card, srs: calculateReview(card.srs, rating) };
                        return { ...d, cards };
                    })
                }));
                get().recordActivity();
            },

            getDueCards: (deckId) => {
                const deck = get().decks.find(d => d.id === deckId);
                return deck ? deck.cards.filter(isDue) : [];
            },

            savedLessons: [],
            saveLesson: (content, relatedDeckId) => set((state) => ({
                savedLessons: [...state.savedLessons, { id: newId(), content, createdAt: Date.now(), relatedDeckId }]
            })),
            deleteLesson: (id) => set((state) => ({
                savedLessons: state.savedLessons.filter(l => l.id !== id)
            })),

            nodeLessons: {},
            cacheNodeLesson: (nodeId, content) => set((state) => ({
                nodeLessons: { ...state.nodeLessons, [nodeId]: content }
            })),
            clearNodeLesson: (nodeId) => set((state) => {
                const nodeLessons = { ...state.nodeLessons };
                delete nodeLessons[nodeId];
                return { nodeLessons };
            }),

            audioSettings: {
                enabled: true,
                provider: 'browser',
                voiceURI: null,
                openaiVoice: 'alloy',
                speed: 1.0,
                autoPlay: false,
                narration: true,
            },
            setAudioSettings: (settings) => set((state) => ({
                audioSettings: { ...state.audioSettings, ...settings }
            })),

            chatSessions: {},
            saveChatSession: (scenarioId, messages) => set((state) => ({
                chatSessions: { ...state.chatSessions, [scenarioId]: messages }
            })),
            clearChatSession: (scenarioId) => set((state) => {
                const chatSessions = { ...state.chatSessions };
                delete chatSessions[scenarioId];
                return { chatSessions };
            }),

            errorProfile: { tags: {}, lastMistakes: [] },
            logError: (tag, mistake) => set((state) => ({
                errorProfile: {
                    tags: { ...state.errorProfile.tags, [tag]: (state.errorProfile.tags[tag] || 0) + 1 },
                    lastMistakes: [{ ...mistake, timestamp: Date.now() }, ...state.errorProfile.lastMistakes].slice(0, 50)
                }
            })),

            userProgress: INITIAL_PROGRESS,
            completeLesson: (nodeId, { total, correct }) => {
                const progress = get().userProgress;
                const firstTime = !!nodeId && !progress.completedNodes.includes(nodeId);
                // 10 XP for finishing, up to 10 more for accuracy; replays earn half.
                const accuracyBonus = total > 0 ? Math.round((correct / total) * 10) : 5;
                const earned = Math.round((10 + accuracyBonus) * (firstTime || !nodeId ? 1 : 0.5));
                set({
                    userProgress: {
                        ...bumpStreak(progress),
                        completedNodes: firstTime ? [...progress.completedNodes, nodeId!] : progress.completedNodes,
                        xp: progress.xp + earned,
                    }
                });
                return earned;
            },
            recordActivity: () => set((state) => ({ userProgress: bumpStreak(state.userProgress) })),
            completeOnboarding: (placement, goal) => set((state) => {
                // Placement skips whole units the learner has shown they know.
                const skipUnits = placement === 'confident' ? 2 : placement === 'some' ? 1 : 0;
                const skipped = COURSE_CONTENT.units.slice(0, skipUnits).flatMap(u => u.nodes.map(n => n.id));
                return {
                    userProgress: {
                        ...state.userProgress,
                        isOnboarded: true,
                        userGoal: goal ?? state.userProgress.userGoal,
                        completedNodes: [...new Set([...state.userProgress.completedNodes, ...skipped])],
                    }
                };
            }),
            resetProgress: () => set({
                userProgress: INITIAL_PROGRESS,
                nodeLessons: {},
                errorProfile: { tags: {}, lastMistakes: [] },
            }),
        }),
        {
            name: 'privet-ai-storage',
            version: 1,
            migrate: (persisted, version) => {
                const state = persisted as Record<string, unknown>;
                if (version < 1) {
                    // v0 builds shipped with a hard-coded (now exposed) API key that was persisted
                    // into every install. Drop it so the user enters their own.
                    state.apiKey = '';
                    const old = (state.userProgress ?? {}) as Record<string, unknown>;
                    state.userProgress = {
                        ...INITIAL_PROGRESS,
                        completedNodes: Array.isArray(old.completedNodes)
                            ? (old.completedNodes as string[]).filter(id => id !== 'lesson-completed')
                            : [],
                        isOnboarded: !!old.isOnboarded,
                        userGoal: old.userGoal as string | undefined,
                        xp: typeof old.xp === 'number' ? old.xp : 0,
                    };
                }
                return state as unknown as AppState;
            },
        }
    )
);
