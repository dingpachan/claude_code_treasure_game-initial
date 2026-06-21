import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { registerUser, loginUser, User } from '../lib/db';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: (user: User) => void;
}

function AuthForm({
  mode,
  onSuccess,
}: {
  mode: 'login' | 'register';
  onSuccess: (user: User) => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('請輸入帳號和密碼');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'register') {
        const user = await registerUser(username.trim(), password);
        onSuccess(user);
      } else {
        const user = await loginUser(username.trim(), password);
        if (!user) {
          setError('帳號或密碼錯誤');
        } else {
          onSuccess(user);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '發生錯誤，請重試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-1">
        <Label htmlFor={`${mode}-username`}>帳號</Label>
        <Input
          id={`${mode}-username`}
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="輸入帳號"
          autoComplete="username"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${mode}-password`}>密碼</Label>
        <Input
          id={`${mode}-password`}
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="輸入密碼"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
        {loading ? '處理中...' : mode === 'login' ? '登入' : '註冊'}
      </Button>
    </form>
  );
}

export default function AuthModal({ open, onOpenChange, onSuccess }: AuthModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-900">帳號登入 / 註冊</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="login">
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1">登入</TabsTrigger>
            <TabsTrigger value="register" className="flex-1">註冊</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <AuthForm mode="login" onSuccess={user => { onOpenChange(false); onSuccess(user); }} />
          </TabsContent>
          <TabsContent value="register">
            <AuthForm mode="register" onSuccess={user => { onOpenChange(false); onSuccess(user); }} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
