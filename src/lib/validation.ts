/**
 * Logic Validation Engine
 * 
 * @description
 * Provides a second layer of defense for data integrity.
 * Ensures that even if frontend constraints are bypassed,
 * the data conforms to the application's business logic.
 */

export const Validation = {
    /**
     * Constraints for Chores
     */
    chore: (data: { title: string; points: number; tags?: string[] }) => {
        const title = data.title.trim();
        if (!title || title.length > 40) return { valid: false, error: 'Title must be 1-40 characters.' };
        
        if (data.points < 1 || data.points > 10000) return { valid: false, error: 'Points must be between 1 and 10,000.' };
        
        if (data.tags && data.tags.some(t => t.length > 20)) return { valid: false, error: 'Individual tags must be under 20 chars.' };
        
        return { valid: true, data: { ...data, title } };
    },

    /**
     * Constraints for Rewards
     */
    reward: (data: { title: string; cost: number }) => {
        const title = data.title.trim();
        if (!title || title.length > 40) return { valid: false, error: 'Reward title must be 1-40 characters.' };
        
        if (data.cost < 1 || data.cost > 50000) return { valid: false, error: 'Cost must be between 1 and 50,000.' };
        
        return { valid: true, data: { ...data, title } };
    },

    /**
     * Constraints for Profiles
     */
    profile: (data: { name: string }) => {
        const name = data.name.trim();
        if (!name || name.length > 15) return { valid: false, error: 'Name must be 1-15 characters.' };
        
        return { valid: true, data: { ...data, name } };
    }
};
