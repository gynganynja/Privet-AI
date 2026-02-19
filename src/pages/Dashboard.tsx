import { useState, useEffect } from "react";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MessageCircle, GraduationCap, Layers, Users, ArrowRight, Clock, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppStore } from "@/store";
import { isCardDue } from "@/lib/srs";
import { ReviewSession } from "@/components/ReviewSession";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
    const { decks } = useAppStore();
    const [dueCount, setDueCount] = useState(0);
    const [isReviewing, setIsReviewing] = useState(false);

    useEffect(() => {
        let count = 0;
        decks.forEach(deck => {
            deck.cards.forEach(card => {
                if (isCardDue(card)) count++;
            });
        });
        setDueCount(count);
    }, [decks]);

    if (isReviewing) {
        return <ReviewSession onClose={() => setIsReviewing(false)} />;
    }

    const features = [
        {
            title: "AI Chat Tutor",
            description: "Chat naturally with an AI tutor in Russian. Get instant corrections and translations.",
            icon: MessageCircle,
            href: "/chat",
            color: "text-blue-500",
            bgColor: "bg-blue-500/10"
        },
        {
            title: "Structured Lessons",
            description: "Generate personalized lessons on grammar, vocabulary, or culture.",
            icon: GraduationCap,
            href: "/lessons",
            color: "text-purple-500",
            bgColor: "bg-purple-500/10"
        },
        {
            title: "Flashcards",
            description: "Master vocabulary with smart decks and spaced repetition.",
            icon: Layers,
            href: "/flashcards",
            color: "text-amber-500",
            bgColor: "bg-amber-500/10"
        },
        {
            title: "Roleplay Scenarios",
            description: "Practice real-world situations like ordering coffee or job interviews.",
            icon: Users,
            href: "/roleplay",
            color: "text-pink-500",
            bgColor: "bg-pink-500/10"
        }
    ];

    return (
        <div className="container mx-auto max-w-5xl py-10 space-y-10">
            {/* Hero Section */}
            <div className="flex flex-col items-center text-center space-y-4">
                <img
                    src="/logo.jpg"
                    alt="Privet AI Logo"
                    className="h-24 w-24 rounded-2xl shadow-lg mb-6 object-cover animate-in fade-in zoom-in duration-500"
                />
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                    Welcome to <span className="text-primary">Privet AI</span>
                </h1>
                <p className="max-w-[700px] text-lg text-muted-foreground">
                    Your personal AI-powered Russian language tutor. Choose a mode below to start learning.
                </p>
            </div>

            {/* SRS Review Banner (Conditional) */}
            {dueCount > 0 && (
                <div className="animate-in fade-in slide-in-from-top-4">
                    <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4 text-center md:text-left">
                                <div className="bg-primary/20 p-3 rounded-full hidden md:block">
                                    <Clock className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-2 justify-center md:justify-start">
                                        Time to Review!
                                        <Badge variant="destructive" className="animate-pulse">{dueCount} Due</Badge>
                                    </h3>
                                    <p className="text-muted-foreground">Keep your streak alive and strengthen your memory.</p>
                                </div>
                            </div>
                            <Button size="lg" onClick={() => setIsReviewing(true)} className="w-full md:w-auto font-bold shadow-md">
                                <Layers className="mr-2 h-4 w-4" /> Start Review Session
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {features.map((feature) => (
                    <Link key={feature.title} to={feature.href} className="block group h-full">
                        <Card className="h-full transition-all duration-300 hover:shadow-lg hover:border-primary/50 group-hover:-translate-y-1">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className={`p-3 rounded-xl ${feature.bgColor} ${feature.color}`}>
                                        <feature.icon className="h-6 w-6" />
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                                </div>
                                <CardTitle className="text-xl mt-4 group-hover:text-primary transition-colors">
                                    {feature.title}
                                </CardTitle>
                                <CardDescription className="text-base mt-2">
                                    {feature.description}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Quick Stats or Footer (Optional placeholder) */}
            <div className="text-center text-sm text-muted-foreground pt-10">
                <p>Ready to master Russian? Start your journey today.</p>
            </div>
        </div>
    );
}
