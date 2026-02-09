import { useState } from 'react';
import { useStore } from '../../../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Trash2, Plus, Gift } from 'lucide-react';

/**
 * Management interface for Rewards.
 * 
 * @description
 * Allows parents to create and manage redeemable rewards (title, point cost).
 * Lists all active rewards and provides options to archive them.
 * 
 * @usedBy ParentDashboard (Rewards tab)
 */
export function RewardBank() {
    const { rewards, addReward, archiveReward, isPremium } = useStore();

    const [title, setTitle] = useState('');
    const [cost, setCost] = useState('50');

    const activeRewards = rewards.filter(r => r.status === 'active');
    const canAddReward = isPremium || activeRewards.length < 3;

    const handleAddReward = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            addReward({
                title: title.trim(),
                cost: parseInt(cost) || 50,
            });
            setTitle('');
            setCost('50');
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Add New Reward</CardTitle>
                    <CardDescription>Create rewards for children to redeem with their points.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddReward} className="flex gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="e.g. 30 Mins Screen Time"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                disabled={!canAddReward}
                            />
                        </div>
                        <div className="w-24">
                            <Input
                                type="number"
                                value={cost}
                                onChange={(e) => setCost(e.target.value)}
                                disabled={!canAddReward}
                            />
                        </div>
                        <Button type="submit" disabled={!title.trim() || !canAddReward}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add
                        </Button>
                    </form>
                    {!canAddReward && (
                        <p className="text-xs text-amber-600 mt-2 font-medium">
                            Free plan limit reached (3 Rewards). Upgrade to Premium to add more.
                        </p>
                    )}
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold px-2">Reward Bank ({activeRewards.length})</h3>
                <div className="grid gap-3">
                    {rewards.filter(r => r.status === 'active').map((reward) => (
                        <Card key={reward.id} className="overflow-hidden">
                            <div className="flex items-center p-4 gap-4">
                                <div className="h-10 w-10 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center">
                                    <Gift className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold">{reward.title}</h3>
                                    <p className="text-sm text-slate-500">{reward.cost} Points</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => archiveReward(reward.id)}
                                    className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
                {rewards.filter(r => r.status === 'active').length === 0 && (
                    <div className="text-center py-10 text-slate-400">
                        <p>No active rewards.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
