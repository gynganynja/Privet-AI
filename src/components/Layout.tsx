import { Link, Outlet, useLocation } from "react-router-dom";
import { MessageCircle, BookOpen, Layers, Users, Settings, Menu, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";



export default function Layout() {
    const location = useLocation();
    const [open, setOpen] = useState(false);

    const navItems = [
        { to: "/", icon: LayoutDashboard, label: "Home" },
        { to: "/chat", icon: MessageCircle, label: "Chat" },
        { to: "/lessons", icon: BookOpen, label: "Lessons" },
        { to: "/flashcards", icon: Layers, label: "Flashcards" },
        { to: "/roleplay", icon: Users, label: "Roleplay" },
        { to: "/settings", icon: Settings, label: "Settings" },
    ];

    return (
        <div className="grid h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] overflow-hidden">
            {/* Desktop Sidebar */}
            <div className="hidden border-r bg-slate-900 text-slate-50 md:block overflow-y-auto">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b border-slate-800 px-4 lg:h-[60px] lg:px-6 shrink-0 sticky top-0 bg-slate-900 z-10">
                        <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-wide">
                            <img src="/logo.jpg" alt="Privet AI Logo" className="h-8 w-8 rounded-lg object-cover" />
                            <span><span className="text-primary">Privet</span> <span className="text-white">AI</span></span>
                        </Link>
                    </div>
                    <div className="flex-1 py-4">
                        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-white",
                                        location.pathname === item.to
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-slate-400 hover:bg-slate-800"
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
            </div>

            {/* Mobile Header & Content */}
            <div className="flex flex-col h-full overflow-hidden bg-background">
                <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 md:hidden shrink-0">
                    <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 md:hidden"
                        onClick={() => setOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                    <div className="w-full flex-1 flex items-center gap-2">
                        <img src="/logo.jpg" alt="Privet AI Logo" className="h-6 w-6 rounded-md object-cover" />
                        <span className="font-semibold text-foreground">Privet AI</span>
                    </div>
                </header>

                {/* Mobile Menu Overlay */}
                {open && (
                    <div className="fixed inset-0 z-50 md:hidden">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/50"
                            onClick={() => setOpen(false)}
                        />
                        {/* Sidebar */}
                        <div className="absolute top-0 bottom-0 left-0 w-3/4 max-w-xs bg-slate-900 text-slate-50 border-r border-slate-800 p-6 shadow-lg z-50 flex flex-col gap-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <img src="/logo.jpg" alt="Privet AI Logo" className="h-8 w-8 rounded-lg object-cover" />
                                    <span className="text-lg font-bold"><span className="text-primary">Privet</span> AI</span>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="text-slate-400 hover:text-white hover:bg-slate-800">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </div>
                            <nav className="grid gap-2 text-lg font-medium">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.to}
                                        to={item.to}
                                        onClick={() => setOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-white",
                                            location.pathname === item.to
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "text-slate-400 hover:bg-slate-800"
                                        )}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-y-auto w-full max-w-7xl mx-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
