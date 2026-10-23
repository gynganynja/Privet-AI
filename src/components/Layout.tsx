import { Outlet, Link, NavLink } from 'react-router-dom';
import { Home, Dumbbell, User, Flame, Zap, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { currentStreak, useAppStore } from '@/store';

const TABS = [
    { label: "Learn", path: "/", icon: Home },
    { label: "Practice", path: "/practice", icon: Dumbbell },
    { label: "Profile", path: "/profile", icon: User }
];

function Layout() {
    const userProgress = useAppStore((s) => s.userProgress);
    const streak = currentStreak(userProgress);

    return (
        <div className="flex flex-col h-dvh bg-background">
            <header className="pt-safe border-b bg-card z-40 shrink-0">
                <div className="px-4 h-14 flex items-center justify-between max-w-4xl mx-auto">
                    <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm" aria-hidden>П</span>
                        Privet AI
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-orange-500" title={`${streak}-day streak`}>
                            <Flame className={cn("w-5 h-5", streak > 0 && "fill-orange-500")} />
                            <span className="font-bold text-sm">{streak}</span>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500" title="Total XP">
                            <Zap className="w-5 h-5 fill-yellow-500" />
                            <span className="font-bold text-sm">{userProgress.xp}</span>
                        </div>
                        <Link to="/settings" className="text-muted-foreground hover:text-foreground" aria-label="Settings">
                            <Settings className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto pb-24">
                <Outlet />
            </main>

            <nav className="fixed bottom-0 left-0 right-0 border-t bg-card z-40 pb-safe">
                <div className="flex justify-around items-center h-16 max-w-md mx-auto">
                    {TABS.map((tab) => (
                        <NavLink
                            key={tab.path}
                            to={tab.path}
                            end={tab.path === "/"}
                            className={({ isActive }) => cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    <tab.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                    <span className="text-xs font-medium">{tab.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            </nav>
        </div>
    );
}

export default Layout;
