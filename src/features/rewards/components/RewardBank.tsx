import { useState } from 'react';
import { useStore } from '../../../store';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Trash2, Plus, Gift } from 'lucide-react';
import { FREE_TIER_LIMITS } from '../../../constants';

export function RewardBank() {
  const { rewards, addReward, archiveReward, isPremium } = useStore();
  const [title, setTitle] = useState('');
  const [cost, setCost] = useState('50');

  const activeRewards = rewards.filter((r) => r.status === 'active');
  const canAddReward = isPremium || activeRewards.length < FREE_TIER_LIMITS.REWARDS;

  const handleAddReward = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (trimmedTitle && canAddReward) {
      const costNum = Math.min(Math.max(parseInt(cost) || 0, 1), 50000);
      addReward({
        title: trimmedTitle,
        cost: costNum,
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
          <CardDescription>
            Create rewards for children to redeem with their points.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddReward} className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="e.g. 30 Mins Screen Time"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={40}
                required
                disabled={!canAddReward}
              />
            </div>
            <div className="w-28">
              <Input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                min="1"
                max="50000"
                required
                disabled={!canAddReward}
              />
            </div>
            <Button type="submit" disabled={!title.trim() || !canAddReward}>
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
          </form>
          {!canAddReward && (
            <p className="text-xs text-amber-600 mt-2 font-medium">
              Free plan limit reached ({FREE_TIER_LIMITS.REWARDS} Rewards). Upgrade to Premium to
              add more.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4 pb-12">
        <h3 className="text-lg font-bold text-slate-800 px-2">
          Reward Bank ({activeRewards.length})
        </h3>
        <div className="grid gap-3">
          {activeRewards.map((reward) => (
            <Card key={reward.id} className="overflow-hidden border-slate-100 shadow-none bg-white">
              <div className="flex items-center p-4 gap-4">
                <div className="h-10 w-10 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center shrink-0">
                  <Gift className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">{reward.title}</h3>
                  <p className="text-xs font-bold text-indigo-600">{reward.cost} Points</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => archiveReward(reward.id)}
                  className="text-slate-300 hover:text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
        {activeRewards.length === 0 && (
          <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">
            <p className="italic">No rewards available. Create one above!</p>
          </div>
        )}
      </div>
    </div>
  );
}
