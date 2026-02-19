export interface LessonNode {
    id: string;
    title: string;
    description: string;
    type: 'lesson' | 'quiz' | 'chest';

    // Position for the path visualization (0-100% width, Y-step)
    x: number;
    y: number;

    // Content Payload (for the Lesson Engine)
    content?: {
        topic: string;
        level: 'A1' | 'A2' | 'B1';
        focusPoints: string[]; // e.g. ["Cyrillic Alphabet", "Hard vs Soft signs"]
    };
}

export interface Unit {
    id: string;
    title: string;
    description: string;
    color: string; // Hex code or Tailwind class anchor
    nodes: LessonNode[];
}

export interface Course {
    id: string;
    title: string;
    units: Unit[];
}

export interface UserProgress {
    completedNodes: string[]; // List of Node IDs
    currentUnitId: string;
    hearts: number;
    xp: number;
}
