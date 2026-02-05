import { useState } from 'react';
import { useStore } from '../../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Plus, Clock, Trash2 } from 'lucide-react';
import type { Frequency, Chore } from '../../types';
import { AssignChoreModal } from './AssignChoreModal';
import { BulkAssignModal } from './BulkAssignModal';

export function ChoreBank() {
    const { chores, addChore, archiveChore, seedDefaultChores } = useStore();
    const [assigningChore, setAssigningChore] = useState<Chore | null>(null);

    const [title, setTitle] = useState('');
    const [points, setPoints] = useState('10');
    const [frequency, setFrequency] = useState<Frequency>('daily');
    const [requiresApproval, setRequiresApproval] = useState(false);
    const [tags, setTags] = useState('');

    const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);

    const activeChores = chores.filter(c => c.status === 'active');

    const handleAddChore = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;

        const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);

        addChore({
            title,
            points: parseInt(points) || 0,
            frequency,
            requiresApproval,
            icon: 'Circle',
            tags: tagList,
        });

        setTitle('');
        setPoints('10');
        setTags('');
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Add New Chore</CardTitle>
                            <CardDescription>Create tasks for your children to complete.</CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <Button variant="outline" size="sm" onClick={() => setIsBulkAssignModalOpen(true)} className="gap-2 w-full sm:w-auto">
                                <Plus className="h-4 w-4" /> Bulk Assign
                            </Button>
                            <Button variant="secondary" size="sm" onClick={seedDefaultChores} className="gap-2 w-full sm:w-auto">
                                <Plus className="h-4 w-4" /> Seed Prayers
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddChore} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Chore Title</label>
                                <Input
                                    placeholder="e.g. Clean Room"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Points Reward</label>
                                <Input
                                    type="number"
                                    value={points}
                                    onChange={(e) => setPoints(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Frequency</label>
                                <select
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    value={frequency}
                                    onChange={(e) => setFrequency(e.target.value as Frequency)}
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="one-time">One-time</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tags (comma separated)</label>
                                <Input
                                    placeholder="e.g. prayer, daily, kitchen"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="approval"
                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                checked={requiresApproval}
                                onChange={(e) => setRequiresApproval(e.target.checked)}
                            />
                            <label htmlFor="approval" className="text-sm font-medium">Requires Parent Approval</label>
                        </div>

                        <Button type="submit" className="w-full text-center">
                            <Plus className="mr-2 h-4 w-4 inline-block" /> Add Chore
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h3 className="font-bold text-lg">Active Chores</h3>
                <div className="grid gap-4">
                    {activeChores.map(chore => (
                        <Card key={chore.id} className="overflow-hidden">
                            <div className="flex items-center p-4 gap-4">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                    <span className="font-bold">{chore.points}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold truncate">{chore.title}</h4>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        <div className="flex items-center gap-1 text-xs text-slate-500">
                                            <Clock className="h-3 w-3" />
                                            <span className="capitalize">{chore.frequency}</span>
                                        </div>
                                        {chore.tags && chore.tags.map(tag => (
                                            <span key={tag} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium border border-slate-200">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => setAssigningChore(chore)}>
                                        Assign
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => archiveChore(chore.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {activeChores.length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                            <p>No active chores found. Create one above!</p>
                        </div>
                    )}
                </div>
            </div>

            <AssignChoreModal
                chore={assigningChore}
                isOpen={!!assigningChore}
                onClose={() => setAssigningChore(null)}
            />

            <BulkAssignModal
                isOpen={isBulkAssignModalOpen}
                onClose={() => setIsBulkAssignModalOpen(false)}
            />
        </div>
    );
}
