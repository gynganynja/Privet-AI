export interface LessonNode {
    id: string;
    title: string;
    description: string;
    type: 'lesson' | 'quiz';

    // Brief for the lesson generator
    content: {
        topic: string;
        level: 'A1' | 'A2' | 'B1';
        focusPoints: string[];
    };
}

export interface Unit {
    id: string;
    title: string;
    description: string;
    nodes: LessonNode[];
}

export interface Course {
    id: string;
    title: string;
    units: Unit[];
}
