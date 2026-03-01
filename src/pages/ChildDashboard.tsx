import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useShallow } from 'zustand/react/shallow';
import { ChildHeader } from '../features/profiles/components/ChildHeader';
import { QuestList } from '../features/chores/components/QuestList';
import { RewardShop } from '../features/rewards/components/RewardShop';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Trophy, Gift, Sparkles, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import canvasConfetti from 'canvas-confetti';
import { get } from 'idb-keyval';
import { ConnectionFooter } from '../components/ui/ConnectionFooter';

type Tab = 'quests' | 'rewards';

export function ChildDashboard() {
    const { childId } = useParams<{ childId: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>('quests');
    
    const { profiles, assignments, syncWithCloud, isSyncing, familyId } = useStore(useShallow(state => ({
        profiles: state.profiles,
        assignments: state.assignments,
        syncWithCloud: state.syncWithCloud,
        isSyncing: state.isSyncing,
        familyId: state.familyId
    })));

    const profile = useMemo(() => profiles.find(p => p.id === childId), [profiles, childId]);
    
    // Ensure cloud data is synced when entering the dashboard
    useEffect(() => {
        const initDashboard = async () => {
            const linkedId = familyId || await get('linked-family-id');
            if (linkedId) {
                syncWithCloud(linkedId);
            }
        };
        initDashboard();
    }, [childId, familyId, syncWithCloud]);

    // Filter assignments for this specific child
    const childAssignments = useMemo(() => 
        assignments.filter(a => a.childId === childId || (a as any).profile_id === childId), 
    [assignments, childId]);

    // Confetti effect on level up
    const lastLevel = useRef(profile?.level || 1);
    useEffect(() => {
        if (profile && profile.level > lastLevel.current) {
            canvasConfetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#4f46e5', '#818cf8', '#fbbf24']
            });
            lastLevel.current = profile.level;
        }
    }, [profile?.level]);

    // Redirect to home if profile is not found (important for unlinked/reset state)
    useEffect(() => {
        if (!isSyncing && !profile && profiles.length === 0) {
            navigate('/', { replace: true });
        }
    }, [profile, profiles.length, isSyncing, navigate]);

    if (!profile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
                <div className="text-center space-y-4">
                    <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
                    <p className="text-slate-500 font-medium">Loading hero...</p>
                    <Button variant="ghost" onClick={() => navigate('/')}>Return to Selection</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50 max-w-md mx-auto relative shadow-2xl">
            {/* Header Area */}
            <header className="bg-indigo-600 pt-4 pb-20 px-4 relative overflow-hidden">
                <div className="flex items-center justify-between relative z-10 mb-4">
                    <button 
                        onClick={() => navigate('/')}
                        className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/30 transition-all"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        {isSyncing && <RefreshCw className="h-4 w-4 text-white/50 animate-spin" />}
                        <h1 className="text-white font-black tracking-tight">Quest Log</h1>
                    </div>
                    <div className="h-10 w-10" /> {/* Spacer */}
                </div>
                
                <ChildHeader profile={profile} />
                
                {/* Background Decorations */}
                <Sparkles className="absolute top-10 right-10 h-20 w-20 text-white/10 rotate-12" />
                <Trophy className="absolute -bottom-10 -left-10 h-40 w-40 text-white/5 -rotate-12" />
            </header>

            {/* Main Content Area */}
            <main className="flex-1 -mt-12 relative z-10 px-4 overflow-y-auto hidden-scrollbar pb-24">
                <div className="bg-white rounded-t-[2.5rem] min-h-full p-6 shadow-sm border-x border-slate-100">
                    {activeTab === 'quests' ? (
                        <QuestList assignments={childAssignments} />
                    ) : (
                        <RewardShop profile={profile} />
                    )}

                    <ConnectionFooter />
                </div>
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[calc(448px-2rem)] bg-white/80 backdrop-blur-xl border border-slate-200 p-2 rounded-[2rem] shadow-2xl z-50">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('quests')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-all",
                            activeTab === 'quests' 
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105" 
                                : "text-slate-400 hover:bg-slate-100"
                        )}
                    >
                        <Trophy className="h-5 w-5" />
                        Quests
                    </button>
                    <button
                        onClick={() => setActiveTab('rewards')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-all",
                            activeTab === 'rewards' 
                                ? "bg-amber-500 text-white shadow-lg shadow-amber-100 scale-105" 
                                : "text-slate-400 hover:bg-slate-100"
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
