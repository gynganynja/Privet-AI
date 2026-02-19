import type { Course } from "@/types/curriculum";

export const COURSE_CONTENT: Course = {
    id: "russian-foundation",
    title: "Russian Foundation",
    units: [
        {
            id: "unit-1",
            title: "Unit 1: The Basics",
            description: "Alphabet, Sounds, and First Words",
            color: "bg-blue-600",
            nodes: [
                {
                    id: "u1-l1",
                    title: "The Alphabet",
                    description: "Learn the first 6 letters",
                    type: 'lesson',
                    x: 50,
                    y: 0,
                    content: {
                        topic: "Cyrillic Alphabet Part 1",
                        level: "A1",
                        focusPoints: ["A, K, M, O, T"]
                    }
                },
                {
                    id: "u1-l2",
                    title: "First Words",
                    description: "Mama, Papa, and Home",
                    type: 'lesson',
                    x: 50,
                    y: 1,
                    content: {
                        topic: "Family Basics",
                        level: "A1",
                        focusPoints: ["Gender basics (Mama/Papa)", "Hard consonants"]
                    }
                },
                {
                    id: "u1-l3",
                    title: "Greetings",
                    description: "Hello & Goodbye",
                    type: 'lesson',
                    x: 30, // curve left
                    y: 2,
                    content: {
                        topic: "Formal vs Informal Greetings",
                        level: "A1",
                        focusPoints: ["Privet vs Zdravstvuyte"]
                    }
                },
                {
                    id: "u1-quiz",
                    title: "Unit Checkpoint",
                    description: "Test your knowledge",
                    type: 'quiz',
                    x: 70, // curve right
                    y: 3,
                    content: {
                        topic: "Unit 1 Review",
                        level: "A1",
                        focusPoints: ["All Unit 1 specific vocabulary"]
                    }
                }
            ]
        },
        {
            id: "unit-2",
            title: "Unit 2: Who is this?",
            description: "Introductions and Pronouns",
            color: "bg-green-600",
            nodes: [
                {
                    id: "u2-l1",
                    title: "Pronouns",
                    description: "I, You, He, She",
                    type: 'lesson',
                    x: 50,
                    y: 4,
                    content: {
                        topic: "Personal Pronouns",
                        level: "A1",
                        focusPoints: ["Nominative Case Pronouns"]
                    }
                }
            ]
        }
    ]
};
