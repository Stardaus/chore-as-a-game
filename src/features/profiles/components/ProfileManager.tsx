import { useState } from 'react';
import { useStore } from '../../../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Trash2, UserPlus, User, Pencil } from 'lucide-react';
import { AvatarSelector } from '../../avatars/components/AvatarSelector';

export function ProfileManager() {
    const { profiles, addProfile, deleteProfile, updateProfile, isPremium } = useStore();
    const [newProfileName, setNewProfileName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('https://api.dicebear.com/7.x/fun-emoji/svg?seed=Buddy');
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

    const canAddProfile = isPremium || profiles.length < 1;

    const handleAddProfile = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = newProfileName.trim();
        if (trimmedName && canAddProfile) {
            addProfile(trimmedName, selectedAvatar);
            setNewProfileName('');
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
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Child's Name (Max 15)</label>
                                <Input
                                    placeholder="e.g. Adam"
                                    value={newProfileName}
                                    onChange={(e) => setNewProfileName(e.target.value)}
                                    className="w-full text-lg font-bold h-12"
                                    maxLength={15}
                                    required
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
                    <Card key={profile.id} className="overflow-hidden shadow-none border-slate-100">
                        <div className="flex items-center p-4 gap-4">
                            <div className="relative group">
                                <div className="h-14 w-14 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200">
                                    <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
                                </div>
                                <button 
                                    onClick={() => { setEditingProfileId(profile.id); setIsSelectorOpen(true); }}
                                    className="absolute -bottom-1 -right-1 bg-white shadow-md border border-slate-200 p-1.5 rounded-full hover:bg-slate-50 text-slate-600 transition-colors"
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
                                onClick={() => { if (confirm(`Delete profile for ${profile.name}?`)) deleteProfile(profile.id); }}
                                className="text-slate-300 hover:text-red-500 hover:bg-red-50"
                            >
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            <Modal isOpen={isSelectorOpen} onClose={() => { setIsSelectorOpen(false); setEditingProfileId(null); }} title="Choose an Avatar">
                <div className="space-y-4">
                    <AvatarSelector 
                        selectedUrl={editingProfileId ? profiles.find(p => p.id === editingProfileId)?.avatar : selectedAvatar}
                        onSelect={handleSelectAvatar} 
                    />
                </div>
            </Modal>
        </div>
    );
}
