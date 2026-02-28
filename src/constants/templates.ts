import type { Chore } from '../types';

export interface ChoreTemplate extends Omit<Chore, 'id' | 'status'> {}

export interface TemplateBundle {
    id: string;
    title: string;
    description: string;
    icon: string; // Lucide icon name
    color: string; // Tailwind color class for icon bg
    chores: ChoreTemplate[];
}

export const TEMPLATE_BUNDLES: TemplateBundle[] = [
    {
        id: 'prayer',
        title: 'Daily Prayers',
        description: 'Complete the five daily Salah to earn steady points.',
        icon: 'MoonStar',
        color: 'bg-indigo-500',
        chores: [
            { title: 'Fajr Prayer', points: 50, frequency: 'daily', requiresApproval: true, icon: 'Moon', tags: ['prayer', 'daily'] },
            { title: 'Dhuhr Prayer', points: 30, frequency: 'daily', requiresApproval: true, icon: 'Sun', tags: ['prayer', 'daily'] },
            { title: 'Asr Prayer', points: 30, frequency: 'daily', requiresApproval: true, icon: 'SunDim', tags: ['prayer', 'daily'] },
            { title: 'Maghrib Prayer', points: 30, frequency: 'daily', requiresApproval: true, icon: 'Sunset', tags: ['prayer', 'daily'] },
            { title: 'Isha Prayer', points: 40, frequency: 'daily', requiresApproval: true, icon: 'MoonStar', tags: ['prayer', 'daily'] },
        ]
    },
    {
        id: 'morning',
        title: 'Morning Hero',
        description: 'Start the day right with these essential morning tasks.',
        icon: 'Sun',
        color: 'bg-amber-500',
        chores: [
            { title: 'Brush Teeth', points: 10, frequency: 'daily', requiresApproval: true, icon: 'Sparkles', tags: ['morning', 'hygiene'] },
            { title: 'Make Bed', points: 20, frequency: 'daily', requiresApproval: true, icon: 'Home', tags: ['morning', 'bedroom'] },
            { title: 'Get Dressed', points: 10, frequency: 'daily', requiresApproval: true, icon: 'Shirt', tags: ['morning'] },
        ]
    },
    {
        id: 'kitchen',
        title: 'Kitchen Master',
        description: 'Help keep the kitchen clean and organized.',
        icon: 'Utensils',
        color: 'bg-emerald-500',
        chores: [
            { title: 'Clear the Table', points: 15, frequency: 'daily', requiresApproval: true, icon: 'Trash', tags: ['kitchen'] },
            { title: 'Load Dishwasher', points: 30, frequency: 'daily', requiresApproval: true, icon: 'Zap', tags: ['kitchen'] },
            { title: 'Wipe Counters', points: 15, frequency: 'daily', requiresApproval: true, icon: 'Eraser', tags: ['kitchen'] },
        ]
    },
    {
        id: 'pet',
        title: 'Pet Guardian',
        description: 'Take great care of your furry or feathered friends.',
        icon: 'Dog',
        color: 'bg-orange-500',
        chores: [
            { title: 'Feed Pet', points: 15, frequency: 'daily', requiresApproval: true, icon: 'Bone', tags: ['pets'] },
            { title: 'Refill Water Bowl', points: 10, frequency: 'daily', requiresApproval: true, icon: 'Droplets', tags: ['pets'] },
            { title: 'Play/Short Walk', points: 30, frequency: 'daily', requiresApproval: true, icon: 'Footprints', tags: ['pets'] },
        ]
    }
];
