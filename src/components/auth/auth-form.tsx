"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

export function AuthForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'alert' | 'error', text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { emailRedirectTo: window.location.origin }
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Success! Check your email for a confirmation link (or try logging in if you disabled email confirmation).' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error: any) {
      console.error('Auth Error:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 glass p-10 rounded-3xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl pointer-events-none" />
      
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black tracking-tighter">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h1>
        <p className="text-gray-500 font-medium">
          {isSignUp ? 'Join the next generation of AI search.' : 'Elevate your YouTube research with AI.'}
        </p>
      </div>

      <form onSubmit={handleAuth} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-gray-400 px-1">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
            <input 
              type="email" 
              placeholder="name@example.com"
              className="w-full bg-surface border border-border-glass rounded-xl py-4 pl-12 pr-4 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-medium"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-gray-400 px-1">Password</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
            <input 
              type="password" 
              placeholder="••••••••"
              className="w-full bg-surface border border-border-glass rounded-xl py-4 pl-12 pr-4 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-medium"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {message && (
          <div className={cn(
            "p-4 rounded-xl text-sm font-bold border animate-in fade-in slide-in-from-top-2",
            message.type === 'success' ? "bg-green-500/10 border-green-500/20 text-green-500" : 
            message.type === 'alert' ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" :
            "bg-red-500/10 border-red-500/20 text-red-500"
          )}>
            {message.text}
          </div>
        )}

        <button 
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-hover text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2 group"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {isSignUp ? 'Launch My Account' : 'Sign In to Dashboard'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-2">
        <button 
          onClick={() => {
            setIsSignUp(!isSignUp);
            setMessage(null);
          }}
          className="text-sm text-gray-400 font-bold hover:text-primary transition-colors"
        >
          {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up for free'}
        </button>
      </div>
    </div>
  );
}
