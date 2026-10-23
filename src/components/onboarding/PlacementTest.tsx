import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";

export type Placement = 'beginner' | 'some' | 'confident';

interface PlacementTestProps {
    onComplete: (placement: Placement) => void;
}

// 10 Progressive Questions (A1 -> A2)
const questions = [
    {
        id: 1,
        question: "Select 'Hello'",
        options: ["Пока", "Привет", "Нет"],
        correct: "Привет"
    },
    {
        id: 2,
        question: "Translate: 'This is a cat.'",
        options: ["Это кот.", "Где кот?", "Там кот."],
        correct: "Это кот."
    },
    {
        id: 3,
        question: "Select 'My House'",
        options: ["Мой дом", "Моя дома", "Моё дом"],
        correct: "Мой дом"
    },
    {
        id: 4,
        question: "Which form is correct? 'I live in Moscow.'",
        options: ["Я живу в Москва.", "Я живу в Москве.", "Я живу в Москву."],
        correct: "Я живу в Москве." // Prepositional Case
    },
    {
        id: 5,
        question: "Translate: 'I have a dog.'",
        options: ["Я имею собака.", "У меня есть собака.", "У меня собаку."],
        correct: "У меня есть собака." // Genitive Construction
    },
    {
        id: 6,
        question: "Identify the plural: 'Books'",
        options: ["Книга", "Книги", "Книгу"],
        correct: "Книги"
    },
    {
        id: 7,
        question: "Past tense: 'He worked'",
        options: ["Он работал", "Она работала", "Они работали"],
        correct: "Он работал"
    },
    {
        id: 8,
        question: "Future: 'I will read'",
        options: ["Я буду читать", "Я прочитал", "Я читаю"],
        correct: "Я буду читать"
    },
    {
        id: 9,
        question: "Aspect: 'I was reading all day.'",
        options: ["Я прочитал весь день.", "Я читал весь день."],
        correct: "Я читал весь день." // Imperfective
    },
    {
        id: 10,
        question: "Complex: 'The man who is standing there...'",
        options: ["Человек, который стоит там...", "Человек, кто стоит там..."],
        correct: "Человек, который стоит там..."
    }
];

export function PlacementTest({ onComplete }: PlacementTestProps) {
    const [index, setIndex] = useState(0);
    const [incorrectCount, setIncorrectCount] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [finished, setFinished] = useState(false);

    const currentQ = questions[index];
    const progress = (index / questions.length) * 100;

    const finishTest = (finalCorrect: number) => {
        setFinished(true);
        // 0-3 correct: start at Unit 1; 4-7: skip the alphabet unit; 8+: skip two units.
        const placement: Placement = finalCorrect >= 8 ? 'confident' : finalCorrect >= 4 ? 'some' : 'beginner';
        setTimeout(() => onComplete(placement), 1200);
    };

    const handleAnswer = (option: string) => {
        const isCorrect = option === currentQ.correct;
        const correct = correctCount + (isCorrect ? 1 : 0);
        const incorrect = incorrectCount + (isCorrect ? 0 : 1);
        setCorrectCount(correct);
        setIncorrectCount(incorrect);

        // Questions get harder, so two mistakes is enough to place the learner.
        if (incorrect >= 2 || index === questions.length - 1) {
            finishTest(correct);
        } else {
            setIndex(prev => prev + 1);
        }
    };

    if (finished) {
        return (
            <div className="text-center space-y-6 animate-in fade-in zoom-in-95 py-12">
                <CheckCircle2 className="h-16 w-16 text-primary mx-auto animate-pulse" />
                <h2 className="text-2xl font-bold">Finding your starting point…</h2>
                <p className="text-muted-foreground">You got {correctCount} right.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300 max-w-md mx-auto">
            <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <span>Placement Test</span>
                    <span>{index + 1} / {questions.length}</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            <Card className="border-2 border-primary/10 shadow-lg">
                <div className="p-6 space-y-6">
                    <h2 className="text-xl font-bold text-center">{currentQ.question}</h2>
                    <div className="grid gap-3">
                        {currentQ.options.map((option) => (
                            <Button
                                key={option}
                                variant="outline"
                                lang="ru"
                                className="h-auto py-4 text-lg justify-start px-6 whitespace-normal text-left hover:bg-primary/5 hover:border-primary/50 transition-all"
                                onClick={() => handleAnswer(option)}
                            >
                                {option}
                            </Button>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
}
