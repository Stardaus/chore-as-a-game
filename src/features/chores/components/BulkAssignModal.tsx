import { useState } from 'react';
import { useStore } from '../../../store';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Check } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface BulkAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal for tag-based bulk assignment.
 *
 * @description
 * Allows parents to assign ALL chores with a specific tag (e.g., "daily", "prayer")
 * to selected children in one action. Useful for setting up daily routines.
 *
 * @usedBy ChoreBank
 */
export function BulkAssignModal({ isOpen, onClose }: BulkAssignModalProps) {
  const { profiles, chores, assignChoresByTag } = useStore();
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);

  // Extract unique tags
  const allTags = Array.from(new Set(chores.flatMap((c) => c.tags || []))).filter(Boolean);

  const toggleChild = (childId: string) => {
    setSelectedChildren((prev) =>
      prev.includes(childId) ? prev.filter((id) => id !== childId) : [...prev, childId]
    );
  };

  const handleAssign = async () => {
    if (!selectedTag || selectedChildren.length === 0) return;
    const { added, skipped } = await assignChoresByTag(selectedTag, selectedChildren);

    if (added > 0) {
      alert(
        `Successfully assigned ${added} quests!${skipped > 0 ? ` (${skipped} were already assigned)` : ''}`
      );
    } else if (skipped > 0) {
      alert(`All selected quests were already assigned to these children.`);
    } else {
      alert(`No active chores found with the tag #${selectedTag}.`);
    }

    onClose();
    setSelectedTag('');
    setSelectedChildren([]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Assign by Tag">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Select Tag</label>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                  selectedTag === tag
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                )}
              >
                #{tag}
              </button>
            ))}
            {allTags.length === 0 && <p className="text-sm text-slate-400">No tags used yet.</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Assign to Children</label>
          <div className="grid gap-2">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                onClick={() => toggleChild(profile.id)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border-2 transition-all w-full',
                  selectedChildren.includes(profile.id)
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-slate-100 hover:border-indigo-200'
                )}
              >
                <div
                  className={cn(
                    'h-5 w-5 rounded border flex items-center justify-center transition-colors',
                    selectedChildren.includes(profile.id)
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-slate-300 bg-white'
                  )}
                >
                  {selectedChildren.includes(profile.id) && <Check className="h-3 w-3" />}
                </div>
                <span className="font-medium text-slate-900">{profile.name}</span>
              </button>
            ))}
            {profiles.length === 0 && (
              <p className="text-sm text-slate-400">No profiles created yet.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedTag || selectedChildren.length === 0}>
            Assign to Selected
          </Button>
        </div>
      </div>
    </Modal>
  );
}
