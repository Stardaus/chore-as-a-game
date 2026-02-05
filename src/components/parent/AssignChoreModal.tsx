import { useState } from 'react';
import { useStore } from '../../store';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { Chore } from '../../types';
import { Check } from 'lucide-react';

interface AssignChoreModalProps {
    chore: Chore | null;
    isOpen: boolean;
    onClose: () => void;
}

export function AssignChoreModal({ chore, isOpen, onClose }: AssignChoreModalProps) {
    const { profiles, assignChore } = useStore();
    const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);

    const toggleChild = (id: string) => {
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
                        return (
                            <button
                                key={profile.id}
                                onClick={() => toggleChild(profile.id)}
                                className={`relative flex flex-col items-center p-3 rounded-xl border-2 transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                            >
                                <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden mb-2">
                                    <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
                                </div>
                                <span className="text-sm font-medium">{profile.name}</span>
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
