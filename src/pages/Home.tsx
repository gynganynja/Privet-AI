import { HomePath } from "@/components/HomePath";
import { Flame, Heart } from "lucide-react";

export default function HomePage() {
    return (
        <div className="flex flex-col min-h-screen bg-[#F5F7FA] dark:bg-background">
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex justify-between items-center max-w-md mx-auto w-full">
                <div className="flex items-center gap-1">
                    {/* Flag or Level Icon */}
                    <span className="text-2xl">🇷🇺</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-orange-500">
                        <Flame size={20} fill="currentColor" />
                        <span className="font-bold text-sm">12</span>
                    </div>
                    <div className="flex items-center gap-1 text-red-500">
                        <Heart size={20} fill="currentColor" />
                        <span className="font-bold text-sm">5</span>
                    </div>
                </div>
            </header>

            {/* Path Visualization */}
            <div className="flex-1 overflow-x-hidden">
                <HomePath />
            </div>
        </div>
    );
}
