'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup';
  onModeChange: (mode: 'signin' | 'signup') => void;
}

export default function AuthModal({ isOpen, onClose, mode, onModeChange }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { signUp, signIn } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'signup') {
        // Validate username for signup
        if (!username || username.trim().length < 3) {
          setError('Username must be at least 3 characters long');
          setLoading(false);
          return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          setError('Username can only contain letters, numbers, and underscores');
          setLoading(false);
          return;
        }
        
        const { error } = await signUp(email, password, username);
        if (error) {
          setError(error.message);
        } else {
          // Automatically sign in the user after successful signup
          setSuccess('Account created successfully! Signing you in...');
          const signInResult = await signIn(email, password);
          if (signInResult.error) {
            setError('Account created but sign in failed. Please try signing in manually.');
            setTimeout(() => {
              onModeChange('signin');
              setSuccess('');
            }, 2000);
          } else {
            // Successfully signed in - close modal
            onClose();
            setEmail('');
            setPassword('');
            setUsername('');
          }
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          onClose();
          setEmail('');
          setPassword('');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative glass-card p-8 w-full max-w-md">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl"
        >
          ×
        </button>

        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold cosmic-text mb-2">
            {mode === 'signup' ? 'Take Command of Your Future' : 'Welcome Back'}
          </h2>
          <p className="text-white/80">
            {mode === 'signup' 
              ? 'Join a community of reality navigators who dont believe in taking the hard route, and steer your life towards your desired outcomes.' 
              : 'Sign in to access your saved timelines'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-white font-semibold mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                className="glass-input w-full"
                placeholder="choose_your_username"
                required
                minLength={3}
                maxLength={20}
                pattern="[a-zA-Z0-9_]+"
                title="Username can only contain letters, numbers, and underscores"
              />
            </div>
          )}
          
          <div>
            <label className="block text-white font-semibold mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input w-full"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input w-full"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="glass-card bg-red-500/20 border-red-400/50 p-3">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="glass-card bg-green-500/20 border-green-400/50 p-3">
              <p className="text-green-200 text-sm">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="glass-button w-full text-lg py-3"
          >
            {loading ? 'Loading...' : (mode === 'signup' ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-white/60 text-sm">
            {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
          </p>
          <button
            onClick={() => onModeChange(mode === 'signup' ? 'signin' : 'signup')}
            className="text-white hover:text-yellow-300 font-semibold mt-1 transition-colors"
          >
            {mode === 'signup' ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
