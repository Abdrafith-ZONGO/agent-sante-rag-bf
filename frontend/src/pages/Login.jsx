import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          username,
          password
        })
      });

      if (!response.ok) {
        throw new Error('Identifiants incorrects');
      }

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('username', username);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-clinic-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-clinic-100">
        <h1 className="text-3xl font-bold text-clinic-900 text-center mb-6">Bon retour 👋</h1>
        {error && <div className="bg-alertweb-100 text-alertweb-700 p-3 rounded-xl mb-4 text-sm">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-clinic-700 mb-1">Nom d'utilisateur</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-clinic-200 focus:outline-none focus:ring-2 focus:ring-clinic-500"
              style={{ fontSize: '16px' }}
              placeholder="Ex: docteur_ouedraogo"
              autoComplete="username"
              autoCapitalize="none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-clinic-700 mb-1">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-clinic-200 focus:outline-none focus:ring-2 focus:ring-clinic-500"
              style={{ fontSize: '16px' }}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-clinic-600 text-white font-semibold py-3 rounded-xl hover:bg-clinic-700 transition-colors"
          >
            Se connecter
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-clinic-600">
          Pas encore de compte ? <Link to="/register" className="text-clinic-600 font-semibold hover:underline">S'inscrire</Link>
        </p>
      </div>
    </div>
  );
}
