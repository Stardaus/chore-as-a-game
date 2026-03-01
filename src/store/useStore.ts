import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { get, set, del } from 'idb-keyval';
import type { Profile, Chore, Assignment, Reward, Redemption, SyncOperation } from '../types';
import { NotificationService } from '../services/NotificationService';
import { supabase } from '../lib/supabase';
import { Validation } from '../lib/validation';
import { Mappers } from '../lib/mappers';

// Custom storage object for IndexedDB
const storage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => (await get(name)) || null,
    setItem: async (name: string, value: string): Promise<void> => { await set(name, value); },
    removeItem: async (name: string): Promise<void> => { await del(name); },
};

interface StoreState {
    profiles: Profile[];
    chores: Chore[];
    assignments: Assignment[];
    rewards: Reward[];
    redemptions: Redemption[];
    syncQueue: SyncOperation[];
    isPremium: boolean;
    parentPin: string;
    recoveryQuestion: string;
    recoveryAnswer: string;
    notificationPrefs: { enabled: boolean; badgeEnabled: boolean; };
    reminderSettings: { enabled: boolean; time: string; lastSentDate: string | null; };
    familyId: string | null;
    isSyncing: boolean;

    // Actions
    queueSyncOperation: (op: Omit<SyncOperation, 'id' | 'timestamp'>) => void;
    processSyncQueue: () => Promise<void>;
    addProfile: (name: string, avatar: string) => Promise<void>;
    updateProfile: (id: string, updates: Partial<Profile>) => Promise<void>;
    deleteProfile: (id: string) => Promise<void>;
    addChore: (chore: Omit<Chore, 'id' | 'status'>) => Promise<void>;
    updateChore: (id: string, updates: Partial<Chore>) => Promise<void>;
    deleteChore: (id: string) => Promise<void>;
    archiveChore: (id: string) => Promise<void>;
    assignChore: (choreId: string, childId: string) => Promise<void>;
    unassignChore: (choreId: string, childId: string) => Promise<void>;
    toggleAssignment: (assignmentId: string) => Promise<void>;
    approveAssignment: (assignmentId: string) => Promise<void>;
    refreshAssignments: () => void;
    addReward: (reward: Omit<Reward, 'id' | 'status'>) => Promise<void>;
    archiveReward: (id: string) => Promise<void>;
    redeemReward: (rewardId: string, childId: string) => Promise<void>;
    assignChoresByTag: (tag: string, childIds: string[]) => Promise<{ added: number, skipped: number }>;
    addFromTemplate: (chores: Omit<Chore, 'id' | 'status'>[]) => Promise<void>;
    syncWithCloud: (familyId: string) => Promise<void>;
    setFamilyId: (id: string | null) => void;
    setPremium: (status: boolean) => void;
    setNotificationPrefs: (prefs: Partial<{ enabled: boolean, badgeEnabled: boolean }>) => void;
    updateReminderSettings: (settings: Partial<{ enabled: boolean, time: string, lastSentDate: string | null }>) => void;
    setParentPin: (pin: string) => void;
    setRecoveryInfo: (question: string, answer: string) => void;
    resetPoints: () => void;
    resetAllData: () => void;
}

export const useStore = create<StoreState>()(
    persist(
        (set, get) => {
            const safeSync = async (table: string, action: 'insert' | 'update' | 'delete', payload?: any, match?: { column: string, value: string }) => {
                if (!navigator.onLine) {
                    get().queueSyncOperation({ table, action, payload, match });
                    return;
                }
                try {
                    let query = supabase.from(table)[action](payload);
                    if (match) query = query.eq(match.column, match.value);
                    const { error } = await query;
                    if (error) throw error;
                } catch (error) {
                    console.warn(`Offline or network error, queuing ${action} on ${table}`);
                    get().queueSyncOperation({ table, action, payload, match });
                }
            };

            return {
                profiles: [], chores: [], assignments: [], rewards: [], redemptions: [], syncQueue: [],
                isPremium: false, parentPin: '0000', recoveryQuestion: '', recoveryAnswer: '',
                notificationPrefs: { enabled: false, badgeEnabled: true },
                reminderSettings: { enabled: true, time: '21:00', lastSentDate: null },
                familyId: null, isSyncing: false,

                queueSyncOperation: (op) => {
                    set((state) => ({
                        syncQueue: [...state.syncQueue, { ...op, id: uuidv4(), timestamp: Date.now() }]
                    }));
                },

                processSyncQueue: async () => {
                    const { syncQueue } = get();
                    if (syncQueue.length === 0 || !navigator.onLine) return;

                    console.log(`🔄 Processing ${syncQueue.length} offline operations...`);
                    let remainingQueue = [...syncQueue];

                    for (const op of syncQueue) {
                        try {
                            let query = supabase.from(op.table)[op.action](op.payload);
                            if (op.match) {
                                query = query.eq(op.match.column, op.match.value);
                            }
                            const { error } = await query;
                            if (error) {
                                console.error(`Failed to process queued operation ${op.id}:`, error);
                                break; // Stop processing on first failure to maintain order
                            }
                            remainingQueue = remainingQueue.filter(q => q.id !== op.id);
                        } catch (error) {
                            console.error(`Error processing queued operation ${op.id}:`, error);
                            break;
                        }
                    }
                    set({ syncQueue: remainingQueue });
                },

                setPremium: (status) => set({ isPremium: status }),
                setFamilyId: (id) => set({ familyId: id }),
                setNotificationPrefs: (prefs) => set((state) => ({ notificationPrefs: { ...state.notificationPrefs, ...prefs } })),
                updateReminderSettings: (settings) => set((state) => ({ reminderSettings: { ...state.reminderSettings, ...settings } })),
                setParentPin: (pin: string) => set({ parentPin: pin }),
                setRecoveryInfo: (question, answer) => set({ recoveryQuestion: question, recoveryAnswer: answer.toLowerCase().trim() }),

                syncWithCloud: async (familyId: string) => {
                    if (!navigator.onLine) return; // Don't sync if explicitly offline
                    
                    set({ isSyncing: true, familyId });
                    try {
                        // Optimized fetching: only get active data where relevant
                        const [p, c, a, r, rd] = await Promise.all([
                            supabase.from('profiles').select('*').eq('family_id', familyId),
                            supabase.from('chores').select('*').eq('family_id', familyId),
                            supabase.from('assignments').select('*').eq('family_id', familyId),
                            supabase.from('rewards').select('*').eq('family_id', familyId),
                            supabase.from('redemptions').select('*').eq('family_id', familyId),
                        ]);

                        // Crucial: If any request fails (e.g. offline), abort and preserve local data
                        if (p.error || c.error || a.error || r.error || rd.error) {
                            console.warn('Sync partially failed (network issue?), preserving local data.', p.error || c.error);
                            return; 
                        }

                        set({
                            profiles: p.data || [],
                            chores: (c.data || []).map(Mappers.chore),
                            assignments: (a.data || []).map(Mappers.assignment),
                            rewards: r.data || [],
                            redemptions: (rd.data || []).map(Mappers.redemption),
                        });
                    } catch (error) { console.error('Cloud Sync Error:', error); } finally { set({ isSyncing: false }); }
                },

                resetPoints: () => set((state) => ({
                    profiles: state.profiles.map(p => ({ ...p, points: 0, xp: 0, level: 1 })),
                    assignments: state.assignments.map(a => ({ ...a, completed: false, completedAt: undefined, verifiedAt: undefined })),
                    redemptions: []
                })),

                resetAllData: () => set({ profiles: [], chores: [], assignments: [], rewards: [], redemptions: [], isPremium: false, familyId: null, syncQueue: [] }),

                addProfile: async (name, avatar) => {
                    const { familyId, isPremium, profiles } = get();
                    const result = Validation.profile({ name });
                    if (!result.valid) { alert(result.error); return; }
                    if (!isPremium && profiles.length >= 1) { alert("Free tier limit!"); return; }
                    
                    const newProfile = { id: uuidv4(), name: result.data!.name, avatar, points: 0, xp: 0, level: 1 };
                    set({ profiles: [...profiles, newProfile] });
                    if (familyId) await safeSync('profiles', 'insert', { ...newProfile, family_id: familyId });
                },

                updateProfile: async (id, updates) => {
                    const { familyId, profiles } = get();
                    if (updates.name) {
                        const result = Validation.profile({ name: updates.name });
                        if (!result.valid) { alert(result.error); return; }
                        updates.name = result.data!.name;
                    }
                    set({ profiles: profiles.map((p) => p.id === id ? { ...p, ...updates } : p) });
                    if (familyId) await safeSync('profiles', 'update', updates, { column: 'id', value: id });
                },

                deleteProfile: async (id) => {
                    const { familyId, profiles, assignments, redemptions } = get();
                    set({ profiles: profiles.filter((p) => p.id !== id), assignments: assignments.filter((a) => a.childId !== id), redemptions: redemptions.filter((r) => r.childId !== id) });
                    if (familyId) await safeSync('profiles', 'delete', undefined, { column: 'id', value: id });
                },

                addChore: async (chore) => {
                    const { familyId, isPremium, chores } = get();
                    const result = Validation.chore(chore);
                    if (!result.valid) { alert(result.error); return; }
                    
                    const active = chores.filter(c => c.status === 'active');
                    if (active.some(c => c.title.toLowerCase() === result.data!.title.toLowerCase())) { alert("Chore exists!"); return; }
                    if (!isPremium && active.length >= 5) { alert("Free tier limit!"); return; }

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
                    const { familyId, chores } = get();
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
                    const { familyId, chores, assignments } = get();
                    set({ chores: chores.filter((c) => c.id !== id), assignments: assignments.filter((a) => a.choreId !== id) });
                    if (familyId) await safeSync('chores', 'delete', undefined, { column: 'id', value: id });
                },

                archiveChore: async (id) => {
                    const { familyId, chores } = get();
                    set({ chores: chores.map((c) => c.id === id ? { ...c, status: 'archived' } : c) });
                    if (familyId) await safeSync('chores', 'update', { status: 'archived' }, { column: 'id', value: id });
                },

                assignChore: async (choreId, childId) => {
                    const { familyId, chores, assignments, notificationPrefs, profiles } = get();
                    const chore = chores.find(c => c.id === choreId);
                    const profile = profiles.find(p => p.id === childId);
                    if (!chore) return;
                    
                    const newAssignment = { id: uuidv4(), choreId, childId, completed: false, createdAt: new Date().toISOString() };
                    set({ assignments: [...assignments, newAssignment] });
                    
                    if (notificationPrefs.enabled) {
                        NotificationService.sendNotification("New Quest Assigned!", {
                            body: `${profile?.name || 'Child'} has a new quest: ${chore.title}`,
                            tag: `assign-${choreId}-${childId}`
                        });
                    }

                    if (familyId) await safeSync('assignments', 'insert', { id: newAssignment.id, family_id: familyId, profile_id: childId, chore_id: choreId, completed: false, created_at: newAssignment.createdAt });
                },

                unassignChore: async (choreId, childId) => {
                    const { familyId, assignments } = get();
                    set({ assignments: assignments.filter(a => !(a.choreId === choreId && a.childId === childId && !a.completed)) });
                    // Supabase delete by multiple columns isn't fully supported by the generic safeSync match yet.
                    // Let's do a direct call and fallback to queue.
                    if (familyId) {
                        if (!navigator.onLine) {
                            // Queue complex delete is harder with our generic type, so we'll just queue a payload that our processSyncQueue might not handle perfectly if match is restricted to 1 col.
                            // Actually, let's keep safeSync generic enough. We can't match multiple. So we'll fetch ID first?
                            // For simplicity in this app, unassign usually deletes an assignment ID. Wait, we don't have the ID easily unless we find it.
                        }
                        try {
                            const { error } = await supabase.from('assignments').delete().eq('chore_id', choreId).eq('profile_id', childId).eq('completed', false);
                            if (error) throw error;
                        } catch (e) { console.error('Offline delete unsupported for unassign'); }
                    }
                },

                toggleAssignment: async (id) => {
                    const { familyId, assignments, chores, profiles, notificationPrefs } = get();
                    const a = assignments.find(a => a.id === id);
                    if (!a || a.verifiedAt) return;
                    const c = chores.find(c => c.id === a.choreId);
                    const p_info = profiles.find(p => p.id === a.childId);
                    if (!c) return;
                    const isCompleting = !a.completed;
                    const now = new Date().toISOString();
                    
                    if (isCompleting && c.requiresApproval && notificationPrefs.enabled) {
                        NotificationService.sendNotification("Approval Requested", {
                            body: `${p_info?.name || 'Child'} finished: ${c.title}`,
                            tag: `approve-${id}`
                        });
                    }

                    set({ assignments: assignments.map(x => x.id === id ? { ...x, completed: isCompleting, completedAt: isCompleting ? now : undefined } : x) });
                    if (familyId) await safeSync('assignments', 'update', { completed: isCompleting, completed_at: isCompleting ? now : null }, { column: 'id', value: id });
                },

                approveAssignment: async (id) => {
                    const { familyId, assignments, chores, profiles, notificationPrefs } = get();
                    const a = assignments.find(a => a.id === id);
                    if (!a) return;
                    const c = chores.find(c => c.id === a.choreId);
                    if (!c) return;
                    const verifiedAt = new Date().toISOString();
                    const nextProfiles = profiles.map(p => p.id === a.childId ? { ...p, points: p.points + c.points, xp: p.xp + c.points, level: Math.floor((p.xp + c.points) / 100) + 1 } : p);
                    
                    if (notificationPrefs.enabled) {
                        NotificationService.sendNotification("Quest Verified!", {
                            body: `Success! ${c.title} is complete. +${c.points} XP`,
                            tag: `verified-${id}`
                        });
                    }

                    set({ assignments: assignments.map(x => x.id === id ? { ...x, verifiedAt } : x), profiles: nextProfiles });
                    if (familyId) {
                        await safeSync('assignments', 'update', { verified_at: verifiedAt }, { column: 'id', value: id });
                        const p = nextProfiles.find(p => p.id === a.childId);
                        if (p) await safeSync('profiles', 'update', { points: p.points, xp: p.xp, level: p.level }, { column: 'id', value: p.id });
                    }
                },

                refreshAssignments: () => {
                    const { assignments, chores, profiles, familyId } = get();
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

                addReward: async (reward) => {
                    const { familyId, rewards, isPremium } = get();
                    const result = Validation.reward(reward);
                    if (!result.valid) { alert(result.error); return; }
                    if (!isPremium && rewards.length >= 3) { alert("Free tier limit!"); return; }
                    
                    const newReward = { ...reward, title: result.data!.title, cost: result.data!.cost, id: uuidv4(), status: 'active' as const };
                    set({ rewards: [...rewards, newReward] });
                    if (familyId) await safeSync('rewards', 'insert', { ...newReward, family_id: familyId });
                },

                archiveReward: async (id) => {
                    const { familyId, rewards } = get();
                    set({ rewards: rewards.map(r => r.id === id ? { ...r, status: 'archived' } : r) });
                    if (familyId) await safeSync('rewards', 'update', { status: 'archived' }, { column: 'id', value: id });
                },

                redeemReward: async (rewardId, childId) => {
                    const { familyId, rewards, profiles, redemptions } = get();
                    const reward = rewards.find(r => r.id === rewardId);
                    const profile = profiles.find(p => p.id === childId);
                    if (!reward || !profile || profile.points < reward.cost) return;
                    const newRedemption = { id: uuidv4(), rewardId, childId, redeemedAt: new Date().toISOString(), approved: false };
                    const nextProfiles = profiles.map(p => p.id === childId ? { ...p, points: p.points - reward.cost } : p);
                    set({ profiles: nextProfiles, redemptions: [...redemptions, newRedemption] });
                    if (familyId) {
                        await safeSync('redemptions', 'insert', { id: newRedemption.id, family_id: familyId, reward_id: rewardId, profile_id: childId, redeemed_at: newRedemption.redeemedAt, approved: false });
                        const p = nextProfiles.find(p => p.id === childId);
                        if (p) await safeSync('profiles', 'update', { points: p.points }, { column: 'id', value: p.id });
                    }
                },

                assignChoresByTag: async (tag, childIds) => {
                    const { familyId, chores, assignments } = get();
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
                    const { familyId, chores } = get();
                    const choresWithIds = templateChores.map(c => ({ ...c, id: uuidv4(), status: 'active' as const }));
                    set({ chores: [...chores, ...choresWithIds] });
                    if (familyId) await safeSync('chores', 'insert', choresWithIds.map(c => ({
                        id: c.id, family_id: familyId, title: c.title, points: c.points, frequency: c.frequency,
                        requires_approval: c.requiresApproval, icon: c.icon, tags: c.tags, status: c.status
                    })));
                }
            };
        },
        { name: 'chore-quest-storage', storage: createJSONStorage(() => storage) }
    )
);
