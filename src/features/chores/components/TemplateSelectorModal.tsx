import { useStore } from '../../../store';
import { SubscriptionEntitlementModule } from '../../../services/SubscriptionEntitlementModule';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { TEMPLATE_BUNDLES } from '../../../constants/templates';
import * as Icons from 'lucide-react';
import { cn } from '../../../lib/utils';

interface TemplateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal for selecting and adding chore templates.
 *
 * @description
 * Displays a list of pre-defined "Template Bundles" (e.g., Morning Routine, Prayers).
 * Parents can select a bundle to instantly add all contained chores to their bank.
 *
 * @usedBy ChoreBank
 */
export function TemplateSelectorModal({ isOpen, onClose }: TemplateSelectorModalProps) {
  const { addFromTemplate, chores } = useStore();

  const handleSelectBundle = (bundle: (typeof TEMPLATE_BUNDLES)[0]) => {
    addFromTemplate(bundle.chores);
    onClose();
  };

  const getIcon = (name: string) => {
    const IconComponent = (Icons as any)[name];
    return IconComponent ? (
      <IconComponent className="h-6 w-6" />
    ) : (
      <Icons.HelpCircle className="h-6 w-6" />
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choose a Template Bundle">
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Add a set of common chores to your bank instantly. You can manage or assign them once
          added.
        </p>

        <div className="grid gap-3">
          {TEMPLATE_BUNDLES.map((bundle) => {
            // Count how many from this bundle are already active in the bank
            const existingActiveTitles = new Set(
              chores.filter((c) => c.status === 'active').map((c) => c.title.toLowerCase())
            );
            const newCount = bundle.chores.filter(
              (c) => !existingActiveTitles.has(c.title.toLowerCase())
            ).length;
            const totalCount = bundle.chores.length;

            const entitlement = SubscriptionEntitlementModule.canAdd('chores', newCount);
            const exceedsQuota = newCount > 0 && !entitlement.allowed;

            return (
              <button
                key={bundle.id}
                onClick={() => handleSelectBundle(bundle)}
                disabled={newCount === 0}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all',
                  newCount === 0
                    ? 'opacity-50 grayscale bg-slate-50 border-slate-100 cursor-not-allowed'
                    : exceedsQuota
                      ? 'bg-amber-50/40 border-amber-200/60 hover:border-amber-400'
                      : 'bg-white border-slate-100 hover:border-indigo-500 hover:shadow-md active:scale-[0.98]'
                )}
              >
                <div
                  className={cn(
                    'h-12 w-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm',
                    bundle.color
                  )}
                >
                  {getIcon(bundle.icon)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900">{bundle.title}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {totalCount} Quests
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{bundle.description}</p>

                  {exceedsQuota ? (
                    <p className="text-[10px] text-amber-700 font-bold mt-1 flex items-center gap-1">
                      <Icons.AlertTriangle className="h-3 w-3 text-amber-600" /> Exceeds Free Limit
                      ({entitlement.usage.currentCount + newCount}/{entitlement.usage.maxLimit}{' '}
                      Chores)
                    </p>
                  ) : newCount > 0 && newCount < totalCount ? (
                    <p className="text-[10px] text-indigo-600 font-bold mt-1">
                      {newCount} new chores will be added
                    </p>
                  ) : newCount > 0 ? (
                    <p className="text-[10px] text-indigo-600 font-bold mt-1">
                      {newCount} new chores ready to add
                    </p>
                  ) : (
                    <p className="text-[10px] text-green-600 font-bold mt-1 flex items-center gap-1">
                      <Icons.Check className="h-3 w-3" /> Already in Bank
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="pt-2">
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
