import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { get, set, del } from 'idb-keyval';
import type { Profile, Chore, Assignment, Reward, Redemption } from '../types';

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
 * 
 * @description
 * Defines the structure for the Zustand store, including data entities (Profiles, Chores)
 * and actions for modifying the state.
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
    toggleAssignment: (assignmentId: string) => void;
    approveAssignment: (assignmentId: string) => void;

    // Reward Actions
    addReward: (reward: Omit<Reward, 'id' | 'status'>) => void;
    archiveReward: (id: string) => void;
    redeemReward: (rewardId: string, childId: string) => void;

    // Bulk & Seed Actions
    assignChoresByTag: (tag: string, childIds: string[]) => void;
    seedDefaultChores: () => void;
    
    // Premium Actions
    setPremium: (status: boolean) => void;

    // Auth Actions
    setParentPin: (pin: string) => void;
    setRecoveryInfo: (question: string, answer: string) => void;

    // Data Management Actions
    resetPoints: () => void;
    resetAllData: () => void;
}

/**
 * Main Global State Hook (Zustand).
 * 
 * @description
 * Provides centralized state management for the application. Uses `persist` middleware
 * to save state to localStorage/IndexedDB automatically.
 * 
 * Contains logic for:
 * - Profile management (CRUD)
 * - Chore lifecycle (Create, Assign, Verify)
 * - Reward system (Create, Redeem)
 * 
 * @usedBy
 * - All Dashboard pages
 * - Feature components (ChoreBank, RewardShop, etc.)
 */
export const useStore = create<StoreState>()(
    persist(
        (set) => ({
            profiles: [],
            chores: [],
            assignments: [],
            rewards: [],
            redemptions: [],
            isPremium: false,
            parentPin: '0000', // Default PIN
            recoveryQuestion: '',
            recoveryAnswer: '',

            setPremium: (status) => set({ isPremium: status }),

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
                if (!state.isPremium && state.chores.length >= 5) {
                    alert("Free tier is limited to 5 chores. Upgrade to Premium for unlimited chores!");
                    return state;
                }
                return {
                    chores: [...state.chores, { ...chore, id: uuidv4(), status: 'active' }]
                };
            }),

            updateChore: (id, updates) => set((state) => ({
                chores: state.chores.map((c) => c.id === id ? { ...c, ...updates } : c)
            })),

            deleteChore: (id) => set((state) => ({
                chores: state.chores.filter((c) => c.id !== id),
                assignments: state.assignments.filter((a) => a.choreId !== id)
            })),

            archiveChore: (id) => set((state) => ({
                chores: state.chores.map((c) => c.id === id ? { ...c, status: 'archived' } : c)
            })),

            assignChore: (choreId, childId) => set((state) => ({
                assignments: [...state.assignments, {
                    id: uuidv4(),
                    choreId,
                    childId,
                    completed: false
                }]
            })),

            toggleAssignment: (id) => set((state) => {
                const assignment = state.assignments.find((a) => a.id === id);
                if (!assignment) return state;

                const chore = state.chores.find((c) => c.id === assignment.choreId);
                if (!chore) return state;

                if (assignment.verifiedAt) return state; // Cannot toggle if already approved

                const isCompleting = !assignment.completed;
                const now = new Date().toISOString();

                // If completing and no approval required, award points immediately
                if (isCompleting && !chore.requiresApproval) {
                    const childId = assignment.childId;
                    const profiles = state.profiles.map(p => {
                        if (p.id === childId) {
                            const newXp = p.xp + chore.points;
                            const newLevel = Math.floor(newXp / 100) + 1; // Simple linear levelling 100xp per level
                            return {
                                ...p,
                                points: p.points + chore.points,
                                xp: newXp,
                                level: newLevel
                            };
                        }
                        return p;
                    });

                    return {
                        assignments: state.assignments.map(a => a.id === id ? { ...a, completed: true, completedAt: now } : a),
                        profiles
                    };
                } else if (!isCompleting && !chore.requiresApproval) {
                    // Deduct points
                    const childId = assignment.childId;
                    const profiles = state.profiles.map(p => {
                        if (p.id === childId) {
                            const newXp = Math.max(0, p.xp - chore.points);
                            const newLevel = Math.floor(newXp / 100) + 1;
                            return {
                                ...p,
                                points: Math.max(0, p.points - chore.points),
                                xp: newXp,
                                level: newLevel
                            };
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
                if (!assignment || assignment.verifiedAt) return state; // Already verified or not found

                const chore = state.chores.find(c => c.id === assignment.choreId);
                if (!chore) return state;

                return {
                    assignments: state.assignments.map(a => a.id === id ? { ...a, verifiedAt: new Date().toISOString() } : a),
                    profiles: state.profiles.map(p => {
                        if (p.id === assignment.childId) {
                            return {
                                ...p,
                                points: p.points + chore.points,
                                xp: p.xp + chore.points
                            };
                        }
                        return p;
                    })
                };
            }),

            addReward: (reward) => set((state) => {
                if (!state.isPremium && state.rewards.length >= 3) {
                    alert("Free tier is limited to 3 rewards. Upgrade to Premium for unlimited rewards!");
                    return state;
                }
                return {
                    rewards: [...state.rewards, { ...reward, id: uuidv4(), status: 'active' }]
                };
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
                    redemptions: [...state.redemptions, {
                        id: uuidv4(),
                        rewardId,
                        childId,
                        redeemedAt: new Date().toISOString(),
                        approved: false
                    }]
                };
            }),

            assignChoresByTag: (tag, childIds) => set((state) => {
                const choresToAssign = state.chores.filter(c => c.tags?.includes(tag) && c.status === 'active');
                if (choresToAssign.length === 0) return state;

                const newAssignments: Assignment[] = [];

                childIds.forEach(childId => {
                    choresToAssign.forEach(chore => {
                        newAssignments.push({
                            id: uuidv4(),
                            choreId: chore.id,
                            childId,
                            completed: false
                        });
                    });
                });

                return {
                    assignments: [...state.assignments, ...newAssignments]
                };
            }),

            seedDefaultChores: () => set((state) => {
                const prayers = [
                    { title: 'Fajr Prayer', points: 50, frequency: 'daily' as const, requiresApproval: false, icon: 'Moon', tags: ['prayer', 'daily'] },
                    { title: 'Dhuhr Prayer', points: 30, frequency: 'daily' as const, requiresApproval: false, icon: 'Sun', tags: ['prayer', 'daily'] },
                    { title: 'Asr Prayer', points: 30, frequency: 'daily' as const, requiresApproval: false, icon: 'SunDim', tags: ['prayer', 'daily'] },
                    { title: 'Maghrib Prayer', points: 30, frequency: 'daily' as const, requiresApproval: false, icon: 'Sunset', tags: ['prayer', 'daily'] },
                    { title: 'Isha Prayer', points: 40, frequency: 'daily' as const, requiresApproval: false, icon: 'MoonStar', tags: ['prayer', 'daily'] },
                ];

                const activeChoresCount = state.chores.filter(c => c.status === 'active').length;
                const existingTitles = new Set(state.chores.map(c => c.title));

                let newChores = prayers.filter(p => !existingTitles.has(p.title));

                if (!state.isPremium) {
                    const remainingSlots = Math.max(0, 5 - activeChoresCount);
                    if (remainingSlots === 0) {
                        alert("Free tier limit reached. Upgrade to Premium to seed more chores.");
                        return state;
                    }
                    newChores = newChores.slice(0, remainingSlots);
                }

                if (newChores.length === 0) return state;

                const choresWithIds = newChores.map(p => ({
                    id: uuidv4(),
                    ...p,
                    status: 'active' as const
                }));

                return {
                    chores: [...state.chores, ...choresWithIds]
                };
            })
        }),
        {
            name: 'chore-quest-storage',
            storage: createJSONStorage(() => storage),
        }
    )
);
