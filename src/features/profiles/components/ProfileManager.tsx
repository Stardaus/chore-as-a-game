import { useState } from 'react';
import { useStore } from '../../../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Trash2, UserPlus, User, Pencil } from 'lucide-react';
import { AvatarSelector } from '../../avatars/components/AvatarSelector';

/**
 * Parent interface for managing child profiles.
 * 
 * @description
 * Allows parents to create new child profiles (with selectable avatars) and delete/edit existing ones.
 * Displays a list of all active profiles with their current level and points.
 * 
 * @usedBy ParentDashboard (Profiles tab)
 */
export function ProfileManager() {
    const { profiles, addProfile, deleteProfile, updateProfile, isPremium } = useStore();
    const [newProfileName, setNewProfileName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('https://api.dicebear.com/7.x/fun-emoji/svg?seed=Buddy');
    
    // Modal states
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

    const canAddProfile = isPremium || profiles.length < 1;

    const handleAddProfile = (e: React.FormEvent) => {
        e.preventDefault();
        if (newProfileName.trim()) {
            addProfile(newProfileName.trim(), selectedAvatar);
            setNewProfileName('');
            // Reset to a random-ish but specific default for the next one
            setSelectedAvatar(`https://api.dicebear.com/7.x/fun-emoji/svg?seed=${Date.now()}`);
        }
    };

    const handleSelectAvatar = (url: string) => {
        if (editingProfileId) {
            updateProfile(editingProfileId, { avatar: url });
            setEditingProfileId(null);
        } else {
            setSelectedAvatar(url);
        }
        setIsSelectorOpen(false);
    };

    const openEditSelector = (id: string) => {
        setEditingProfileId(id);
        setIsSelectorOpen(true);
    };

    return (
        <div className="space-y-6 pb-12">
            <Card>
                <CardHeader>
                    <CardTitle>Add Child Profile</CardTitle>
                    <CardDescription>Create a profile for each child to track their chores and rewards.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddProfile} className="space-y-4">
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => setIsSelectorOpen(true)}
                                className="group relative h-20 w-20 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 hover:border-indigo-500 transition-colors shrink-0"
                            >
                                <img src={selectedAvatar} alt="Selected Avatar" className="h-full w-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Pencil className="h-6 w-6 text-white" />
                                </div>
                            </button>
                            <div className="flex-1 space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Child's Name</label>
                                <Input
                                    placeholder="e.g. Adam"
                                    value={newProfileName}
                                    onChange={(e) => setNewProfileName(e.target.value)}
                                    className="w-full text-lg font-bold h-12"
                                    disabled={!canAddProfile}
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-12 text-md font-bold" disabled={!newProfileName.trim() || !canAddProfile}>
                            <UserPlus className="mr-2 h-5 w-5" />
                            Create Profile
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
                            <div className="relative group">
                                <div className="h-14 w-14 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200">
                                    <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
                                </div>
                                <button 
                                    onClick={() => openEditSelector(profile.id)}
                                    className="absolute -bottom-1 -right-1 bg-white shadow-md border border-slate-200 p-1.5 rounded-full hover:bg-slate-50 text-slate-600 transition-colors"
                                    title="Change Avatar"
                                >
                                    <Pencil className="h-3 w-3" />
                                </button>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-slate-800">{profile.name}</h3>
                                <p className="text-sm font-medium text-slate-500">Level {profile.level} • {profile.points} XP</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    if (confirm(`Delete profile for ${profile.name}? This cannot be undone.`)) {
                                        deleteProfile(profile.id);
                                    }
                                }}
                                className="text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        </div>
                    </Card>
                ))}
                {profiles.length === 0 && (
                    <div className="col-span-full text-center py-16 text-slate-400 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
                        <User className="h-16 w-16 mx-auto mb-4 opacity-10" />
                        <h3 className="font-bold text-xl text-slate-700">No Hero Profiles Yet</h3>
                        <p className="max-w-[200px] mx-auto text-sm">Add your children above to start their quest journey!</p>
                    </div>
                )}
            </div>

            {/* Avatar Selector Modal */}
            <Modal
                isOpen={isSelectorOpen}
                onClose={() => {
                    setIsSelectorOpen(false);
                    setEditingProfileId(null);
                }}
                title="Choose an Avatar"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">Select a character for {editingProfileId ? profiles.find(p => p.id === editingProfileId)?.name : 'your child'}:</p>
                    <AvatarSelector 
                        selectedUrl={editingProfileId ? profiles.find(p => p.id === editingProfileId)?.avatar : selectedAvatar}
                        onSelect={handleSelectAvatar} 
                    />
                </div>
            </Modal>
        </div>
    );
}

