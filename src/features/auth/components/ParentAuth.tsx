import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Mail, Lock, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

/**
 * Authentication screen for Parents.
 * 
 * @description
 * Provides a unified toggle for Sign In and Sign Up.
 * Communicates directly with Supabase Auth.
 */
export function ParentAuth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { role: 'parent' }
          }
        });
        if (error) throw error;
        alert('Verification email sent! Please check your inbox.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-xl mb-4 rotate-3 animate-bounce-slow">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Family Hub</h1>
          <p className="text-slate-500 font-medium italic">Secure your family quest data</p>
        </div>

        <Card className="border-2 border-indigo-100 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-indigo-50/50 pb-8 pt-8 px-8 border-b border-indigo-100/50">
            <CardTitle className="text-2xl font-bold text-center text-indigo-900">
              {isSignUp ? 'Create Family Account' : 'Welcome Back, Admin'}
            </CardTitle>
            <CardDescription className="text-center font-medium text-indigo-600/70">
              {isSignUp ? 'Start your multi-device journey' : 'Sign in to manage your family quests'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 font-medium leading-tight">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="Parent Email"
                    className="pl-12 h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-lg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="Secure Password"
                    className="pl-12 h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-lg"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <div className="h-6 w-6 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {isSignUp ? <Sparkles className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                    {isSignUp ? 'Create Family' : 'Enter Dashboard'}
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                {isSignUp 
                  ? 'Already have an account? Sign In' 
                  : 'New family? Create an account'}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 font-medium px-8">
          By continuing, you agree to secure your family quest data on ChoreQuest Cloud.
        </p>
      </div>
    </div>
  );
}
