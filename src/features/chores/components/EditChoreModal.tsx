import { useState, useEffect } from 'react';
import { useStore } from '../../../store';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { Chore, Frequency } from '../../../types';

interface EditChoreModalProps {
    chore: Chore | null;
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Modal for editing existing chores.
 * 
 * @description
 * Allows parents to modify:
 * - Title
 * - Points
 * - Frequency (daily, weekly, one-time)
 * - Approval status
 */
export function EditChoreModal({ chore, isOpen, onClose }: EditChoreModalProps) {
    const { updateChore } = useStore();
    const [title, setTitle] = useState('');
    const [points, setPoints] = useState('10');
    const [frequency, setFrequency] = useState<Frequency>('daily');
    const [requiresApproval, setRequiresApproval] = useState(true);

    useEffect(() => {
        if (chore) {
            setTitle(chore.title);
            setPoints(chore.points.toString());
            setFrequency(chore.frequency);
            setRequiresApproval(chore.requiresApproval);
        }
    }, [chore]);

    const handleSave = () => {
        if (chore && title.trim()) {
            updateChore(chore.id, {
                title: title.trim(),
                points: parseInt(points) || 0,
                frequency,
                requiresApproval
            });
            onClose();
        }
    };

    if (!chore) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit Quest: ${chore.title}`}>
            <div className="space-y-4 pt-2">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Chore Title</label>
                    <Input
                        placeholder="e.g. Clean Room"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={40}
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Points</label>
                        <Input
                            type="number"
                            value={points}
                            onChange={(e) => setPoints(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Frequency</label>
                        <select
                            className="w-full h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value as Frequency)}
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="one-time">One-time</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center space-x-2 py-2">
                    <input
                        type="checkbox"
                        id="edit-approval"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        checked={requiresApproval}
                        onChange={(e) => setRequiresApproval(e.target.checked)}
                    />
                    <label htmlFor="edit-approval" className="text-sm font-medium text-slate-700 select-none">Requires Parent Approval</label>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
                    <Button className="flex-1" onClick={handleSave} disabled={!title.trim()}>Save Changes</Button>
                </div>
            </div>
        </Modal>
    );
}
