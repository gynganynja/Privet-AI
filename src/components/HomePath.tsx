import { useNavigate } from "react-router-dom";
import { Check, Star, Lock, Play } from "lucide-react";
import { cn } from "@/lib/utils";
// import { Button } from "@/components/ui/button"; 
import { COURSE_CONTENT } from "@/data/courseContent";
import { useAppStore } from "@/store";
import type { LessonNode } from "@/types/curriculum";

export function HomePath() {
    const navigate = useNavigate();
    const { userProgress } = useAppStore();

    // For now, visualize Unit 1 only. In future, map all units.
    const currentUnit = COURSE_CONTENT.units[0];
    const nodes = currentUnit.nodes;

    const getNodeStatus = (node: LessonNode, index: number) => {
        if (userProgress.completedNodes.includes(node.id)) return 'completed';

        // Active if previous node is completed OR it's the first node
        const prevNode = index > 0 ? nodes[index - 1] : null;
        if (!prevNode || userProgress.completedNodes.includes(prevNode.id)) return 'active';

        return 'locked';
    };

    const handleNodeClick = (node: LessonNode, status: string) => {
        if (status === 'locked') return;

        // Navigate to Lesson Engine with Lesson ID
        // The Engine needs to fetch content based on this ID
        if (status === 'active' || status === 'completed') {
            // For Phase 2 Debug: If completed, maybe show summary? For now just re-play.
            navigate(`/lessons/${node.id}`);
        }
    };

    return (
        <div className="relative w-full max-w-md mx-auto py-12 px-4 pb-32">
            {/* SVG Path Background */}
            {/* SVG Path Background */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 600" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
                        <stop offset="50%" stopColor="#2563eb" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0.1" />
                    </linearGradient>
                </defs>
                {/* Simplified straight line for Unit 1 visual */}
                {/* Mapping percentages: 50% -> 50, 30% -> 30, 70% -> 70. Y coordinates approximated based on node distribution */}
                <path
                    d="M 50 40 L 50 100 L 50 200 L 30 300 L 70 400 L 50 500"
                    fill="none"
                    stroke="url(#pathGradient)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="opacity-50 vector-effect-non-scaling-stroke"
                />
            </svg>

            {/* Nodes */}
            <div className="relative z-10 space-y-16">
                {nodes.map((node, index) => {
                    const status = getNodeStatus(node, index);
                    return (
                        <div
                            key={node.id}
                            className={cn(
                                "flex flex-col items-center relative transition-transform duration-300",
                                status === 'active' ? "scale-110" : "scale-100 hover:scale-105"
                            )}
                            style={{
                                // Positioning from data
                                alignItems: node.x < 50 ? 'flex-start' : node.x > 50 ? 'flex-end' : 'center',
                                marginLeft: node.x < 50 ? '20%' : node.x > 50 ? 'auto' : 'auto',
                                marginRight: node.x > 50 ? '20%' : node.x < 50 ? 'auto' : 'auto',
                                width: 'fit-content'
                            }}
                            onClick={() => handleNodeClick(node, status)}
                        >
                            {/* Circle Node */}
                            <div className={cn(
                                "w-20 h-20 rounded-full flex items-center justify-center border-4 shadow-lg cursor-pointer transition-all",
                                status === 'completed' && "bg-amber-400 border-amber-500 text-white",
                                status === 'active' && `bg-primary border-primary-foreground text-white animate-pulse-slow shadow-primary/40`,
                                status === 'locked' && "bg-muted border-muted-foreground/20 text-muted-foreground/40",
                            )}>
                                {status === 'completed' && <Check size={32} strokeWidth={3} />}
                                {status === 'active' && <Play size={32} fill="currentColor" className="ml-1" />}
                                {status === 'locked' && <Lock size={24} />}
                            </div>

                            {/* Label Badge */}
                            <div className={cn(
                                "mt-3 px-3 py-1.5 rounded-xl text-center shadow-sm border bg-card max-w-[120px]",
                                status === 'active' && "border-primary/50 ring-2 ring-primary/20",
                                status === 'locked' && "opacity-60 grayscale"
                            )}>
                                <div className="text-sm font-bold leading-tight">{node.title}</div>
                                <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{node.description}</div>
                            </div>

                            {/* Floating Stars for completed */}
                            {status === 'completed' && (
                                <div className="absolute -top-2 -right-2 flex gap-0.5">
                                    <Star size={12} fill="#fbbf24" className="text-amber-400" />
                                    <Star size={12} fill="#fbbf24" className="text-amber-400" />
                                    <Star size={12} fill="#fbbf24" className="text-amber-400" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

        </div>
    );
}
