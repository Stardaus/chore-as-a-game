import { useState } from 'react';
import { useStore } from '../../../store';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
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
    const { profiles, assignChore, assignments } = useStore();
    const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonday = new Date(now);
    currentMonday.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
    const weekStr = currentMonday.toISOString().split('T')[0];

    const isAlreadyAssigned = (childId: string) => {
        if (!chore) return false;
        return assignments.some(a => {
            if (a.choreId !== chore.id || a.childId !== childId) return false;
            if (!a.completed) return true;
            
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
        if (isAlreadyAssigned(id)) return;
        setSelectedChildIds(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const handleAssign = () => {
        if (chore) {
            selectedChildIds.forEach(childId => {
                assignChore(chore.id, childId);
            });
            onClose();
            setSelectedChildIds([]);
        }
    };

    if (!chore) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Assign "${chore.title}"`}>
            <div className="space-y-4">
                <p className="text-sm text-slate-500">Who should do this chore?</p>
                <div className="grid grid-cols-2 gap-3">
                    {profiles.map(profile => {
                        const isSelected = selectedChildIds.includes(profile.id);
                        const disabled = isAlreadyAssigned(profile.id);

                        return (
                            <button
                                key={profile.id}
                                onClick={() => toggleChild(profile.id)}
                                disabled={disabled}
                                className={`relative flex flex-col items-center p-3 rounded-xl border-2 transition-all 
                                    ${disabled ? 'opacity-50 grayscale cursor-not-allowed border-slate-100 bg-slate-50' : 
                                      isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                            >
                                <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden mb-2">
                                    <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
                                </div>
                                <span className="text-sm font-medium">{profile.name}</span>
                                {disabled && (
                                    <span className="text-[10px] text-slate-500 font-bold mt-1">Already Done</span>
                                )}
                                {isSelected && (
                                    <div className="absolute top-2 right-2 bg-indigo-500 text-white rounded-full p-0.5">
                                        <Check className="h-3 w-3" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
                <div className="pt-2">
                    <Button className="w-full" disabled={selectedChildIds.length === 0} onClick={handleAssign}>
                        Assign to {selectedChildIds.length} Child{selectedChildIds.length !== 1 ? 'ren' : ''}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
