import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { get, set, del } from 'idb-keyval';
import type { Profile, Chore, Assignment, Reward, Redemption } from '../types';
import { NotificationService } from '../services/NotificationService';

// Custom storage object for IndexedDB using idb-keyval
const storage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        return (await get(name)) || null;
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await set(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        await del(name);
    },
};

/**
 * Global application state definition.
 */
interface StoreState {
    profiles: Profile[];
    chores: Chore[];
    assignments: Assignment[];
    rewards: Reward[];
    redemptions: Redemption[];
    isPremium: boolean;
    parentPin: string;
    recoveryQuestion: string;
    recoveryAnswer: string;
    notificationPrefs: {
        enabled: boolean;
        badgeEnabled: boolean;
    };
    reminderSettings: {
        enabled: boolean;
        time: string; // HH:mm
        lastSentDate: string | null; // YYYY-MM-DD
    };

    // Profile Actions
    addProfile: (name: string, avatar: string) => void;
    updateProfile: (id: string, updates: Partial<Profile>) => void;
    deleteProfile: (id: string) => void;

    // Chore Actions
    addChore: (chore: Omit<Chore, 'id' | 'status'>) => void;
    updateChore: (id: string, updates: Partial<Chore>) => void;
    deleteChore: (id: string) => void;
    archiveChore: (id: string) => void;

    // Assignment Actions
    assignChore: (choreId: string, childId: string) => void;
    unassignChore: (choreId: string, childId: string) => void;
    toggleAssignment: (assignmentId: string) => void;
    approveAssignment: (assignmentId: string) => void;
    refreshAssignments: () => void;

    // Reward Actions
    addReward: (reward: Omit<Reward, 'id' | 'status'>) => void;
    archiveReward: (id: string) => void;
    redeemReward: (rewardId: string, childId: string) => void;

    // Bulk & Seed Actions
    assignChoresByTag: (tag: string, childIds: string[]) => { added: number, skipped: number };
    addFromTemplate: (chores: Omit<Chore, 'id' | 'status'>[]) => void;
    
    // Premium Actions
    setPremium: (status: boolean) => void;

    // Notification Actions
    setNotificationPrefs: (prefs: Partial<{ enabled: boolean, badgeEnabled: boolean }>) => void;
    updateReminderSettings: (settings: Partial<{ enabled: boolean, time: string, lastSentDate: string | null }>) => void;

    // Auth Actions
    setParentPin: (pin: string) => void;
    setRecoveryInfo: (question: string, answer: string) => void;

    // Data Management Actions
    resetPoints: () => void;
    resetAllData: () => void;
}

export const useStore = create<StoreState>()(
    persist(
        (set) => ({
            profiles: [],
            chores: [],
            assignments: [],
            rewards: [],
            redemptions: [],
            isPremium: false,
            parentPin: '0000',
            recoveryQuestion: '',
            recoveryAnswer: '',
            notificationPrefs: {
                enabled: false,
                badgeEnabled: true
            },
            reminderSettings: {
                enabled: true,
                time: '21:00',
                lastSentDate: null
            },

            setPremium: (status) => set({ isPremium: status }),

            setNotificationPrefs: (prefs) => set((state) => ({
                notificationPrefs: { ...state.notificationPrefs, ...prefs }
            })),

            updateReminderSettings: (settings) => set((state) => ({
                reminderSettings: { ...state.reminderSettings, ...settings }
            })),

            setParentPin: (pin: string) => set({ parentPin: pin }),

            setRecoveryInfo: (question: string, answer: string) => set({ 
                recoveryQuestion: question, 
                recoveryAnswer: answer.toLowerCase().trim() 
            }),

            resetPoints: () => set((state) => ({
                profiles: state.profiles.map(p => ({ ...p, points: 0, xp: 0, level: 1 })),
                assignments: state.assignments.map(a => ({ ...a, completed: false, completedAt: undefined, verifiedAt: undefined })),
                redemptions: []
            })),

            resetAllData: () => set({
                profiles: [],
                chores: [],
                assignments: [],
                rewards: [],
                redemptions: [],
                isPremium: false
            }),

            addProfile: (name, avatar) => set((state) => {
                if (!state.isPremium && state.profiles.length >= 1) {
                    alert("Free tier is limited to 1 child profile. Upgrade to Premium for unlimited profiles!");
                    return state;
                }
                return {
                    profiles: [...state.profiles, {
                        id: uuidv4(),
                        name,
                        avatar,
                        points: 0,
                        xp: 0,
                        level: 1
                    }]
                };
            }),

            updateProfile: (id, updates) => set((state) => ({
                profiles: state.profiles.map((p) => p.id === id ? { ...p, ...updates } : p)
            })),

            deleteProfile: (id) => set((state) => ({
                profiles: state.profiles.filter((p) => p.id !== id),
                assignments: state.assignments.filter((a) => a.childId !== id),
                redemptions: state.redemptions.filter((r) => r.childId !== id)
            })),

            addChore: (chore) => set((state) => {
                const activeChores = state.chores.filter(c => c.status === 'active');
                if (activeChores.some(c => c.title.toLowerCase() === chore.title.toLowerCase())) {
                    alert(`A chore with the title "${chore.title}" already exists!`);
                    return state;
                }
                if (!state.isPremium && activeChores.length >= 5) {
                    alert("Free tier is limited to 5 active chores. Upgrade to Premium for unlimited chores!");
                    return state;
                }
                return {
                    chores: [...state.chores, { ...chore, id: uuidv4(), status: 'active' }]
                };
            }),

            updateChore: (id, updates) => set((state) => {
                if (updates.title) {
                    const duplicate = state.chores.some(c => 
                        c.id !== id && 
                        c.status === 'active' && 
                        c.title.toLowerCase() === updates.title?.toLowerCase()
                    );
                    if (duplicate) {
                        alert(`Another active chore with the title "${updates.title}" already exists!`);
                        return state;
                    }
                }
                return {
                    chores: state.chores.map((c) => c.id === id ? { ...c, ...updates } : c)
                };
            }),

            deleteChore: (id) => set((state) => ({
                chores: state.chores.filter((c) => c.id !== id),
                assignments: state.assignments.filter((a) => a.choreId !== id)
            })),

            archiveChore: (id) => set((state) => ({
                chores: state.chores.map((c) => c.id === id ? { ...c, status: 'archived' } : c)
            })),

            assignChore: (choreId, childId) => set((state) => {
                const chore = state.chores.find(c => c.id === choreId);
                const profile = state.profiles.find(p => p.id === childId);
                if (!chore) return state;

                const now = new Date();
                const todayStr = now.toISOString().split('T')[0];
                const alreadyAssigned = state.assignments.some(a => {
                    const existingChore = state.chores.find(c => c.id === a.choreId);
                    if (!existingChore || a.childId !== childId) return false;
                    const isSameQuest = a.choreId === choreId || (existingChore.title.toLowerCase() === chore.title.toLowerCase() && !a.completed);
                    if (!isSameQuest) return false;
                    if (!a.completed) return true;
                    const compDate = (a.completedAt || a.createdAt || '').split('T')[0];
                    if (chore.frequency === 'daily') return compDate === todayStr;
                    if (chore.frequency === 'weekly') {
                        const currentMonday = new Date(now);
                        currentMonday.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
                        const weekStr = currentMonday.toISOString().split('T')[0];
                        const lastCompDate = new Date(a.completedAt || a.createdAt || '');
                        const lastMonday = new Date(lastCompDate);
                        lastMonday.setDate(lastCompDate.getDate() - (lastCompDate.getDay() === 0 ? 6 : lastCompDate.getDay() - 1));
                        const lastWeekStr = lastMonday.toISOString().split('T')[0];
                        return lastWeekStr === weekStr;
                    }
                    return false;
                });

                if (alreadyAssigned) return state;

                if (state.notificationPrefs.enabled) {
                    NotificationService.sendNotification("New Quest Assigned!", {
                        body: `${profile?.name || 'Child'} has a new quest: ${chore.title}`,
                        tag: `assign-${choreId}-${childId}`
                    });
                }

                return {
                    assignments: [...state.assignments, {
                        id: uuidv4(),
                        choreId,
                        childId,
                        completed: false,
                        createdAt: now.toISOString()
                    }]
                };
            }),

            unassignChore: (choreId, childId) => set((state) => ({
                assignments: state.assignments.filter(a => 
                    !(a.choreId === choreId && a.childId === childId && !a.completed)
                )
            })),

            toggleAssignment: (id) => set((state) => {
                const assignment = state.assignments.find((a) => a.id === id);
                if (!assignment) return state;
                const chore = state.chores.find((c) => c.id === assignment.choreId);
                const profile = state.profiles.find(p => p.id === assignment.childId);
                if (!chore) return state;
                if (assignment.verifiedAt) return state;

                const isCompleting = !assignment.completed;
                const now = new Date().toISOString();

                if (isCompleting && chore.requiresApproval && state.notificationPrefs.enabled) {
                    NotificationService.sendNotification("Approval Requested", {
                        body: `${profile?.name || 'Child'} finished: ${chore.title}`,
                        tag: `approve-${id}`
                    });
                }

                if (isCompleting && !chore.requiresApproval) {
                    const profiles = state.profiles.map(p => {
                        if (p.id === assignment.childId) {
                            const newXp = p.xp + chore.points;
                            return { ...p, points: p.points + chore.points, xp: newXp, level: Math.floor(newXp / 100) + 1 };
                        }
                        return p;
                    });
                    return {
                        assignments: state.assignments.map(a => a.id === id ? { ...a, completed: true, completedAt: now } : a),
                        profiles
                    };
                } else if (!isCompleting && !chore.requiresApproval) {
                    const profiles = state.profiles.map(p => {
                        if (p.id === assignment.childId) {
                            const newXp = Math.max(0, p.xp - chore.points);
                            return { ...p, points: Math.max(0, p.points - chore.points), xp: newXp, level: Math.floor(newXp / 100) + 1 };
                        }
                        return p;
                    });
                    return {
                        assignments: state.assignments.map(a => a.id === id ? { ...a, completed: false, completedAt: undefined } : a),
                        profiles
                    };
                }

                return {
                    assignments: state.assignments.map(a => a.id === id ? { ...a, completed: isCompleting, completedAt: isCompleting ? now : undefined } : a)
                };
            }),

            approveAssignment: (id) => set((state) => {
                const assignment = state.assignments.find(a => a.id === id);
                if (!assignment || assignment.verifiedAt) return state;
                const chore = state.chores.find(c => c.id === assignment.choreId);
                if (!chore) return state;

                if (state.notificationPrefs.enabled) {
                    NotificationService.sendNotification("Quest Verified!", {
                        body: `Success! ${chore.title} is complete. +${chore.points} XP`,
                        tag: `verified-${id}`
                    });
                }

                return {
                    assignments: state.assignments.map(a => a.id === id ? { ...a, verifiedAt: new Date().toISOString() } : a),
                    profiles: state.profiles.map(p => {
                        if (p.id === assignment.childId) {
                            return { ...p, points: p.points + chore.points, xp: p.xp + chore.points };
                        }
                        return p;
                    })
                };
            }),

            refreshAssignments: () => set((state) => {
                const now = new Date();
                const todayStr = now.toISOString().split('T')[0];
                const currentMonday = new Date(now);
                currentMonday.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
                const weekStr = currentMonday.toISOString().split('T')[0];
                const newAssignments: Assignment[] = [];

                state.profiles.forEach(profile => {
                    state.chores.filter(c => c.status === 'active' && c.frequency !== 'one-time').forEach(chore => {
                        const hasActive = state.assignments.some(a => a.choreId === chore.id && a.childId === profile.id && !a.completed);
                        if (!hasActive) {
                            const lastComp = state.assignments
                                .filter(a => a.choreId === chore.id && a.childId === profile.id && a.completed)
                                .sort((a, b) => (b.completedAt || b.createdAt || '').localeCompare(a.completedAt || a.createdAt || ''))[0];

                            if (lastComp) {
                                const lastDate = (lastComp.completedAt || lastComp.createdAt || '').split('T')[0];
                                let shouldReassign = false;
                                if (chore.frequency === 'daily' && lastDate < todayStr) shouldReassign = true;
                                else if (chore.frequency === 'weekly') {
                                    const lastCompDate = new Date(lastComp.completedAt || lastComp.createdAt || '');
                                    const lastMon = new Date(lastCompDate);
                                    lastMon.setDate(lastCompDate.getDate() - (lastCompDate.getDay() === 0 ? 6 : lastCompDate.getDay() - 1));
                                    if (lastMon.toISOString().split('T')[0] < weekStr) shouldReassign = true;
                                }
                                if (shouldReassign) {
                                    newAssignments.push({ id: uuidv4(), choreId: chore.id, childId: profile.id, completed: false, createdAt: now.toISOString() });
                                }
                            }
                        }
                    });
                });
                if (newAssignments.length === 0) return state;
                return { assignments: [...state.assignments, ...newAssignments] };
            }),

            addReward: (reward) => set((state) => {
                if (!state.isPremium && state.rewards.length >= 3) {
                    alert("Free tier is limited to 3 rewards. Upgrade to Premium for unlimited rewards!");
                    return state;
                }
                return { rewards: [...state.rewards, { ...reward, id: uuidv4(), status: 'active' }] };
            }),

            archiveReward: (id) => set((state) => ({
                rewards: state.rewards.map((r) => r.id === id ? { ...r, status: 'archived' } : r)
            })),

            redeemReward: (rewardId, childId) => set((state) => {
                const reward = state.rewards.find(r => r.id === rewardId);
                const profile = state.profiles.find(p => p.id === childId);
                if (!reward || !profile || profile.points < reward.cost) return state;
                return {
                    profiles: state.profiles.map(p => p.id === childId ? { ...p, points: p.points - reward.cost } : p),
                    redemptions: [...state.redemptions, { id: uuidv4(), rewardId, childId, redeemedAt: new Date().toISOString(), approved: false }]
                };
            }),

            assignChoresByTag: (tag, childIds) => {
                let added = 0; let skipped = 0;
                const newAssignments: Assignment[] = [];
                set((state) => {
                    const choresToAssign = state.chores.filter(c => c.tags?.includes(tag) && c.status === 'active');
                    if (choresToAssign.length === 0) return state;
                    const now = new Date();
                    const todayStr = now.toISOString().split('T')[0];
                    childIds.forEach(childId => {
                        choresToAssign.forEach(chore => {
                            const alreadyAssigned = state.assignments.some(a => {
                                if (a.childId !== childId) return false;
                                const existingChore = state.chores.find(c => c.id === a.choreId);
                                if (!existingChore) return false;
                                const isSameQuest = a.choreId === chore.id || (existingChore.title.toLowerCase() === chore.title.toLowerCase() && !a.completed);
                                if (!isSameQuest) return false;
                                if (!a.completed) return true;
                                const compDate = (a.completedAt || a.createdAt || '').split('T')[0];
                                if (chore.frequency === 'daily') return compDate === todayStr;
                                if (chore.frequency === 'weekly') {
                                    const currentMonday = new Date(now);
                                    currentMonday.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
                                    const lastCompDate = new Date(a.completedAt || a.createdAt || '');
                                    const lastMon = new Date(lastCompDate);
                                    lastMon.setDate(lastCompDate.getDate() - (lastCompDate.getDay() === 0 ? 6 : lastCompDate.getDay() - 1));
                                    return lastMon.toISOString().split('T')[0] === currentMonday.toISOString().split('T')[0];
                                }
                                return false;
                            });
                            if (!alreadyAssigned) {
                                newAssignments.push({ id: uuidv4(), choreId: chore.id, childId, completed: false, createdAt: now.toISOString() });
                                added++;
                            } else skipped++;
                        });
                    });
                    if (newAssignments.length === 0) return state;
                    return { assignments: [...state.assignments, ...newAssignments] };
                });
                return { added, skipped };
            },

            addFromTemplate: (templateChores) => set((state) => {
                const activeChoresCount = state.chores.filter(c => c.status === 'active').length;
                const existingActiveTitles = new Set(state.chores.filter(c => c.status === 'active').map(c => c.title));
                let newChores = templateChores.filter(p => !existingActiveTitles.has(p.title));
                if (newChores.length === 0) { alert("All chores in this template are already in your bank!"); return state; }
                if (!state.isPremium) {
                    const remainingSlots = Math.max(0, 5 - activeChoresCount);
                    if (newChores.length > remainingSlots) {
                        alert(`This template includes ${newChores.length} new chores, but you only have ${remainingSlots} slots remaining in the free tier. Upgrade to Premium for unlimited chores!`);
                        return state;
                    }
                }
                const choresWithIds = newChores.map(p => ({ id: uuidv4(), ...p, status: 'active' as const }));
                return { chores: [...state.chores, ...choresWithIds] };
            })
        }),
        {
            name: 'chore-quest-storage',
            storage: createJSONStorage(() => storage),
        }
    )
);
