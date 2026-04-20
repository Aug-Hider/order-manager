'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('chef@pizzaroma.com');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleReset = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      setMessage('✅ ' + (data.message || 'Mot de passe réinitialisé !'));
    } catch (error) {
      setMessage('❌ Erreur - contactez le chef');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-2">🍕 PizzaOS</h1>
        <h2 className="text-xl font-semibold text-center mb-6">Réinitialiser mot de passe</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="chef@pizzaroma.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nouveau mot de passe</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="demo123"
            />
          </div>

          <Button 
            onClick={handleReset}
            disabled={loading}
            className="w-full"
          >
            {loading ? '⏳ En cours...' : '✅ Réinitialiser'}
          </Button>

          {message && (
            <p className={`text-sm text-center font-medium ${message.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}

          <Link href="/login" className="block text-center text-sm text-orange-600 hover:underline">
            ← Retour au login
          </Link>
        </div>
      </div>
    </div>
  );
}