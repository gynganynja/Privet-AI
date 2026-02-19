import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Dumbbell, User, Flame, Heart, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';

// IA: 3 Core Tabs
const TABS = [
    { label: "Home", path: "/", icon: Home },
    { label: "Practice", path: "/practice", icon: Dumbbell },
    { label: "Profile", path: "/profile", icon: User }
];

function Layout() {
    const location = useLocation();
    const { userProgress } = useAppStore();

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Top Gamification Header */}
            <header className="px-4 h-14 border-b flex items-center justify-between bg-card z-40 shrink-0">
                {/* Flag / Course (Static for now) */}
                <div className="w-8 h-6 bg-blue-600 rounded-sm relative overflow-hidden border">
                    <div className="absolute top-0 w-full h-1/3 bg-white" />
                    <div className="absolute bottom-0 w-full h-1/3 bg-red-600" />
                </div>

                <div className="flex items-center gap-4">
                    {/* Streak */}
                    <div className="flex items-center gap-1 text-orange-500">
                        <Flame className={cn("w-5 h-5", userProgress.streak > 0 && "fill-orange-500")} />
                        <span className="font-bold text-sm">{userProgress.streak}</span>
                    </div>

                    {/* Hearts */}
                    <div className="flex items-center gap-1 text-red-500">
                        <Heart className={cn("w-5 h-5", userProgress.hearts > 0 && "fill-red-500")} />
                        <span className="font-bold text-sm">{userProgress.hearts}</span>
                    </div>

                    {/* XP */}
                    <div className="flex items-center gap-1 text-yellow-500">
                        <Zap className="w-5 h-5 fill-yellow-500" />
                        <span className="font-bold text-sm">{userProgress.xp}</span>
                    </div>
                </div>
            </header>

            {/* Main Content Area - Scrollable */}
            <main className="flex-1 overflow-y-auto pb-24">
                <Outlet />
            </main>

            {/* Bottom Tab Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 border-t bg-card z-40 pb-safe">
                <div className="flex justify-around items-center h-16 max-w-md mx-auto">
                    {TABS.map((tab) => {
                        const isActive = location.pathname === tab.path;
                        const Icon = tab.icon;

                        return (
                            <Link
                                key={tab.path}
                                to={tab.path}
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                                    isActive
                                        ? "text-primary " // Blue
                                        : "text-muted-foreground hover:text-foreground" // Grey -> Dark
                                )}
                            >
                                {/* Icon State: Filled if active? Lucide doesn't support fill easily, use weight/color */}
                                <Icon
                                    size={24}
                                    strokeWidth={isActive ? 3 : 2}
                                    className={cn(isActive && "animate-pulse-once")}
                                />
                                <span className="text-xs font-medium">{tab.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}

export default Layout;
