import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfileManager } from '../features/profiles/components/ProfileManager';
import { ChoreBank } from '../features/chores/components/ChoreBank';
import { RewardBank } from '../features/rewards/components/RewardBank';
import { ApprovalQueue } from '../features/chores/components/ApprovalQueue';
import { SettingsModal } from '../features/settings/components/SettingsModal';
import { ParentAuth } from '../features/auth/components/ParentAuth';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Users, ListTodo, Gift, Settings, CheckSquare, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store';
import { useAuthStore } from '../store/useAuthStore';
import { ConnectionFooter } from '../components/ui/ConnectionFooter';
import { FREE_TIER_LIMITS } from '../constants';

type Tab = 'profiles' | 'chores' | 'rewards' | 'approvals';

/**
 * Main Controller for the Parent Interface.
 * 
 * @description
 * Hosts the management tools (Profiles, Chores, Rewards, Approvals) within a tabbed interface.
 * STRICTLY gated by Supabase Email/Password session.
 * 
 * @route /parent/*
 */
export function ParentDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>('profiles');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { session } = useAuthStore(); // Only allow full session
    const { assignments, chores, profiles, rewards, isPremium } = useStore();

    // STRICT SECURITY: Only parents with a session can enter here.
    if (!session) {
        return <ParentAuth />;
    }

    const activeChores = chores.filter(c => c.status === 'active');
    const activeRewards = rewards.filter(r => r.status === 'active');

    // Check if the user is in a "Grandfathered" over-limit state (downgraded)
    const isOverLimits = !isPremium && (
        profiles.length > FREE_TIER_LIMITS.PROFILES ||
        activeChores.length > FREE_TIER_LIMITS.CHORES ||
        activeRewards.length > FREE_TIER_LIMITS.REWARDS
    );

    // Calculate pending approvals count
    const pendingCount = assignments.filter(a => {
        if (!a.completed || a.verifiedAt) return false;
        const chore = chores.find(c => c.id === a.choreId);
        return chore?.requiresApproval;
    }).length;

    const tabs = [
        { id: 'profiles', label: 'Profiles', icon: Users, badge: 0 },
        { id: 'chores', label: 'Chores', icon: ListTodo, badge: 0 },
        { id: 'approvals', label: 'Approvals', icon: CheckSquare, badge: pendingCount },
        { id: 'rewards', label: 'Rewards', icon: Gift, badge: 0 },
    ] as const;

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="font-bold text-lg text-slate-900">Parent Dashboard</h1>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
                    <Settings className="h-5 w-5 text-slate-500" />
                </Button>
            </header>

            {/* Over Limit Warning Banner */}
            {isOverLimits && (
                <div className="bg-amber-100 border-b border-amber-200 px-4 py-3 flex items-start gap-3 shrink-0">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-amber-900 leading-tight">Free Tier Limits Exceeded</p>
                        <p className="text-xs text-amber-800 leading-tight">
                            You cannot add new items until you remove some or re-upgrade to Premium. Existing quests and rewards will continue to work normally.
                        </p>
                        <button 
                            onClick={() => setIsSettingsOpen(true)}
                            className="text-xs font-bold text-amber-700 underline mt-1 block hover:text-amber-900 transition-colors"
                        >
                            View Subscription Settings
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 hidden-scrollbar pb-24">
                {activeTab === 'profiles' && <ProfileManager />}
                {activeTab === 'chores' && <ChoreBank />}
                {activeTab === 'approvals' && <ApprovalQueue />}
                {activeTab === 'rewards' && <RewardBank />}
                
                <ConnectionFooter />
            </main>

            {/* Settings Modal */}
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

            {/* Bottom Navigation */}
            <nav className="bg-white border-t border-slate-200 fixed bottom-0 left-0 right-0 max-w-md mx-auto z-10">
                <div className="flex justify-around items-center h-16">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as Tab)}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 relative",
                                activeTab === tab.id ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <div className="relative">
                                <tab.icon className={cn("h-6 w-6", activeTab === tab.id && "fill-current")} />
                                {tab.badge > 0 && (
                                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px]">
                                        {tab.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-medium">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    );
}
