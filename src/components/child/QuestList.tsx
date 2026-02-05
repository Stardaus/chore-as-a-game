import { useStore } from '../../store';
import { CheckCircle, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Assignment } from '../../types';

interface QuestListProps {
    assignments: Assignment[];
}

export function QuestList({ assignments }: QuestListProps) {
    const { chores, toggleAssignment } = useStore();

    const getChore = (choreId: string) => chores.find(c => c.id === choreId);

    // Group by status (active vs completed today)
    // For MVP, just list them.
    const activeAssignments = assignments.filter(a => !a.completed).reverse(); // Newest first
    const completedAssignments = assignments.filter(a => a.completed).reverse(); // Newest first

    if (assignments.length === 0) {
        return (
            <div className="text-center py-12 px-4 space-y-4">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-indigo-200 mb-4">
                    <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-700">All caught up!</h3>
                <p className="text-slate-500">You have no active quests. Ask your parent for some assignments!</p>
            </div>
        );
    }

    const RenderAssignment = ({ assignment }: { assignment: Assignment }) => {
        const chore = getChore(assignment.choreId);
        if (!chore) return null;

        const isVerified = !!assignment.verifiedAt;
        const isCompleted = assignment.completed;
        const isPendingApproval = isCompleted && chore.requiresApproval && !isVerified;

        // Determine status color/state
        let stateStyles = "";
        let iconStyles = "";

        if (isVerified) {
            stateStyles = "bg-green-50/50 border-green-100 opacity-60"; // Faded out but green
            iconStyles = "bg-green-100 text-green-600";
        } else if (isPendingApproval) {
            stateStyles = "bg-amber-50 border-amber-200 border-dashed"; // Pending look
            iconStyles = "bg-amber-100 text-amber-600";
        } else {
            // Active incomplete
            stateStyles = "bg-white border-slate-100 shadow-sm hover:border-indigo-500 hover:shadow-md";
            iconStyles = "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white";
        }

        return (
            <button
                key={assignment.id}
                onClick={() => toggleAssignment(assignment.id)}
                disabled={isVerified}
                className={cn(
                    "group w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all",
                    !isVerified && "active:scale-[0.98]",
                    stateStyles
                )}
            >
                <div className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center transition-colors shrink-0",
                    iconStyles
                )}>
                    <span className="font-bold">{chore.points}</span>
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className={cn("font-bold text-lg truncate", isVerified && "line-through text-slate-400")}>{chore.title}</h3>
                    <div className="flex items-center gap-2 text-xs font-medium opacity-70">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {chore.frequency}
                        </span>
                        {chore.requiresApproval && !isVerified && (
                            <span className={cn(
                                "px-1.5 py-0.5 rounded",
                                isPendingApproval ? "bg-amber-100 text-amber-700 font-bold" : "text-slate-500 bg-slate-100"
                            )}>
                                {isPendingApproval ? "Waiting for approval" : "Approval required"}
                            </span>
                        )}
                        {isVerified && (
                            <span className="text-green-600 font-bold flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" /> Verified
                            </span>
                        )}
                    </div>
                </div>

                <div className={cn(
                    "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                    isVerified
                        ? "border-green-500 bg-green-500 text-white"
                        : isPendingApproval
                            ? "border-amber-400 bg-amber-100 text-amber-500"
                            : "border-slate-300 text-transparent group-hover:border-indigo-500"
                )}>
                    {isVerified ? (
                        <CheckCircle className="w-5 h-5 fill-current" />
                    ) : isPendingApproval ? (
                        <Clock className="w-5 h-5" />
                    ) : (
                        <CheckCircle className="w-5 h-5 fill-current" />
                    )}
                </div>
            </button>
        );
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="space-y-3">
                <h3 className="font-bold text-slate-900 px-2 text-lg">Active Quests</h3>
                <div className="space-y-3">
                    {activeAssignments.map(a => <RenderAssignment key={a.id} assignment={a} />)}
                    {activeAssignments.length === 0 && (
                        <p className="text-center text-slate-400 py-4 italic">No active quests.</p>
                    )}
                </div>
            </div>

            {completedAssignments.length > 0 && (
                <div className="space-y-3 opacity-80">
                    <h3 className="font-bold text-slate-900 px-2 text-lg">Completed</h3>
                    <div className="space-y-3">
                        {completedAssignments.map(a => <RenderAssignment key={a.id} assignment={a} />)}
                    </div>
                </div>
            )}
        </div>
    );
}
