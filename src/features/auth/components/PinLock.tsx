import { useState } from 'react';
import { useStore } from '../../../store';
import { useAuthStore } from '../../../store/useAuthStore';
import { SecurityVault } from '../../../services/SecurityVault';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../../components/ui/Card';
import { Lock, ArrowLeft, AlertCircle, LogOut, Calculator, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PinLockProps {
  onUnlock: () => void;
}

type RecoveryMode = 'none' | 'question' | 'math';

export function PinLock({ onUnlock }: PinLockProps) {
  const navigate = useNavigate();
  const { parentPin, recoveryQuestion, recoveryAnswer } = useStore();
  const { signOut } = useAuthStore();

  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recoveryMode, setRecoveryMode] = useState<RecoveryMode>('none');
  const [answer, setAnswer] = useState('');

  // Math Challenge State
  const [mathProblem, setMathProblem] = useState({ question: '', answer: 0 });

  const generateMathProblem = () => {
    const challenge = SecurityVault.generateMathChallenge();
    setMathProblem({ question: challenge.text, answer: challenge.answer });
    setAnswer('');
    setError(null);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (SecurityVault.verifyPin(pin, parentPin)) {
      onUnlock();
    } else {
      setError('Incorrect PIN.');
      setPin('');
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isCorrect =
      recoveryMode === 'question'
        ? SecurityVault.verifySecurityQuestion(answer, recoveryAnswer)
        : SecurityVault.verifyChallengeAnswer(answer, mathProblem.answer);

    if (isCorrect) {
      onUnlock();
    } else {
      setError(recoveryMode === 'question' ? 'Incorrect answer.' : 'Wrong calculation. Try again!');
      if (recoveryMode === 'math') generateMathProblem();
      setAnswer('');
    }
  };

  const handleSignOut = async () => {
    if (
      confirm(
        'Are you sure you want to sign out? You will need to log back in with your email and password to access the Parent Hub.'
      )
    ) {
      await signOut();
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="text-slate-500 font-bold -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Selection
        </Button>

        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-xl mb-4">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Parent Hub</h1>
          <p className="text-slate-500 font-medium italic">Restricted Access</p>
        </div>

        <Card className="border-2 border-indigo-100 shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-indigo-50/50 pb-8 pt-8 px-8 border-b border-indigo-100/50">
            <CardTitle className="text-xl font-bold text-center text-indigo-900">
              {recoveryMode === 'none' && 'Enter PIN'}
              {recoveryMode === 'question' && 'Account Recovery'}
              {recoveryMode === 'math' && 'Parent Verification'}
            </CardTitle>
            <CardDescription className="text-center font-medium text-indigo-600/70 text-sm">
              {recoveryMode === 'none' && 'Please enter your dashboard PIN.'}
              {recoveryMode === 'question' && (recoveryQuestion || 'Security Question')}
              {recoveryMode === 'math' && 'Solve this problem to prove you are a parent.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 mb-6 animate-in fade-in zoom-in duration-300">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium leading-tight">{error}</p>
              </div>
            )}

            {recoveryMode === 'none' ? (
              <form onSubmit={handlePinSubmit} className="space-y-6">
                <Input
                  type="password"
                  placeholder="••••"
                  className="h-16 text-center text-4xl font-black tracking-[0.5em] rounded-2xl border-2 border-indigo-100 focus:border-indigo-400 transition-all"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  autoFocus
                  required
                />
                <Button
                  type="submit"
                  className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold shadow-lg shadow-indigo-200"
                >
                  Unlock
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRecoverySubmit} className="space-y-6">
                {recoveryMode === 'math' && (
                  <div className="text-center mb-2">
                    <span className="text-4xl font-black text-slate-800 tracking-tighter bg-slate-100 px-6 py-3 rounded-2xl border-2 border-slate-200 inline-block">
                      {mathProblem.question} = ?
                    </span>
                  </div>
                )}
                <Input
                  type={recoveryMode === 'math' ? 'number' : 'text'}
                  placeholder={recoveryMode === 'math' ? 'Result' : 'Your Answer'}
                  className="h-14 text-center rounded-2xl border-2 border-indigo-100 focus:border-indigo-400 transition-all text-xl font-bold"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  autoFocus
                  required
                />
                <Button
                  type="submit"
                  className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold shadow-lg shadow-indigo-200"
                >
                  Verify & Unlock
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {recoveryMode === 'none' ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              {recoveryQuestion && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRecoveryMode('question')}
                  className="rounded-xl text-slate-500 border-slate-200 text-xs font-bold"
                >
                  <HelpCircle className="h-3 w-3 mr-1.5" /> Security Q
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  generateMathProblem();
                  setRecoveryMode('math');
                }}
                className="rounded-xl text-slate-500 border-slate-200 text-xs font-bold"
              >
                <Calculator className="h-3 w-3 mr-1.5" /> Math Gate
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <button
              onClick={() => {
                setRecoveryMode('none');
                setError(null);
              }}
              className="text-sm font-bold text-indigo-500 hover:text-indigo-700 transition-colors"
            >
              Back to PIN entry
            </button>
          </div>
        )}

        {/* Sign Out / Escape Hatch */}
        <div className="pt-6 mt-6 border-t border-slate-200">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full text-slate-500 hover:text-red-600 hover:bg-red-50 font-bold"
          >
            <LogOut className="h-4 w-4 mr-2" /> Sign Out / Switch Account
          </Button>
        </div>
      </div>
    </div>
  );
}
