import { useState, useEffect, memo } from 'react';
import { useStore } from '../../../store';
import { CheckCircle, Clock, CheckCircle2, Lock, Sparkles, Trophy } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { Assignment, Chore } from '../../../types';

interface QuestListProps {
  assignments: Assignment[];
}

/**
 * Optimized Timer Component to prevent parent re-renders every second.
 */
function RefreshTimer({ frequency }: { frequency: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (frequency !== 'daily') return;

    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setHours(24, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [frequency]);

  if (frequency === 'weekly') return <span>Refreshes next week</span>;
  return <span>Refreshes in {timeLeft}</span>;
}

/**
 * Individual Quest Card component moved OUTSIDE to prevent remounting.
 */
const QuestCard = memo(
  ({
    assignment,
    chore,
    isLocked,
    toggleAssignment,
  }: {
    assignment: Assignment;
    chore: Chore;
    isLocked: boolean;
    toggleAssignment: (id: string) => void;
  }) => {
    const isVerified = !!assignment.verifiedAt;
    const isCompleted = assignment.completed;
    const isPendingApproval = isCompleted && chore.requiresApproval && !isVerified;

    let stateStyles = '';
    let iconStyles = '';

    if (isLocked || isVerified) {
      stateStyles = 'bg-green-50/30 border-green-200 shadow-none';
      iconStyles = 'bg-green-500 text-white shadow-sm shadow-green-200';
    } else if (isPendingApproval) {
      stateStyles = 'bg-amber-50 border-amber-200 border-dashed';
      iconStyles = 'bg-amber-500 text-white';
    } else {
      stateStyles = 'bg-white border-slate-100 shadow-sm';
      iconStyles = 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white';
    }

    return (
      <button
        onClick={() => !isLocked && !isVerified && toggleAssignment(assignment.id)}
        disabled={isVerified || isLocked}
        className={cn(
          'group w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left relative overflow-hidden transition-all duration-200',
          !isVerified && !isLocked && 'active:scale-[0.98] hover:border-slate-200',
          stateStyles
        )}
      >
        {(isVerified || isLocked) && (
          <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
            <Sparkles className="h-16 w-16 text-green-600 -mr-4 -mt-4 rotate-12" />
          </div>
        )}

        <div
          className={cn(
            'h-12 w-12 rounded-full flex items-center justify-center transition-colors shrink-0 font-bold',
            iconStyles
          )}
        >
          {isVerified || isLocked ? <Trophy className="h-6 w-6" /> : <span>{chore.points}</span>}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                'font-bold text-lg break-words',
                isVerified || isLocked ? 'text-green-800' : 'text-slate-900'
              )}
            >
              {chore.title}
            </h3>
            {(isVerified || isLocked) && (
              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[9px] font-black uppercase tracking-tighter rounded border border-green-200">
                Accomplished
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-medium mt-0.5">
            {isLocked ? (
              <div className="flex items-center gap-1.5 text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                <Lock className="w-3 h-3" />
                <RefreshTimer frequency={chore.frequency} />
              </div>
            ) : (
              <>
                <span className="flex items-center gap-1 opacity-70">
                  <Clock className="w-3 h-3" />
                  {chore.frequency}
                </span>
                {chore.requiresApproval && (
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded',
                      isPendingApproval
                        ? 'bg-amber-100 text-amber-700 font-bold'
                        : 'text-slate-500 bg-slate-100'
                    )}
                  >
                    {isPendingApproval ? 'Waiting for approval' : 'Approval required'}
                  </span>
                )}
                {isVerified && (
                  <span className="text-green-600 font-bold flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Points Earned!
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <div
          className={cn(
            'h-8 w-8 rounded-full border-2 flex items-center justify-center transition-colors shrink-0',
            isLocked || isVerified
              ? 'border-green-500 bg-green-500 text-white'
              : isPendingApproval
                ? 'border-amber-400 bg-amber-100 text-amber-500'
                : 'border-slate-300 text-transparent group-hover:border-indigo-500'
          )}
        >
          {isLocked || isVerified ? (
            <CheckCircle className="w-5 h-5 fill-current" />
          ) : isPendingApproval ? (
            <Clock className="w-5 h-5" />
          ) : (
            <CheckCircle className="w-5 h-5 fill-current" />
          )}
        </div>
      </button>
    );
  }
);

/**
 * Child's main to-do list (Quest Log).
 */
export function QuestList({ assignments }: QuestListProps) {
  const { chores, toggleAssignment } = useStore();

  const getChore = (choreId: string) => chores.find((c) => c.id === choreId);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonday = new Date(now);
  currentMonday.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
  const weekStr = currentMonday.toISOString().split('T')[0];

  const isQuestFullyDone = (a: Assignment) => {
    if (!a.completed) return false;
    const chore = getChore(a.choreId);
    if (!chore) return false;
    return !chore.requiresApproval || !!a.verifiedAt;
  };

  const incompleteOrPending = assignments.filter((a) => !isQuestFullyDone(a)).reverse();

  const currentPeriodCompletions = assignments.filter((a) => {
    if (!a.completed) return false;
    const chore = getChore(a.choreId);
    if (!chore) return false;

    const compDate = (a.completedAt || a.createdAt || '').split('T')[0];
    if (chore.frequency === 'daily' || chore.frequency === 'one-time') {
      return compDate === todayStr;
    } else if (chore.frequency === 'weekly') {
      const lastCompDate = new Date(a.completedAt || a.createdAt || '');
      const lastMon = new Date(lastCompDate);
      lastMon.setDate(
        lastCompDate.getDate() - (lastCompDate.getDay() === 0 ? 6 : lastCompDate.getDay() - 1)
      );
      const lastMonStr = lastMon.toISOString().split('T')[0];
      return lastMonStr === weekStr;
    }
    return false;
  });

  const activeRecurringLocked = currentPeriodCompletions.filter((a) => {
    const chore = getChore(a.choreId);
    return chore && chore.frequency !== 'one-time' && isQuestFullyDone(a);
  });

  const completedOneTime = currentPeriodCompletions.filter((a) => {
    const chore = getChore(a.choreId);
    return chore && chore.frequency === 'one-time' && isQuestFullyDone(a);
  });

  const activeDisplayList = [...incompleteOrPending, ...activeRecurringLocked];

  if (assignments.length === 0) {
    return (
      <div className="text-center py-12 px-4 space-y-4">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-indigo-200 mb-4">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h3 className="text-xl font-bold text-slate-700">All caught up!</h3>
        <p className="text-slate-500">
          You have no active quests. Ask your parent for some assignments!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900 px-2 text-lg">Active Quests</h3>
        <div className="space-y-3">
          {activeDisplayList.map((a) => {
            const chore = getChore(a.choreId);
            if (!chore) return null;
            return (
              <QuestCard
                key={a.id}
                assignment={a}
                chore={chore}
                isLocked={isQuestFullyDone(a) && chore.frequency !== 'one-time'}
                toggleAssignment={toggleAssignment}
              />
            );
          })}
          {activeDisplayList.length === 0 && (
            <p className="text-center text-slate-400 py-4 italic">No active quests.</p>
          )}
        </div>
      </div>

      {completedOneTime.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 px-2 text-lg">Hall of Fame</h3>
          <div className="space-y-3">
            {completedOneTime.map((a) => {
              const chore = getChore(a.choreId);
              if (!chore) return null;
              return (
                <QuestCard
                  key={a.id}
                  assignment={a}
                  chore={chore}
                  isLocked={false}
                  toggleAssignment={toggleAssignment}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
