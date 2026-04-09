import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login, signup } = useGame();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (isSignup) {
      if (!name.trim()) {
        setError('Please enter your name.');
        return;
      }
      if (password.length < 4) {
        setError('Password must be at least 4 characters.');
        return;
      }
      const err = signup(name.trim(), email.trim(), password);
      if (err) setError(err);
    } else {
      const err = login(email.trim(), password);
      if (err) setError(err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        {/* Title outside box */}
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground text-center mb-6">LearnQuest</h1>

        <Card className="shadow-2xl border-0 bg-card/80 backdrop-blur-sm">
          <CardContent className="pt-8 pb-8">
            <h2 className="text-xl font-semibold text-foreground mb-1">
              {isSignup ? 'Start your learning journey!' : 'Welcome back!'}
            </h2>
            <div className="mb-6" />

            {/* Toggle */}
            <div className="flex rounded-lg bg-muted p-1 mb-6">
              <button
                onClick={() => { setIsSignup(false); setError(''); }}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${!isSignup ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Log In
              </button>
              <button
                onClick={() => { setIsSignup(true); setError(''); }}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${isSignup ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-10"
                  autoFocus={!isSignup}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </motion.div>
              )}

              <Button type="submit" className="w-full font-medium" size="lg">
                {isSignup ? 'Create Account' : 'Log In'}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground mt-6">
              {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button onClick={() => { setIsSignup(!isSignup); setError(''); }} className="text-primary hover:underline font-medium">
                {isSignup ? 'Log in' : 'Sign up'}
              </button>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
