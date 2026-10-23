import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Lock, Play, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALL_NODES, COURSE_CONTENT } from "@/data/courseContent";
import { useAppStore } from "@/store";

type NodeStatus = 'completed' | 'active' | 'locked';

// Gentle zigzag so the path reads as a trail rather than a list.
const OFFSETS = ["0%", "-28%", "0%", "28%"];

export function HomePath() {
    const navigate = useNavigate();
    const { completedNodes } = useAppStore((s) => s.userProgress);
    const activeRef = useRef<HTMLButtonElement>(null);

    const done = new Set(completedNodes);
    // The next lesson is the first one not yet completed; everything after it stays locked.
    const nextId = ALL_NODES.find(n => !done.has(n.id))?.id;
    const statusOf = (id: string): NodeStatus => done.has(id) ? 'completed' : id === nextId ? 'active' : 'locked';

    useEffect(() => {
        activeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, []);

    let position = 0;

    return (
        <div className="w-full max-w-md mx-auto py-8 px-4 space-y-10">
            {COURSE_CONTENT.units.map((unit, unitIndex) => {
                const unitDone = unit.nodes.filter(n => done.has(n.id)).length;
                return (
                    <section key={unit.id} className="space-y-8">
                        <div className={cn(
                            "rounded-2xl p-4 text-primary-foreground shadow-sm",
                            unit.nodes.some(n => statusOf(n.id) !== 'locked') ? "bg-primary" : "bg-muted-foreground/60"
                        )}>
                            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Unit {unitIndex + 1}</p>
                            <h2 className="text-lg font-bold leading-tight">{unit.title}</h2>
                            <div className="flex justify-between items-end text-sm opacity-90">
                                <span>{unit.description}</span>
                                <span className="shrink-0 ml-2">{unitDone}/{unit.nodes.length}</span>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-8">
                            {unit.nodes.map((node) => {
                                const status = statusOf(node.id);
                                const offset = OFFSETS[position++ % OFFSETS.length];
                                const Icon = status === 'completed' ? Check : status === 'locked' ? Lock : node.type === 'quiz' ? Trophy : Play;
                                return (
                                    <button
                                        key={node.id}
                                        ref={status === 'active' ? activeRef : undefined}
                                        type="button"
                                        disabled={status === 'locked'}
                                        onClick={() => navigate(`/lessons/${node.id}`)}
                                        className="flex flex-col items-center group disabled:cursor-not-allowed focus-visible:outline-none"
                                        style={{ transform: `translateX(${offset})` }}
                                        aria-label={`${node.title}${status === 'locked' ? ' (locked)' : status === 'completed' ? ' (completed)' : ''}`}
                                    >
                                        <div className={cn(
                                            "w-20 h-20 rounded-full flex items-center justify-center border-4 shadow-lg transition-transform",
                                            "group-focus-visible:ring-4 group-focus-visible:ring-ring/40",
                                            status === 'completed' && "bg-amber-400 border-amber-500 text-white group-hover:scale-105",
                                            status === 'active' && "bg-primary border-primary/30 text-primary-foreground scale-110 shadow-primary/40 animate-pulse-slow",
                                            status === 'locked' && "bg-muted border-muted-foreground/20 text-muted-foreground/50",
                                        )}>
                                            <Icon size={status === 'locked' ? 24 : 30} strokeWidth={status === 'completed' ? 3 : 2}
                                                fill={status === 'active' && node.type !== 'quiz' ? "currentColor" : "none"}
                                                className={status === 'active' && node.type !== 'quiz' ? "ml-1" : undefined} />
                                        </div>
                                        <div className={cn(
                                            "mt-3 px-3 py-1.5 rounded-xl text-center shadow-sm border bg-card max-w-[150px]",
                                            status === 'active' && "border-primary/50 ring-2 ring-primary/20",
                                            status === 'locked' && "opacity-60",
                                        )}>
                                            <div className="text-sm font-bold leading-tight">{node.title}</div>
                                            <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{node.description}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                );
            })}

            {!nextId && (
                <div className="text-center space-y-2 py-8">
                    <Trophy className="h-12 w-12 mx-auto text-amber-500" />
                    <h3 className="text-xl font-bold">Course complete!</h3>
                    <p className="text-muted-foreground text-sm">Keep your words fresh in Practice, or replay any lesson above.</p>
                </div>
            )}
        </div>
    );
}
