import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Button } from '../components/ui/Button';
import { Lock, UserPlus, Crown } from 'lucide-react';

/**
 * Landing Page / Profile Switcher.
 * 
 * @description
 * The entry point of the application. Displays all available child profiles for quick access.
 * Provides a protected route (conceptually) to the Parent Dashboard.
 * 
 * @route /
 */
export function ProfileSelection() {
    const navigate = useNavigate();
    const { profiles } = useStore();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-slate-900">Who is playing?</h1>
                    <p className="text-slate-500">Tap your profile to start your quest!</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {profiles.map((profile) => (
                        <button
                            key={profile.id}
                            onClick={() => navigate(`/child/${profile.id}`)}
                            className="group relative flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all text-center space-y-4"
                        >
                            <div className="relative">
                                <div className="h-20 w-20 rounded-full bg-indigo-50 border-4 border-white shadow-sm overflow-hidden group-hover:scale-105 transition-transform">
                                    <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
                                </div>
                                {/* Level Badge */}
                                <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full border border-white shadow-sm flex items-center gap-1">
                                    <Crown className="w-3 h-3" />
                                    {profile.level}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">{profile.name}</h3>
                                <p className="text-sm text-slate-500">{profile.points} XP</p>
                            </div>
                        </button>
                    ))}

                    {/* Add Profile / Parent Helper if no profiles */}
                    {profiles.length === 0 && (
                        <div className="col-span-2 text-center py-8 bg-dashed border-2 border-slate-200 rounded-2xl border-dashed">
                            <p className="text-slate-400 mb-4">No profiles found.</p>
                            <Button onClick={() => navigate('/parent')}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Set up Profiles
                            </Button>
                        </div>
                    )}
                </div>

                <div className="pt-8 flex justify-center">
                    <Button
                        variant="outline"
                        className="gap-2 text-slate-500 hover:text-slate-900"
                        onClick={() => navigate('/parent')}
                    >
                        <Lock className="h-4 w-4" />
                        Parent Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
}
