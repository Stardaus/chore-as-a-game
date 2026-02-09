import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useStore } from '../../../store';
import { Check, Star, Lock, Trash2, RefreshCcw, AlertTriangle, Key } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { 
        isPremium, setPremium, resetPoints, resetAllData, 
        parentPin, setParentPin, recoveryQuestion, recoveryAnswer, setRecoveryInfo 
    } = useStore();
    
    const [newPin, setNewPin] = useState(parentPin);
    const [question, setQuestion] = useState(recoveryQuestion);
    const [answer, setAnswer] = useState(recoveryAnswer);

    const handleUpgrade = () => {
        // In a real app, this would trigger a payment flow.
        // For this demo, we just toggle the state.
        if (confirm("Confirm upgrade to Premium? (Simulated Payment)")) {
            setPremium(true);
        }
    };

    const handleDowngrade = () => {
        if (confirm("Are you sure you want to cancel Premium?")) {
            setPremium(false);
        }
    };

    const handleSaveAuth = () => {
        if (newPin.length < 4) {
            alert("PIN must be at least 4 digits.");
            return;
        }
        if (question && !answer) {
            alert("Please provide an answer to your recovery question.");
            return;
        }
        setParentPin(newPin);
        setRecoveryInfo(question, answer);
        alert("Authentication settings updated!");
    };

    const handleResetPoints = () => {
        if (confirm("Are you sure you want to reset all points, levels, and history? Profiles and Chores will be kept.")) {
            resetPoints();
            onClose();
        }
    };

    const handleResetAll = () => {
        if (confirm("DANGER: This will delete ALL profiles, chores, and rewards. This cannot be undone. Are you sure?")) {
            resetAllData();
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Settings">
            <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-2 hidden-scrollbar">
                {/* Subscription Status */}
                <div className={`p-4 rounded-xl border-2 ${isPremium ? 'border-indigo-100 bg-indigo-50' : 'border-slate-100 bg-slate-50'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-slate-900">Subscription Status</h4>
                        {isPremium ? (
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full flex items-center gap-1">
                                <Star className="h-3 w-3 fill-indigo-700" /> Premium
                            </span>
                        ) : (
                            <span className="px-2 py-1 bg-slate-200 text-slate-600 text-xs font-bold rounded-full">
                                Free Tier
                            </span>
                        )}
                    </div>

                    {!isPremium ? (
                        <div className="space-y-3">
                            <p className="text-sm text-slate-600">
                                Unlock the full potential of ChoreQuest!
                            </p>
                            <ul className="space-y-2 text-sm text-slate-700">
                                <li className="flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-slate-400" />
                                    <span>Limited to 1 Child Profile</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-slate-400" />
                                    <span>Limited to 5 Chore Types</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-slate-400" />
                                    <span>Limited to 3 Rewards</span>
                                </li>
                            </ul>
                            <Button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleUpgrade}>
                                Upgrade for Unlimited Access
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-slate-600">
                                You have unlimited access to all features.
                            </p>
                            <ul className="space-y-2 text-sm text-indigo-900">
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-indigo-600" />
                                    <span>Unlimited Child Profiles</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-indigo-600" />
                                    <span>Unlimited Chore Creation</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-indigo-600" />
                                    <span>Unlimited Rewards</span>
                                </li>
                            </ul>
                            <Button variant="outline" className="w-full mt-4 text-red-600 border-red-200 hover:bg-red-50" onClick={handleDowngrade}>
                                Cancel Premium (Dev Only)
                            </Button>
                        </div>
                    )}
                </div>

                {/* PIN & Recovery Management */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                        <Key className="h-4 w-4 text-indigo-500" />
                        Parent Security
                    </h4>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Dashboard PIN</label>
                        <Input 
                            type="password" 
                            placeholder="New PIN" 
                            value={newPin} 
                            onChange={(e) => setNewPin(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Recovery Question (Optional)</label>
                        <Input 
                            placeholder="e.g. My first pet's name?" 
                            value={question} 
                            onChange={(e) => setQuestion(e.target.value)}
                        />
                        <Input 
                            placeholder="Your Answer" 
                            value={answer} 
                            onChange={(e) => setAnswer(e.target.value)}
                        />
                        <p className="text-[10px] text-slate-400">Used if you forget your PIN.</p>
                    </div>

                    <Button className="w-full" onClick={handleSaveAuth}>Save Security Settings</Button>
                </div>

                {/* Data Management */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Data Management
                    </h4>
                    <Button variant="outline" className="w-full justify-start text-slate-600" onClick={handleResetPoints}>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Reset Points & Progress
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50" onClick={handleResetAll}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete All Data
                    </Button>
                </div>

                <div className="text-center text-xs text-slate-400">
                    ChoreQuest v1.0.0
                </div>
            </div>
        </Modal>
    );
}
