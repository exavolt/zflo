import { useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, signInAnonymously } = useAuth();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    if (!turnstileToken) {
      toast.error('Please complete the security verification');
      return;
    }

    setIsSigningIn(true);
    try {
      await signInAnonymously(turnstileToken);
      toast.success('Successfully authenticated!');
    } catch (error) {
      console.error('Authentication failed:', error);
      toast.error('Authentication failed. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Welcome to ZFlo Editor</CardTitle>
            <CardDescription>
              WARNING: This is an alpha version of the editor. It is not
              production ready and may have bugs. Use at your own risk.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Please complete the security verification to access the flow
              editor
            </p>
            <div className="flex justify-center">
              <Turnstile
                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                onSuccess={setTurnstileToken}
                onError={() => {
                  toast.error('Security verification failed');
                  setTurnstileToken(null);
                }}
                onExpire={() => {
                  toast.warning('Security verification expired');
                  setTurnstileToken(null);
                }}
              />
            </div>
            <Button
              onClick={handleSignIn}
              disabled={!turnstileToken || isSigningIn}
              className="w-full"
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Access Editor'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
