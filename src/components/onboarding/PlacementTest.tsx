import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle } from "lucide-react";

interface PlacementTestProps {
    onComplete: (recommendedLevel: string) => void;
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
    const progress = ((index) / questions.length) * 100;

    const handleAnswer = (option: string) => {
        const isCorrect = option === currentQ.correct;

        if (isCorrect) {
            setCorrectCount(prev => prev + 1);
        } else {
            setIncorrectCount(prev => prev + 1);
        }

        // Logic: Stop if 2 mistakes
        if (!isCorrect && incorrectCount + 1 >= 2) {
            finishTest(correctCount); // Pass current, not prev, but react state lag...
            // actually verify with local var for safety
            return;
        }

        // Next question
        if (index < questions.length - 1) {
            setIndex(prev => prev + 1);
        } else {
            finishTest(correctCount + (isCorrect ? 1 : 0));
        }
    };

    const finishTest = (finalCorrect: number) => {
        setFinished(true);
        // Calculate result
        // 0-3 Correct: Unit 1
        // 4-7 Correct: Unit 5
        // 8+ Correct: Unit 10
        setTimeout(() => {
            let level = "Unit 1";
            if (finalCorrect >= 8) level = "Unit 10";
            else if (finalCorrect >= 4) level = "Unit 5";
            onComplete(level);
        }, 1500); // Fake processing delay
    };

    // If we just triggered finish via early exit in render cycle (due to state update latency pattern above, 
    // better to handle in effect or just render "Processing..." if finished)
    if (finished) {
        return (
            <div className="text-center space-y-6 animate-in fade-in zoom-in-95 py-12">
                <CheckCircle2 className="h-16 w-16 text-primary mx-auto animate-pulse" />
                <h2 className="text-2xl font-bold">Analyzing your skills...</h2>
                <p className="text-muted-foreground">Finding the perfect starting point.</p>
            </div>
        );
    }

    // Early exit UI check
    if (incorrectCount >= 2) {
        // Auto-triggering finish in effect would be better, but for now specific UI 
        // Let's just catch it in the handler
        return (
            <div className="text-center space-y-6 animate-in fade-in zoom-in-95 py-12">
                <XCircle className="h-16 w-16 text-orange-500 mx-auto" />
                <h2 className="text-2xl font-bold">Let's start from the basics!</h2>
                <p className="text-muted-foreground">It seems Unit 1 is the best place to build a strong foundation.</p>
                <Button onClick={() => onComplete("Unit 1")} size="lg" className="mt-4">
                    Start Unit 1
                </Button>
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
                                className="h-auto py-4 text-lg justify-start px-6 hover:bg-primary/5 hover:border-primary/50 transition-all"
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
