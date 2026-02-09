import React, { useState, useEffect } from 'react';
import { useStore } from '../../../store';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ShieldCheck, ArrowLeft, HelpCircle, Calculator, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ParentAuthProps {
    onAuthenticated: () => void;
}

export function ParentAuth({ onAuthenticated }: ParentAuthProps) {
    const { parentPin, recoveryQuestion, recoveryAnswer, setParentPin } = useStore();
    const [pin, setPin] = useState('');
    
    // Recovery States
    const [isRecovering, setIsRecovering] = useState(false);
    const [recoveryMode, setRecoveryMode] = useState<'question' | 'math' | null>(null);
    const [isSettingNewPin, setIsSettingNewPin] = useState(false);
    
    // Inputs
    const [recoveryAns, setRecoveryAns] = useState('');
    const [mathAns, setMathAns] = useState('');
    const [newPin, setNewPin] = useState('');
    
    // Math Challenge Data
    const [mathChallenge, setMathChallenge] = useState({ q: '', a: 0 });
    
    const [error, setError] = useState(false);
    const navigate = useNavigate();

    // Generate a math problem on mount or reset
    useEffect(() => {
        if (recoveryMode === 'math') {
            const n1 = Math.floor(Math.random() * 90) + 10; // 10-99
            const n2 = Math.floor(Math.random() * 90) + 10; // 10-99
            const n3 = Math.floor(Math.random() * 900) + 100; // 100-999
            // Example: 23 * 45 + 123
            setMathChallenge({
                q: `${n1} × ${n2} + ${n3}`,
                a: (n1 * n2) + n3
            });
            setMathAns('');
        }
    }, [recoveryMode]);

    const handleSubmitPin = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin === parentPin) {
            setTimeout(() => onAuthenticated(), 0);
        } else {
            setError(true);
            setPin('');
            setTimeout(() => setError(false), 2000);
        }
    };

    const handleRecoverySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (recoveryAns.toLowerCase().trim() === recoveryAnswer) {
            setIsSettingNewPin(true);
            setIsRecovering(false);
        } else {
            setError(true);
            setRecoveryAns('');
            setTimeout(() => setError(false), 2000);
        }
    };

    const handleMathSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (parseInt(mathAns) === mathChallenge.a) {
            setIsSettingNewPin(true);
            setIsRecovering(false);
        } else {
            setError(true);
            setMathAns('');
            setTimeout(() => setError(false), 2000);
        }
    };

    const handleSetNewPin = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPin.length < 4) {
            alert("PIN must be at least 4 digits.");
            return;
        }
        setParentPin(newPin);
        alert("New PIN saved successfully!");
        setTimeout(() => onAuthenticated(), 0);
    };

    // New PIN Setup View
    if (isSettingNewPin) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 space-y-8 animate-in fade-in zoom-in duration-300">
                    <div className="flex flex-col items-center text-center space-y-2">
                        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                            <Key className="h-8 w-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Set New PIN</h1>
                        <p className="text-slate-500">Recovery successful! Please choose a new PIN for your dashboard.</p>
                    </div>

                    <form onSubmit={handleSetNewPin} className="space-y-6">
                        <div className="space-y-2">
                            <Input
                                type="password"
                                inputMode="numeric"
                                autoFocus
                                placeholder="New 4-digit PIN"
                                value={newPin}
                                onChange={(e) => setNewPin(e.target.value)}
                                className="text-center text-2xl tracking-[1em] h-16"
                            />
                        </div>
                        <Button type="submit" className="w-full h-12 bg-green-600 hover:bg-green-700 text-lg">
                            Save & Open Dashboard
                        </Button>
                    </form>
                </div>
            </div>
        );
    }

    // Main Recovery View Selection
    if (isRecovering) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 space-y-8 animate-in fade-in zoom-in duration-300">
                    <div className="flex flex-col items-center text-center space-y-2">
                        <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-2">
                            {recoveryMode === 'math' ? <Calculator className="h-8 w-8" /> : <HelpCircle className="h-8 w-8" />}
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            {recoveryMode === 'math' ? 'Math Challenge' : 'Recovery'}
                        </h1>
                        <p className="text-slate-500">
                            {recoveryMode === 'math' 
                                ? "Solve this to prove you're a parent." 
                                : "Recover access to your account."}
                        </p>
                    </div>

                    {/* Mode Selection */}
                    {!recoveryMode && (
                        <div className="space-y-4">
                             {recoveryQuestion && (
                                <Button 
                                    variant="outline" 
                                    className="w-full h-14 justify-start px-4 text-left"
                                    onClick={() => setRecoveryMode('question')}
                                >
                                    <div className="flex flex-col items-start">
                                        <span className="font-semibold text-slate-900">Answer Security Question</span>
                                        <span className="text-xs text-slate-500">Use your saved secret answer</span>
                                    </div>
                                </Button>
                             )}
                            
                            <Button 
                                variant="outline" 
                                className="w-full h-14 justify-start px-4 text-left"
                                onClick={() => setRecoveryMode('math')}
                            >
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold text-slate-900">Solve Math Challenge</span>
                                    <span className="text-xs text-slate-500">Prove you are an adult</span>
                                </div>
                            </Button>

                            <Button variant="ghost" className="w-full" onClick={() => setIsRecovering(false)}>
                                Back to PIN
                            </Button>
                        </div>
                    )}

                    {/* Security Question Form */}
                    {recoveryMode === 'question' && (
                        <form onSubmit={handleRecoverySubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 block text-center italic">
                                    "{recoveryQuestion}"
                                </label>
                                <Input
                                    placeholder="Your Answer"
                                    value={recoveryAns}
                                    onChange={(e) => setRecoveryAns(e.target.value)}
                                    className={`text-center ${error ? 'border-red-500 animate-shake' : ''}`}
                                />
                                {error && (
                                    <p className="text-center text-sm text-red-500 font-medium">Incorrect answer.</p>
                                )}
                            </div>
                            <div className="flex flex-col gap-3">
                                <Button type="submit" className="w-full h-12 bg-amber-600 hover:bg-amber-700">
                                    Verify & Unlock
                                </Button>
                                <Button variant="ghost" onClick={() => setRecoveryMode(null)}>
                                    Back
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* Math Challenge Form */}
                    {recoveryMode === 'math' && (
                        <form onSubmit={handleMathSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div className="p-6 bg-slate-100 rounded-xl text-center">
                                    <span className="text-2xl font-mono font-bold tracking-wider text-slate-800">
                                        {mathChallenge.q} = ?
                                    </span>
                                </div>
                                <Input
                                    type="number"
                                    placeholder="Enter Result"
                                    value={mathAns}
                                    onChange={(e) => setMathAns(e.target.value)}
                                    className={`text-center text-lg ${error ? 'border-red-500 animate-shake' : ''}`}
                                />
                                {error && (
                                    <p className="text-center text-sm text-red-500 font-medium">Incorrect. Try again.</p>
                                )}
                            </div>
                            <div className="flex flex-col gap-3">
                                <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700">
                                    Unlock
                                </Button>
                                <Button variant="ghost" onClick={() => setRecoveryMode(null)}>
                                    Back
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 space-y-8 animate-in fade-in zoom-in duration-300">
                <div className="flex flex-col items-center text-center space-y-2">
                    <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-2">
                        <ShieldCheck className="h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Parent Access</h1>
                    <p className="text-slate-500">Please enter your PIN to continue</p>
                </div>

                <form onSubmit={handleSubmitPin} className="space-y-6">
                    <div className="space-y-2">
                        <Input
                            type="password"
                            inputMode="numeric"
                            autoFocus
                            placeholder="Enter PIN"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className={`text-center text-2xl tracking-[1em] h-16 ${error ? 'border-red-500 animate-shake' : ''}`}
                        />
                        {error && (
                            <p className="text-center text-sm text-red-500 font-medium">Incorrect PIN. Try again.</p>
                        )}
                        <p className="text-center text-[10px] text-slate-400 uppercase tracking-widest pt-2">Default PIN: 0000</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-lg">
                            Unlock Dashboard
                        </Button>
                        <div className="flex justify-between items-center px-1">
                            <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate('/')}>
                                <ArrowLeft className="h-4 w-4" /> Exit
                            </Button>
                            <Button variant="ghost" size="sm" className="text-slate-400 font-normal" onClick={() => setIsRecovering(true)}>
                                Forgot PIN?
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}