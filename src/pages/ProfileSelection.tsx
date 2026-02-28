import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { ShieldCheck, UserCircle, Users, Smartphone, Sparkles, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { JoinFamily } from '../features/auth/components/JoinFamily';
import { get } from 'idb-keyval';
import { cn } from '../lib/utils';

/**
 * Entry point for all users.
 * 
 * @description
 * Allows users to:
 * 1. Enter the Parent Dashboard (PIN required).
 * 2. Enter a Child Dashboard (One-click).
 * 3. Link a new device to a family account.
 */
export function ProfileSelection() {
    const navigate = useNavigate();
    const { profiles, isSyncing, syncWithCloud } = useStore();
    const { session } = useAuthStore();
    const [view, setView] = useState<'select' | 'join'>('select');
    const [isLinked, setIsLinked] = useState(false);

    useEffect(() => {
        const checkLink = async () => {
            const familyId = await get('linked-family-id');
            setIsLinked(!!familyId || !!session);
            
            // If linked but profiles empty, try a quick sync
            if (familyId && profiles.length === 0) {
                syncWithCloud(familyId);
            }
        };
        checkLink();
    }, [session, profiles.length, syncWithCloud]);

    const handleChildSelect = (childId: string) => {
        navigate(`/child/${childId}`);
    };

    const handleParentSelect = () => {
        navigate('/parent');
    };

    if (view === 'join') {
        return <JoinFamily onJoined={() => { setView('select'); setIsLinked(true); }} onBack={() => setView('select')} />;
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
            <div className="w-full max-w-md space-y-10">
                {/* App Branding */}
                <div className="text-center space-y-2">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-[2rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-200 mb-2 rotate-3 transform hover:rotate-0 transition-transform cursor-default">
                        <Sparkles className="h-10 w-10 fill-current" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">ChoreQuest</h1>
                    <p className="text-slate-500 font-medium italic">Who is playing today?</p>
                </div>

                {/* Profiles Grid */}
                <div className="grid grid-cols-2 gap-6 relative">
                    {isSyncing && profiles.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 z-10 rounded-3xl backdrop-blur-sm">
                            <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
                        </div>
                    )}

                    {/* Parent Profile */}
                    <button 
                        onClick={handleParentSelect}
                        className="group flex flex-col items-center space-y-3 transition-all"
                    >
                        <div className="relative">
                            <div className="h-28 w-28 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center text-white shadow-lg group-hover:shadow-indigo-200 group-hover:scale-105 transition-all outline outline-0 outline-indigo-200 group-hover:outline-8">
                                <ShieldCheck className="h-12 w-12" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-md">
                                <UserCircle className="h-5 w-5 text-indigo-600" />
                            </div>
                        </div>
                        <span className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">Parent Hub</span>
                    </button>

                    {/* Child Profiles */}
                    {profiles.map((profile) => (
                        <button
                            key={profile.id}
                            onClick={() => handleChildSelect(profile.id)}
                            className="group flex flex-col items-center space-y-3 transition-all animate-in fade-in zoom-in duration-300"
                        >
                            <div className="relative">
                                <div className="h-28 w-28 rounded-[2.5rem] bg-white border-2 border-slate-100 overflow-hidden shadow-sm group-hover:shadow-indigo-100 group-hover:border-indigo-200 group-hover:scale-105 transition-all outline outline-0 outline-indigo-50 group-hover:outline-8">
                                    <img 
                                        src={profile.avatar} 
                                        alt={profile.name} 
                                        className="h-full w-full object-cover grayscale-[0.2] group-hover:grayscale-0"
                                    />
                                </div>
                            </div>
                            <span className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{profile.name}</span>
                        </button>
                    ))}
                </div>

                {/* Secondary Actions */}
                {!isLinked && (
                    <div className="pt-6 border-t border-slate-200">
                        <Card className="border-2 border-dashed border-slate-200 bg-transparent shadow-none hover:bg-slate-100/50 transition-colors">
                            <CardContent className="p-4">
                                <button 
                                    onClick={() => setView('join')}
                                    className="w-full flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
                                            <Smartphone className="h-5 w-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-slate-700">Family Member?</p>
                                            <p className="text-[10px] text-slate-500">Link this device to a family hub</p>
                                        </div>
                                    </div>
                                    <Users className="h-4 w-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
                                </button>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* App Version / Footer */}
                <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    ChoreQuest v1.0.0 • {isLinked ? 'Family Link Active' : 'Offline Mode'}
                </p>
            </div>
        </div>
    );
}
