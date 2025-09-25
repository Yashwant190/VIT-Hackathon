import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { User, Mail, Phone, Lock, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface LoginDialogProps {
  isOpen: boolean;
  onLogin: (userData: UserData) => void;
}

export interface UserData {
  id: string;
  username: string;
  email: string;
  phone: string;
  password: string; // Add password to UserData interface
  company?: string;
  role?: string;
  createdAt: string;
}

export function LoginDialog({ isOpen, onLogin }: LoginDialogProps) {
  const { signIn, signUp, resetPassword } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    company: '',
    role: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // Auto-open reset dialog when returning from Supabase recovery link
  React.useEffect(() => {
    try {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (hash.includes('type=recovery') || search.includes('type=recovery') || hash.includes('access_token')) {
        setIsResetOpen(true);
        // Clean URL hash for nicer UX
        if (window.location.hash) {
          history.replaceState(null, document.title, window.location.pathname + window.location.search);
        }
      }
    } catch {}
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Password validation for both login and registration
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (isRegistering) {
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
        newErrors.phone = 'Phone number is invalid';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setAuthError(null);
    try {
      if (isRegistering) {
        await signUp({
          email: formData.email,
          password: formData.password,
          username: formData.username,
          fullName: formData.username,
        });
      } else {
        await signIn({
          email: formData.email,
          password: formData.password,
        });
      }

      // Preserve existing flow by invoking onLogin
      const userData: UserData = {
        id: `user_${Date.now()}`,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        company: formData.company || undefined,
        role: formData.role || 'User',
        createdAt: new Date().toISOString()
      };
      onLogin(userData);
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Welcome to AI Document Analyzer
          </DialogTitle>
          <DialogDescription className="text-center">
            {isRegistering 
              ? 'Create your account to start analyzing documents with AI'
              : 'Sign in to access your document analysis dashboard'
            }
          </DialogDescription>
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <CardHeader className="text-center pb-2">
            <CardTitle className="flex items-center justify-center gap-2">
              {isRegistering ? (
                <>
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  Create Account
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 text-blue-600" />
                  Sign In
                </>
              )}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {authError && (
                <p className="text-sm text-red-500">{authError}</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="Enter your username"
                  className={errors.username ? 'border-red-500' : ''}
                />
                {errors.username && (
                  <p className="text-sm text-red-500">{errors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Password field for both login and registration */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
                <div className="flex items-center justify-between">
                  {!isRegistering && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Example: demo123 (use any password for demo)
                    </p>
                  )}
                  {!isRegistering && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700"
                      onClick={() => {
                        setForgotEmail(formData.email || '');
                        setForgotMessage(null);
                        setIsForgotOpen(true);
                      }}
                    >
                      Forgot password?
                    </Button>
                  )}
                </div>
              </div>

              {isRegistering && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter your phone number"
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500">{errors.phone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company (Optional)</Label>
                    <Input
                      id="company"
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      placeholder="Enter your company"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role (Optional)</Label>
                    <Input
                      id="role"
                      type="text"
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      placeholder="e.g., Manager, Analyst, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Confirm your password"
                      className={errors.confirmPassword ? 'border-red-500' : ''}
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Example: demo123 (minimum 6 characters)
                    </p>
                  </div>
                </>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isRegistering ? 'Creating Account...' : 'Signing In...'}
                  </div>
                ) : (
                  isRegistering ? 'Create Account' : 'Sign In'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setErrors({});
                  setFormData({
                    username: '',
                    email: '',
                    phone: '',
                    password: '',
                    confirmPassword: '',
                    company: '',
                    role: ''
                  });
                }}
              >
                {isRegistering ? (
                  'Already have an account? Sign In'
                ) : (
                  'Don\'t have an account? Create One'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        {/* Forgot Password Dialog */}
        <Dialog open={isForgotOpen} onOpenChange={setIsForgotOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Reset your password</DialogTitle>
              <DialogDescription>
                Enter your account email and we'll send you a password reset link.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {forgotMessage && (
                <p className="text-sm">
                  <span className={forgotMessage.includes('sent') ? 'text-green-600' : 'text-red-600'}>{forgotMessage}</span>
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={() => setIsForgotOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={forgotLoading || !forgotEmail.trim()}
                  onClick={async () => {
                    setForgotLoading(true);
                    setForgotMessage(null);
                    try {
                      await resetPassword(forgotEmail.trim());
                      setForgotMessage('Password reset email sent. Please check your inbox.');
                    } catch (err: any) {
                      setForgotMessage(err?.message || 'Failed to send reset email');
                    } finally {
                      setForgotLoading(false);
                    }
                  }}
                >
                  {forgotLoading ? 'Sending…' : 'Send reset link'}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                After resetting, return to the login screen and sign in with your new password.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}