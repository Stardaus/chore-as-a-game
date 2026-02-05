import type { Profile } from '../../types';
import { Crown, Star, Trophy } from 'lucide-react';

interface ChildHeaderProps {
    profile: Profile;
}

export function ChildHeader({ profile }: ChildHeaderProps) {
    // Simple level progress calculation (e.g. 100 XP per level)
    const xpForNextLevel = 100;
    const progress = (profile.xp % xpForNextLevel) / xpForNextLevel * 100;

    return (
        <div className="bg-indigo-600 text-white p-6 rounded-b-[2rem] shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                {/* Background pattern */}
                <div className="absolute top-[-20%] left-[-10%] w-40 h-40 bg-white rounded-full mix-blend-overlay blur-3xl"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-40 h-40 bg-white rounded-full mix-blend-overlay blur-3xl"></div>
            </div>

            <div className="relative z-10 flex items-center gap-4">
                <div className="relative">
                    <div className="h-20 w-20 rounded-full border-4 border-indigo-400 bg-white overflow-hidden shadow-inner">
                        <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full border-2 border-white shadow-sm flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        <span>Lvl {profile.level}</span>
                    </div>
                </div>

                <div className="flex-1 space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">{profile.name}</h2>

                    {/* XP Bar */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-medium text-indigo-100">
                            <span>XP</span>
                            <span>{Math.floor(profile.xp % xpForNextLevel)} / {xpForNextLevel}</span>
                        </div>
                        <div className="h-2 bg-indigo-900/40 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-yellow-400 transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="mt-6 flex gap-3">
                <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3 border border-white/10">
                    <div className="h-8 w-8 rounded-full bg-yellow-400/20 flex items-center justify-center text-yellow-300">
                        <Star className="h-5 w-5 fill-current" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold leading-none">{profile.points}</div>
                        <div className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">Points</div>
                    </div>
                </div>
                {/* Achievement Placeholder */}
                <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3 border border-white/10 opacity-70">
                    <div className="h-8 w-8 rounded-full bg-purple-400/20 flex items-center justify-center text-purple-300">
                        <Trophy className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-xs font-medium">Badges</div>
                        <div className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">Coming Soon</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
