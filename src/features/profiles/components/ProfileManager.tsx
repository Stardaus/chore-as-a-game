import { useState } from 'react';
import { useStore } from '../../../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Trash2, UserPlus, User } from 'lucide-react';

/**
 * Parent interface for managing child profiles.
 * 
 * @description
 * Allows parents to create new child profiles (with auto-generated avatars) and delete existing ones.
 * Displays a list of all active profiles with their current level and points.
 * 
 * @usedBy ParentDashboard (Profiles tab)
 */
export function ProfileManager() {
    const { profiles, addProfile, deleteProfile, isPremium } = useStore();
    const [newProfileName, setNewProfileName] = useState('');

    const canAddProfile = isPremium || profiles.length < 1;

    const handleAddProfile = (e: React.FormEvent) => {
        e.preventDefault();
        if (newProfileName.trim()) {
            // For MVP, using a default avatar or random color could be nice, currently just a string placeholder
            addProfile(newProfileName.trim(), `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${newProfileName}`);
            setNewProfileName('');
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Add Child Profile</CardTitle>
                    <CardDescription>Create a profile for each child to track their chores and rewards.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddProfile} className="flex gap-4">
                        <Input
                            placeholder="Child's Name"
                            value={newProfileName}
                            onChange={(e) => setNewProfileName(e.target.value)}
                            className="flex-1"
                            disabled={!canAddProfile}
                        />
                        <Button type="submit" disabled={!newProfileName.trim() || !canAddProfile}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add
                        </Button>
                    </form>
                    {!canAddProfile && (
                        <p className="text-xs text-amber-600 mt-2 font-medium">
                            Free plan limit reached (1 Profile). Upgrade to Premium to add more.
                        </p>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                {profiles.map((profile) => (
                    <Card key={profile.id} className="overflow-hidden">
                        <div className="flex items-center p-4 gap-4">
                            <div className="h-12 w-12 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200">
                                <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg">{profile.name}</h3>
                                <p className="text-sm text-slate-500">Level {profile.level} • {profile.points} Points</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteProfile(profile.id)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </Card>
                ))}
                {profiles.length === 0 && (
                    <div className="col-span-full text-center py-10 text-slate-400">
                        <User className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>No profiles yet. Add one above!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
