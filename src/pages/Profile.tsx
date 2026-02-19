import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, LogOut, Award, Zap } from "lucide-react"

export default function ProfilePage() {
    return (
        <div className="p-6 space-y-6 max-w-md mx-auto">
            <header className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-2xl font-bold text-secondary-foreground">
                    G
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Gynga</h1>
                    <p className="text-muted-foreground">Level A1 • Unit 3</p>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardContent className="pt-6 flex flex-col items-center">
                        <Zap className="w-8 h-8 text-yellow-500 mb-2" />
                        <span className="text-2xl font-bold">12</span>
                        <span className="text-xs text-muted-foreground uppercase">Day Streak</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 flex flex-col items-center">
                        <Award className="w-8 h-8 text-primary mb-2" />
                        <span className="text-2xl font-bold">450</span>
                        <span className="text-xs text-muted-foreground uppercase">Total XP</span>
                    </CardContent>
                </Card>
            </div>

            {/* Settings Menu */}
            <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider ml-1">Settings</h3>

                <Button variant="outline" className="w-full justify-start h-14" asChild>
                    <a href="#/settings">
                        <Settings className="mr-3 h-5 w-5" />
                        App Settings
                    </a>
                </Button>

                <Button variant="ghost" className="w-full justify-start h-14 text-destructive hover:text-destructive/80 hover:bg-destructive/10">
                    <LogOut className="mr-3 h-5 w-5" />
                    Sign Out
                </Button>
            </div>
        </div>
    )
}
