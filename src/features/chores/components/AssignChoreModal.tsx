import { useState } from 'react';
import { useStore } from '../../../store';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/utils';
import type { Chore } from '../../../types';
import { Check } from 'lucide-react';

interface AssignChoreModalProps {
    chore: Chore | null;
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Modal for assigning a specific chore to one or more children.
 * 
 * @description
 * Selecting a chore in the ChoreBank opens this modal. It lists all profiles
 * and allows multi-selection for assignment.
 * 
 * @param chore - The chore template being assigned.
 * @usedBy ChoreBank
 */
export function AssignChoreModal({ chore, isOpen, onClose }: AssignChoreModalProps) {
    const { profiles, assignChore, unassignChore, assignments } = useStore();
    // track changes locally: { [childId]: 'assign' | 'unassign' | null }
    const [pendingChanges, setPendingChanges] = useState<Record<string, 'assign' | 'unassign' | null>>({});

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonday = new Date(now);
    currentMonday.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
    const weekStr = currentMonday.toISOString().split('T')[0];

    const getActiveAssignment = (childId: string) => {
        if (!chore) return null;
        return assignments.find(a => 
            a.choreId === chore.id && a.childId === childId && !a.completed
        );
    };

    const isAlreadyCompletedThisPeriod = (childId: string) => {
        if (!chore) return false;
        return assignments.some(a => {
            if (a.choreId !== chore.id || a.childId !== childId || !a.completed) return false;
            
            const compDate = (a.completedAt || a.createdAt || '').split('T')[0];
            if (chore.frequency === 'daily') return compDate === todayStr;
            if (chore.frequency === 'weekly') {
                const lastCompDate = new Date(a.completedAt || a.createdAt || '');
                const lastMonday = new Date(lastCompDate);
                lastMonday.setDate(lastCompDate.getDate() - (lastCompDate.getDay() === 0 ? 6 : lastCompDate.getDay() - 1));
                const lastWeekStr = lastMonday.toISOString().split('T')[0];
                return lastWeekStr === weekStr;
            }
            return false;
        });
    };

    const toggleChild = (id: string) => {
        const activeAssignment = getActiveAssignment(id);
        const isCompleted = isAlreadyCompletedThisPeriod(id);
        
        // If it's a one-time chore and it's already done, don't allow changes
        if (chore?.frequency === 'one-time' && isCompleted) return;

        setPendingChanges(prev => {
            const current = prev[id];
            // If currently assigned (either active OR completed today for recurring)
            if (activeAssignment || isCompleted) {
                // Toggle between null and 'unassign'
                return { ...prev, [id]: current === 'unassign' ? null : 'unassign' };
            } else {
                // If not assigned, toggle between null and 'assign'
                return { ...prev, [id]: current === 'assign' ? null : 'assign' };
            }
        });
    };

    const handleApply = () => {
        if (chore) {
            Object.entries(pendingChanges).forEach(([childId, action]) => {
                if (action === 'assign') {
                    assignChore(chore.id, childId);
                } else if (action === 'unassign') {
                    unassignChore(chore.id, childId);
                }
            });
            onClose();
            setPendingChanges({});
        }
    };

    if (!chore) return null;

    const hasChanges = Object.values(pendingChanges).some(v => v !== null);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Manage "${chore.title}"`}>
            <div className="space-y-4">
                <p className="text-sm text-slate-500">Select children to assign or unassign this quest.</p>
                <div className="grid grid-cols-2 gap-3">
                    {profiles.map(profile => {
                        const activeAssignment = getActiveAssignment(profile.id);
                        const isCompleted = isAlreadyCompletedThisPeriod(profile.id);
                        const change = pendingChanges[profile.id];
                        
                        const isCurrentlyAssigned = !!activeAssignment || isCompleted;
                        const willBeAssigned = (isCurrentlyAssigned && change !== 'unassign') || (!isCurrentlyAssigned && change === 'assign');

                        // One-time chores that are done are disabled
                        const isDisabled = chore.frequency === 'one-time' && isCompleted;

                        return (
                            <button
                                key={profile.id}
                                onClick={() => toggleChild(profile.id)}
                                disabled={isDisabled}
                                className={cn(
                                    "relative flex flex-col items-center p-3 rounded-xl border-2 transition-all",
                                    isDisabled ? "opacity-50 grayscale cursor-not-allowed border-slate-100 bg-slate-50" : 
                                    willBeAssigned ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300"
                                )}
                            >
                                <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden mb-2">
                                    <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
                                </div>
                                <span className="text-sm font-medium">{profile.name}</span>
                                
                                {isDisabled && (
                                    <span className="text-[10px] text-green-600 font-bold mt-1">Quest Finished</span>
                                )}
                                {!isDisabled && isCompleted && !change && (
                                    <span className="text-[10px] text-green-600 font-bold mt-1">Finished Today</span>
                                )}
                                {!isCompleted && isCurrentlyAssigned && !change && (
                                    <span className="text-[10px] text-indigo-600 font-bold mt-1">Active Quest</span>
                                )}
                                {change === 'assign' && (
                                    <span className="text-[10px] text-indigo-600 font-bold mt-1 animate-pulse">+ Assigning</span>
                                )}
                                {change === 'unassign' && (
                                    <span className="text-[10px] text-red-500 font-bold mt-1 animate-pulse">- Removing</span>
                                )}

                                {willBeAssigned && !isDisabled && (
                                    <div className="absolute top-2 right-2 bg-indigo-500 text-white rounded-full p-0.5">
                                        <Check className="h-3 w-3" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
                <div className="pt-2">
                    <Button className="w-full" disabled={!hasChanges} onClick={handleApply}>
                        Update Assignments
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
