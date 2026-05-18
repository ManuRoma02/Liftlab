import React from 'react';
import { Dumbbell, LogIn } from 'lucide-react';
import { motion } from 'motion/react';
import { signInWithGoogle } from '../lib/firebase';

export function Login({ onGuest }: { onGuest: () => void }) {
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="z-10 w-full max-w-sm"
      >
        <div className="flex flex-col items-center text-center mb-12">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center border border-surface-variant overflow-hidden shadow-[0_0_40px_rgba(195,244,0,0.2)] mb-6"
          >
            <Dumbbell className="w-10 h-10 text-primary" strokeWidth={3} />
          </motion.div>
          
          <h1 className="text-[40px] font-black font-[var(--font-headline-lg)] text-primary tracking-tighter uppercase leading-none mb-2">
            LIFTLAB
          </h1>
          <p className="text-on-surface-variant text-base font-medium tracking-tight">
            Forge your legacy. Track your limits.
          </p>
        </div>

        <div className="bg-surface-container border border-surface-variant p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <LoginIcon className="w-24 h-24 rotate-12" />
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-on-background mb-1 uppercase tracking-tight">Welcome Back</h2>
              <p className="text-sm text-on-surface-variant">Sign in to sync your routines and logs across all devices.</p>
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={handleLogin}
                className="w-full bg-surface-container-high hover:bg-surface-variant text-on-surface font-black py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <svg
                  className="w-5 h-5 text-on-surface"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="uppercase tracking-widest text-sm z-10">
                  Google Login
                </span>
              </button>

              <button
                onClick={onGuest}
                className="w-full bg-primary text-[#000000] font-black py-4 rounded-xl flex items-center justify-center gap-3 hover:shadow-[0_0_30px_rgba(195,244,0,0.3)] transition-all active:scale-[0.98] animate-in slide-in-from-bottom-2 duration-500"
              >
                <span className="uppercase tracking-widest text-sm italic">
                  Continue as Guest
                </span>
              </button>
            </div>

            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-[1px] bg-surface-variant"></div>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]">Zero Data Lock-in</span>
              <div className="flex-1 h-[1px] bg-surface-variant"></div>
            </div>

            <p className="text-[10px] text-on-surface-variant text-center leading-relaxed">
              By continuing, you agree to our <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Footer Details */}
      <div className="mt-12 text-center text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.3em] z-10 opacity-40">
        LIFTLAB v1.0.0 • Build 2026.17.05
      </div>
    </div>
  );
}

function LoginIcon({ className }: { className?: string }) {
  return (
    <LogIn className={className} />
  );
}
