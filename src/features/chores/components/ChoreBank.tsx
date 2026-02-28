import { useState } from 'react';
import { useStore } from '../../../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Plus, Clock, Trash2, Zap, Sparkles, Pencil } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { Frequency, Chore, Assignment } from '../../../types';
import { AssignChoreModal } from './AssignChoreModal';
import { BulkAssignModal } from './BulkAssignModal';
import { TemplateSelectorModal } from './TemplateSelectorModal';
import { EditChoreModal } from './EditChoreModal';

/**
 * Central management interface for Chores.
 * 
 * @description
 * Allows parents to:
 * - Create new chore templates (frequency, points, tags).
 * - Edit existing chore templates.
 * - Assign chores to children (individually or in bulk).
 * - Archive/Delete chores.
 * - Add from predefined templates.
 * 
 * @usedBy ParentDashboard (Chores tab)
 */
export function ChoreBank() {
    const { chores, addChore, archiveChore, isPremium, assignments, profiles } = useStore();
    const [assigningChore, setAssigningChore] = useState<Chore | null>(null);
    const [editingChore, setEditingChore] = useState<Chore | null>(null);

    const [title, setTitle] = useState('');
    const [points, setPoints] = useState('10');
    const [frequency, setFrequency] = useState<Frequency>('daily');
    const [requiresApproval, setRequiresApproval] = useState(true);
    const [tags, setTags] = useState('');

    const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

    const activeChores = chores.filter(c => c.status === 'active');
    const canAddChore = isPremium || activeChores.length < 5;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonday = new Date(now);
    currentMonday.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
    const weekStr = currentMonday.toISOString().split('T')[0];

    const isCurrentAssignment = (a: Assignment, chore: Chore) => {
        if (!a.completed) return true;
        
        const compDate = (a.completedAt || a.createdAt || '').split('T')[0];

        if (chore.frequency === 'daily') {
            return compDate === todayStr;
        }
        if (chore.frequency === 'weekly') {
            const lastCompDate = new Date(a.completedAt || a.createdAt || '');
            const lastMon = new Date(lastCompDate);
            lastMon.setDate(lastCompDate.getDate() - (lastCompDate.getDay() === 0 ? 6 : lastCompDate.getDay() - 1));
            const lastMonStr = lastMon.toISOString().split('T')[0];
            return lastMonStr === weekStr;
        }
        if (chore.frequency === 'one-time') {
            return false; // One-time chores become "unhooked" (Inactive) as soon as they are completed
        }
        return false;
    };

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

    const handleArchive = (id: string, title: string) => {
        const isAssigned = assignments.some(a => a.choreId === id);
        if (isAssigned) {
            if (!confirm(`"${title}" is currently assigned to one or more children. Archiving it will remove it from their quest lists. Are you sure?`)) {
                return;
            }
        }
        archiveChore(id);
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Setup Hub Section */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => setIsBulkAssignModalOpen(true)}
                    className="flex flex-col items-center justify-center p-4 rounded-3xl border-2 border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-300 transition-all text-left group"
                >
                    <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform">
                        <Zap className="h-6 w-6 fill-current" />
                    </div>
                    <span className="font-bold text-slate-800">Bulk Assign</span>
                    <span className="text-[10px] text-slate-500 font-medium text-center leading-tight mt-1 opacity-70">Assign routines by #tag to multiple kids</span>
                </button>

                <button
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="flex flex-col items-center justify-center p-4 rounded-3xl border-2 border-amber-100 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-300 transition-all text-left group"
                >
                    <div className="h-12 w-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform">
                        <Sparkles className="h-6 w-6 fill-current" />
                    </div>
                    <span className="font-bold text-slate-800">Add from Template</span>
                    <span className="text-[10px] text-slate-500 font-medium text-center leading-tight mt-1 opacity-70">Add daily prayers & common tasks instantly</span>
                </button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Add New Chore</CardTitle>
                    <CardDescription>Create tasks for your children to complete.</CardDescription>
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
                                    maxLength={40}
                                    disabled={!canAddChore}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Points Reward</label>
                                <Input
                                    type="number"
                                    value={points}
                                    onChange={(e) => setPoints(e.target.value)}
                                    disabled={!canAddChore}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Frequency</label>
                                <select
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                                    value={frequency}
                                    onChange={(e) => setFrequency(e.target.value as Frequency)}
                                    disabled={!canAddChore}
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
                                    disabled={!canAddChore}
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="approval"
                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 disabled:opacity-50"
                                checked={requiresApproval}
                                onChange={(e) => setRequiresApproval(e.target.checked)}
                                disabled={!canAddChore}
                            />
                            <label htmlFor="approval" className="text-sm font-medium">Requires Parent Approval</label>
                        </div>

                        <Button type="submit" className="w-full text-center" disabled={!canAddChore}>
                            <Plus className="mr-2 h-4 w-4 inline-block" /> Add Chore
                        </Button>
                    </form>
                    {!canAddChore && (
                        <p className="text-xs text-amber-600 mt-2 font-medium">
                            Free plan limit reached (5 Chores). Upgrade to Premium to add more.
                        </p>
                    )}
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h3 className="font-bold text-lg">Assignable Chores</h3>
                <div className="grid gap-4">
                    {activeChores.map(chore => {
                        // Check for current assignments (incomplete OR completed in the current period)
                        const currentAssignments = assignments.filter(a => a.choreId === chore.id && isCurrentAssignment(a, chore));
                        const isAssigned = currentAssignments.length > 0;
                        const assignedProfiles = profiles.filter(p => currentAssignments.some(a => a.childId === p.id));

                        return (
                            <Card key={chore.id} className={cn(
                                "overflow-hidden border-2 transition-all",
                                isAssigned ? "border-indigo-100 bg-indigo-50/20" : "border-slate-100 opacity-80 shadow-none"
                            )}>
                                <div className="p-4 space-y-4">
                                    {/* Top Row: Title, Points, and Meta */}
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex gap-3">
                                            <div className={cn(
                                                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors font-bold shadow-sm",
                                                isAssigned ? "bg-indigo-600 text-white shadow-indigo-200" : "bg-slate-100 text-slate-400"
                                            )}>
                                                {chore.points}
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className={cn(
                                                    "font-bold text-lg leading-tight break-words max-w-[180px]",
                                                    isAssigned ? "text-slate-900" : "text-slate-500"
                                                )}>{chore.title}</h4>
                                                <div className="flex items-center gap-2">
                                                    {isAssigned ? (
                                                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider">Activated</span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full uppercase tracking-wider italic">Inactive</span>
                                                    )}
                                                    <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                                                        <Clock className="h-3 w-3" />
                                                        <span className="capitalize">{chore.frequency}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-1 shrink-0">
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                onClick={() => setEditingChore(chore)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleArchive(chore.id, chore.title)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Tags Row */}
                                    {chore.tags && chore.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {chore.tags.map(tag => (
                                                <span key={tag} className="px-2 py-0.5 bg-white text-slate-500 rounded-md text-[10px] font-bold border border-slate-200">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Assignment Section */}
                                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                        <div className="flex items-center gap-2 min-w-0">
                                            {isAssigned ? (
                                                <>
                                                    <div className="flex -space-x-2 shrink-0">
                                                        {assignedProfiles.map(profile => (
                                                            <div key={profile.id} className="h-7 w-7 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm" title={profile.name}>
                                                                <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-500 truncate">
                                                        {assignedProfiles.map(p => p.name).join(', ')}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-[11px] font-medium text-slate-400 italic">No active quests</span>
                                            )}
                                        </div>
                                        
                                        <Button size="sm" variant={isAssigned ? "outline" : "default"} className="h-8 text-xs font-bold px-4 rounded-full" onClick={() => setAssigningChore(chore)}>
                                            Manage
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
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

            <TemplateSelectorModal
                isOpen={isTemplateModalOpen}
                onClose={() => setIsTemplateModalOpen(false)}
            />

            <EditChoreModal
                chore={editingChore}
                isOpen={!!editingChore}
                onClose={() => setEditingChore(null)}
            />
        </div>
    );
}
