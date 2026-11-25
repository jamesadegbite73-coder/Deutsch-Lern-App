'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabaseClient';

export default function AuthBar() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
    } else {
      setEmail('');
      setPassword('');
      if (isSignUp) setMessage('Account created!');
    }
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (user) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-lg border p-3 bg-white/80">
        <span className="text-sm">
          Angemeldet als <strong>{user.email}</strong>
        </span>
        <button
          onClick={handleLogout}
          className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
        >
          Abmelden (Logout)
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2 rounded-lg border p-3 bg-white/80">
      <input
        type="email"
        required
        placeholder="E-Mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded border px-3 py-1.5 text-sm"
      />
      <input
        type="password"
        required
        minLength={6}
        placeholder="Passwort (min. 6 Zeichen)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="rounded border px-3 py-1.5 text-sm"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? '...' : isSignUp ? 'Registrieren' : 'Anmelden'}
      </button>
      <button
        type="button"
        onClick={() => {
          setIsSignUp(!isSignUp);
          setMessage('');
        }}
        className="text-xs text-blue-600 underline ml-1"
      >
        {isSignUp ? 'Schon ein Konto? Anmelden' : 'Neues Konto erstellen'}
      </button>
      {message && <p className="w-full text-xs text-red-600 mt-1">{message}</p>}
    </form>
  );
}
