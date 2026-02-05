import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { ChildHeader } from '../components/child/ChildHeader';
import { QuestList } from '../components/child/QuestList';
import { RewardShop } from '../components/child/RewardShop';
import { Button } from '../components/ui/Button';
import { ArrowLeft, ListTodo, Gift } from 'lucide-react';
import { cn } from '../lib/utils';
import confetti from 'canvas-confetti';

export function ChildDashboard() {
    const { childId } = useParams();
    const navigate = useNavigate();
    const { profiles, assignments } = useStore();
    const [activeTab, setActiveTab] = useState<'quests' | 'rewards'>('quests');

    const profile = profiles.find((p) => p.id === childId);
    const myAssignments = assignments.filter((a) => a.childId === childId);

    // Level up detection
    const prevLevelRef = useRef(profile?.level);

    useEffect(() => {
        if (profile && prevLevelRef.current !== undefined) {
            if (profile.level > prevLevelRef.current) {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        }
        prevLevelRef.current = profile?.level;
    }, [profile?.level]);

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Profile Not Found</h1>
                    <Button onClick={() => navigate('/')}>Go Back</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="sticky top-0 z-20 bg-slate-50">
                <div className="absolute top-4 left-4 z-30">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white rounded-full bg-black/10 backdrop-blur-sm" onClick={() => navigate('/')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </div>
                <ChildHeader profile={profile} />
            </div>

            <main className="p-4">
                {activeTab === 'quests' ? (
                    <QuestList assignments={myAssignments} />
                ) : (
                    <RewardShop profile={profile} />
                )}
            </main>

            {/* Bottom Navigation */}
            <nav className="bg-white border-t border-slate-200 fixed bottom-0 left-0 right-0 max-w-md mx-auto z-20 px-6 py-2 pb-6 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
                <div className="flex bg-slate-100 p-1 rounded-2xl relative overflow-hidden">
                    {/* Animated slider background could go here for polish */}
                    <button
                        onClick={() => setActiveTab('quests')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-sm z-10",
                            activeTab === 'quests' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <ListTodo className="h-5 w-5" />
                        Quests
                    </button>
                    <button
                        onClick={() => setActiveTab('rewards')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-sm z-10",
                            activeTab === 'rewards' ? "bg-white text-pink-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Gift className="h-5 w-5" />
                        Rewards
                    </button>
                </div>
            </nav>
        </div>
    );
}
