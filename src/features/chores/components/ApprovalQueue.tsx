import { useStore } from '../../../store';
import { Button } from '../../../components/ui/Button';
import { CheckCircle2, Clock, Check } from 'lucide-react';

/**
 * Parent verification interface.
 * 
 * @description
 * Lists all chores marked as "Completed" by children that require parent approval.
 * Allows parents to approve the work, which finalizes the transaction and awards XP.
 * 
 * @usedBy ParentDashboard (Approvals tab)
 */
export function ApprovalQueue() {
    const { assignments, chores, profiles, approveAssignment } = useStore();

    const pendingAssignments = assignments.filter(a => {
        if (!a.completed || a.verifiedAt) return false;
        const chore = chores.find(c => c.id === a.choreId);
        return chore?.requiresApproval;
    });

    if (pendingAssignments.length === 0) {
        return (
            <div className="text-center py-12 px-4 space-y-4">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-300 mb-4">
                    <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-700">All Clear!</h3>
                <p className="text-slate-500">No chores waiting for approval.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-lg px-1">Pending Approvals ({pendingAssignments.length})</h3>
            <div className="grid gap-3">
                {pendingAssignments.map(assignment => {
                    const chore = chores.find(c => c.id === assignment.choreId);
                    const profile = profiles.find(p => p.id === assignment.childId);

                    if (!chore || !profile) return null;

                    return (
                        <div key={assignment.id} className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-slate-100 shrink-0">
                                <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-bold text-slate-900">{profile.name}</span>
                                    <span className="text-slate-400 text-xs">completed</span>
                                </div>
                                <h4 className="font-bold text-indigo-600 break-words">{chore.title}</h4>
                                <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{new Date(assignment.completedAt!).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                                    +{chore.points} XP
                                </span>
                                <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white gap-1 mt-1"
                                    onClick={() => approveAssignment(assignment.id)}
                                >
                                    <Check className="h-4 w-4" /> Approve
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
