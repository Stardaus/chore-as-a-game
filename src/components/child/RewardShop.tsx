import { useStore } from '../../store';
import { Button } from '../ui/Button';
import { Gift, Lock } from 'lucide-react';
import type { Profile } from '../../types';

interface RewardShopProps {
    profile: Profile;
}

export function RewardShop({ profile }: RewardShopProps) {
    const { rewards, redeemReward } = useStore();

    const activeRewards = rewards.filter(r => r.status === 'active');

    const handleRedeem = (rewardId: string) => {
        // Basic confirm?
        if (window.confirm("Are you sure you want to redeem this reward?")) {
            redeemReward(rewardId, profile.id);
        }
    };

    return (
        <div className="space-y-4 pb-20">
            <div className="bg-pink-50 p-4 rounded-2xl border border-pink-100 flex items-center gap-4">
                <div className="h-12 w-12 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 shrink-0">
                    <Gift className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="font-bold text-pink-900">Reward Shop</h3>
                    <p className="text-pink-700 text-sm">Spend your hard-earned points here!</p>
                </div>
                <div className="ml-auto text-right">
                    <span className="block text-2xl font-bold text-pink-600">{profile.points}</span>
                    <span className="text-xs font-bold text-pink-400 uppercase">Available</span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeRewards.map(reward => {
                    const canAfford = profile.points >= reward.cost;

                    return (
                        <div
                            key={reward.id}
                            className={`bg-white rounded-2xl p-4 border-2 shadow-sm transition-all flex flex-col gap-3 ${!canAfford ? 'opacity-70 grayscale-[0.5]' : 'hover:border-pink-300 hover:shadow-md'}`}
                        >
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-lg leading-tight">{reward.title}</h4>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${canAfford ? 'bg-pink-100 text-pink-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {reward.cost} Pts
                                </span>
                            </div>

                            <Button
                                size="sm"
                                disabled={!canAfford}
                                onClick={() => handleRedeem(reward.id)}
                                className={`mt-auto w-full ${canAfford ? 'bg-pink-500 hover:bg-pink-600 text-white' : 'bg-slate-200 text-slate-400'}`}
                            >
                                {canAfford ? 'Redeem' : 'Need more points'}
                                {!canAfford && <Lock className="ml-2 h-3 w-3" />}
                            </Button>
                        </div>
                    );
                })}
                {activeRewards.length === 0 && (
                    <div className="col-span-full text-center py-10 text-slate-400">
                        <p>No rewards available yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
