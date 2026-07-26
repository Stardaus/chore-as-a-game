import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../lib/supabase';
import { Validation } from '../../lib/validation';
import { FREE_TIER_LIMITS } from '../../constants';
import type { StoreSet, StoreGet, ChoreSlice } from './types';
import type { Assignment } from '../../types';

export const createChoreSlice = (set: StoreSet, get: StoreGet): ChoreSlice => ({
    chores: [],
    assignments: [],

    addChore: async (chore) => {
        let { familyId, isPremium, chores, safeSync } = get();
        if (!familyId) {
            const idb = await import('idb-keyval');
            familyId = (await idb.get<string>('linked-family-id')) || null;
            if (familyId) set({ familyId });
        }

        const result = Validation.chore(chore);
        if (!result.valid) { alert(result.error); return; }
        
        const active = chores.filter(c => c.status === 'active');
        if (active.some(c => c.title.toLowerCase() === result.data!.title.toLowerCase())) { alert("Chore exists!"); return; }
        if (!isPremium && active.length >= FREE_TIER_LIMITS.CHORES) { alert("Free tier limit!"); return; }

        const newChore = { ...chore, title: result.data!.title, points: result.data!.points, id: uuidv4(), status: 'active' as const };
        set({ chores: [...chores, newChore] });
        if (familyId) {
            await safeSync('chores', 'insert', {
                id: newChore.id, family_id: familyId, title: newChore.title, points: newChore.points,
                frequency: newChore.frequency, requires_approval: newChore.requiresApproval,
                icon: newChore.icon, tags: newChore.tags, status: newChore.status
            });
        }
    },

    updateChore: async (id, updates) => {
        const { familyId, chores, safeSync } = get();
        if (updates.title || updates.points !== undefined) {
            const chore = chores.find(c => c.id === id);
            const result = Validation.chore({ 
                title: updates.title || chore?.title || '', 
                points: updates.points !== undefined ? updates.points : (chore?.points || 0) 
            });
            if (!result.valid) { alert(result.error); return; }
            updates.title = result.data!.title;
            updates.points = result.data!.points;
        }
        set({ chores: chores.map((c) => c.id === id ? { ...c, ...updates } : c) });
        if (familyId) {
            const dbUpdates: any = { ...updates };
            if (updates.requiresApproval !== undefined) { dbUpdates.requires_approval = updates.requiresApproval; delete dbUpdates.requiresApproval; }
            await safeSync('chores', 'update', dbUpdates, { column: 'id', value: id });
        }
    },

    deleteChore: async (id) => {
        const { familyId, chores, assignments, safeSync } = get();
        set({ chores: chores.filter((c) => c.id !== id), assignments: assignments.filter((a) => a.choreId !== id) });
        if (familyId) await safeSync('chores', 'delete', undefined, { column: 'id', value: id });
    },

    archiveChore: async (id) => {
        const { familyId, chores, safeSync } = get();
        set({ chores: chores.map((c) => c.id === id ? { ...c, status: 'archived' } : c) });
        if (familyId) await safeSync('chores', 'update', { status: 'archived' }, { column: 'id', value: id });
    },

    assignChore: async (choreId, childId) => {
        const { familyId, chores, assignments, safeSync } = get();
        const chore = chores.find(c => c.id === choreId);
        if (!chore) return;
        
        const newAssignment = { id: uuidv4(), choreId, childId, completed: false, createdAt: new Date().toISOString() };
        set({ assignments: [...assignments, newAssignment] });

        if (familyId) await safeSync('assignments', 'insert', { id: newAssignment.id, family_id: familyId, profile_id: childId, chore_id: choreId, completed: false, created_at: newAssignment.createdAt });
    },

    unassignChore: async (choreId, childId) => {
        const { familyId, assignments } = get();
        set({ assignments: assignments.filter(a => !(a.choreId === choreId && a.childId === childId && !a.completed)) });
        if (familyId) {
            try {
                const { error } = await supabase.from('assignments').delete().eq('chore_id', choreId).eq('profile_id', childId).eq('completed', false);
                if (error) throw error;
            } catch (e) { console.error('Offline delete unsupported for unassign'); }
        }
    },

    toggleAssignment: async (id) => {
        const { familyId, assignments, chores, safeSync } = get();
        const a = assignments.find(a => a.id === id);
        if (!a || a.verifiedAt) return;
        const c = chores.find(c => c.id === a.choreId);
        if (!c) return;
        const isCompleting = !a.completed;
        const now = new Date().toISOString();

        set({ assignments: assignments.map(x => x.id === id ? { ...x, completed: isCompleting, completedAt: isCompleting ? now : undefined } : x) });
        if (familyId) await safeSync('assignments', 'update', { completed: isCompleting, completed_at: isCompleting ? now : null }, { column: 'id', value: id });
    },

    approveAssignment: async (id) => {
        const { familyId, assignments, chores, profiles, safeSync } = get();
        const a = assignments.find(a => a.id === id);
        if (!a) return;
        const c = chores.find(c => c.id === a.choreId);
        if (!c) return;
        const verifiedAt = new Date().toISOString();
        const nextProfiles = profiles.map(p => p.id === a.childId ? { ...p, points: p.points + c.points, xp: p.xp + c.points, level: Math.floor((p.xp + c.points) / 100) + 1 } : p);

        set({ assignments: assignments.map(x => x.id === id ? { ...x, verifiedAt } : x), profiles: nextProfiles });
        if (familyId) {
            await safeSync('assignments', 'update', { verified_at: verifiedAt }, { column: 'id', value: id });
            const p = nextProfiles.find(p => p.id === a.childId);
            if (p) await safeSync('profiles', 'update', { points: p.points, xp: p.xp, level: p.level }, { column: 'id', value: p.id });
        }
    },

    refreshAssignments: () => {
        const { assignments, chores, profiles, familyId, safeSync } = get();
        const todayStr = new Date().toISOString().split('T')[0];
        const newAssignments: Assignment[] = [];
        profiles.forEach(profile => {
            chores.filter(c => c.status === 'active' && c.frequency !== 'one-time').forEach(chore => {
                const active = assignments.some(a => a.choreId === chore.id && a.childId === profile.id && !a.completed);
                if (!active) {
                    const last = assignments.filter(a => a.choreId === chore.id && a.childId === profile.id && a.completed).sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))[0];
                    if (last && (last.completedAt || '').split('T')[0] < todayStr) {
                        newAssignments.push({ id: uuidv4(), choreId: chore.id, childId: profile.id, completed: false, createdAt: new Date().toISOString() });
                    }
                }
            });
        });
        if (newAssignments.length > 0) {
            set({ assignments: [...assignments, ...newAssignments] });
            if (familyId) {
                safeSync('assignments', 'insert', newAssignments.map(a => ({
                    id: a.id, family_id: familyId, profile_id: a.childId, chore_id: a.choreId,
                    completed: false, created_at: a.createdAt
                }))).then();
            }
        }
    },

    assignChoresByTag: async (tag, childIds) => {
        const { familyId, chores, assignments, safeSync } = get();
        let added = 0;
        const newAssignments: Assignment[] = [];
        const toAssign = chores.filter(c => c.tags?.includes(tag) && c.status === 'active');
        childIds.forEach(childId => {
            toAssign.forEach(chore => {
                if (!assignments.some(a => a.choreId === chore.id && a.childId === childId && !a.completed)) {
                    newAssignments.push({ id: uuidv4(), choreId: chore.id, childId, completed: false, createdAt: new Date().toISOString() });
                    added++;
                }
            });
        });
        if (newAssignments.length > 0) {
            set({ assignments: [...assignments, ...newAssignments] });
            if (familyId) await safeSync('assignments', 'insert', newAssignments.map(a => ({ id: a.id, family_id: familyId, profile_id: a.childId, chore_id: a.choreId, completed: false, created_at: a.createdAt })));
        }
        return { added, skipped: (toAssign.length * childIds.length) - added };
    },

    addFromTemplate: async (templateChores) => {
        const { familyId, chores, safeSync } = get();
        const choresWithIds = templateChores.map(c => ({ ...c, id: uuidv4(), status: 'active' as const }));
        set({ chores: [...chores, ...choresWithIds] });
        if (familyId) await safeSync('chores', 'insert', choresWithIds.map(c => ({
            id: c.id, family_id: familyId, title: c.title, points: c.points, frequency: c.frequency,
            requires_approval: c.requiresApproval, icon: c.icon, tags: c.tags, status: c.status
        })));
    }
});
