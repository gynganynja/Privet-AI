import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FlashcardData } from '@/types/flashcard';
import type { SavedLesson, LessonContent } from '@/types/lesson';
import { calculateReview, type ReviewRating } from '@/lib/srs';
import { EMBEDDED_API_KEY } from './config';

export interface FlashcardDeck {
    id: string;
    title: string;
    cards: FlashcardData[];
    createdAt: number;
}

interface AppState {
    apiKey: string;
    setApiKey: (key: string) => void;

    // Flashcard State
    decks: FlashcardDeck[];
    addDeck: (title: string, cards: FlashcardData[]) => string; // Returns new Deck ID
    deleteDeck: (id: string) => void;
    saveCardToDeck: (deckId: string, card: FlashcardData) => void;
    reviewCard: (deckId: string, cardIndex: number, rating: ReviewRating) => void;

    // Lesson State
    savedLessons: SavedLesson[];
    saveLesson: (content: LessonContent, relatedDeckId?: string) => void;
    deleteLesson: (id: string) => void;

    // Audio Settings
    audioSettings: {
        enabled: boolean;
        provider: 'browser' | 'openai';
        voiceURI: string | null;
        openaiVoice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
        speed: number;
        autoPlay: boolean;
        narration: boolean; // New: Teacher voice toggle
    };
    setAudioSettings: (settings: Partial<AppState['audioSettings']>) => void;

    // Chat Persistence
    chatSessions: Record<string, any[]>;
    saveChatSession: (scenarioId: string, messages: any[]) => void;
    clearChatSession: (scenarioId: string) => void;

    // Phase 2: Error Profiling
    errorProfile: {
        tags: Record<string, number>; // e.g. "case_genitive": 5
        lastMistakes: { prompt: string, error: string, correct: string, timestamp: number }[];
    };
    logError: (tag: string, mistake: { prompt: string, error: string, correct: string }) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            apiKey: EMBEDDED_API_KEY || '',
            setApiKey: (key) => set({ apiKey: key }),

            decks: [],
            addDeck: (title, cards) => {
                const newId = Date.now().toString() + Math.random().toString(36).substring(2);
                set((state) => ({
                    decks: [...state.decks, { id: newId, title, cards, createdAt: Date.now() }]
                }));
                return newId;
            },
            deleteDeck: (id) => set((state) => ({
                decks: state.decks.filter(d => d.id !== id)
            })),
            saveCardToDeck: (deckId, card) => set((state) => ({
                decks: state.decks.map(d => d.id === deckId ? { ...d, cards: [...d.cards, card] } : d)
            })),

            reviewCard: (deckId, cardIndex, rating) => set((state) => ({
                decks: state.decks.map(d => {
                    if (d.id !== deckId) return d;

                    const newCards = [...d.cards];
                    const card = newCards[cardIndex];
                    if (!card) return d;

                    const newSrs = calculateReview(card.srs, rating);
                    newCards[cardIndex] = { ...card, srs: newSrs };

                    return { ...d, cards: newCards };
                })
            })),

            getDueCards: (_deckId: string) => {
                // This is a selector, but we can't 'get' state inside 'set' easily without get().
                // Zustand persist makes this tricky if we want it as a pure function.
                return [];
            },

            savedLessons: [],
            saveLesson: (content, relatedDeckId) => set((state) => ({
                savedLessons: [...state.savedLessons, {
                    id: Date.now().toString() + Math.random().toString(36).substring(2),
                    content,
                    createdAt: Date.now(),
                    relatedDeckId
                }]
            })),
            deleteLesson: (id) => set((state) => ({
                savedLessons: state.savedLessons.filter(l => l.id !== id)
            })),

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
                const newSessions = { ...state.chatSessions };
                delete newSessions[scenarioId];
                return { chatSessions: newSessions };
            }),

            errorProfile: { tags: {}, lastMistakes: [] },
            logError: (tag, mistake) => set((state) => {
                const newTags = { ...state.errorProfile.tags };
                newTags[tag] = (newTags[tag] || 0) + 1;

                const newMistakes = [
                    { ...mistake, timestamp: Date.now() },
                    ...state.errorProfile.lastMistakes
                ].slice(0, 50); // Keep last 50

                return {
                    errorProfile: {
                        tags: newTags,
                        lastMistakes: newMistakes
                    }
                };
            }),
        }),
        {
            name: 'privet-ai-storage',
        }
    )
);
