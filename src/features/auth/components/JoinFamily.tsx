import { useState } from 'react';
import { DeviceService } from '../../../services/DeviceService';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Users, ArrowLeft, Smartphone, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';

interface JoinFamilyProps {
    onJoined: (familyId: string) => void;
    onBack: () => void;
}

/**
 * Screen for secondary devices to join an existing family using a code.
 */
export function JoinFamily({ onJoined, onBack }: JoinFamilyProps) {
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    
    const { refreshLinkStatus } = useAuthStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length !== 6) {
            setError('Please enter a valid 6-digit code.');
            return;
        }
        if (!name.trim()) {
            setError('Please give this device a name.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const familyId = await DeviceService.linkDevice(code, name);
            
            // CRITICAL FIX: Trigger global state refresh immediately after linking
            await refreshLinkStatus();
            
            setSuccess(true);
            setTimeout(() => onJoined(familyId), 1500);
        } catch (err: any) {
            setError(err.message || 'Failed to link device.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in duration-500">
                <div className="h-20 w-20 bg-green-500 text-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-100">
                    <CheckCircle2 className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Device Linked!</h2>
                <p className="text-slate-500 font-medium mt-2">Welcome to the family hub.</p>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-6">
                <Button variant="ghost" onClick={onBack} className="text-slate-500 font-bold -ml-2">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>

                <div className="text-center space-y-2">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500 text-white shadow-xl mb-4 rotate-3">
                        <Users className="h-8 w-8" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Join Family</h1>
                    <p className="text-slate-500 font-medium italic">Enter your family's secret code</p>
                </div>

                <Card className="border-2 border-amber-100 shadow-2xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-amber-50/50 pb-8 pt-8 px-8 border-b border-amber-100/50">
                        <CardTitle className="text-xl font-bold text-center text-amber-900">
                            Enter Join Code
                        </CardTitle>
                        <CardDescription className="text-center font-medium text-amber-700/70 text-sm">
                            Ask your parent for the 6-digit code in their dashboard settings.
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-700 font-medium leading-tight">{error}</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-2 text-center">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Join Code</label>
                                    <Input
                                        placeholder="000000"
                                        className="h-16 text-center text-3xl font-black tracking-[0.5em] rounded-2xl border-2 border-amber-100 bg-amber-50/30 focus:bg-white focus:border-amber-400 transition-all uppercase"
                                        maxLength={6}
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Device Name</label>
                                    <div className="relative">
                                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <Input
                                            placeholder="e.g. iPad Mini, Kids Tab"
                                            className="pl-12 h-12 rounded-xl border-slate-200"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-lg font-bold shadow-lg shadow-amber-100 transition-all disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="h-6 w-6 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                                ) : (
                                    'Link This Device'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
