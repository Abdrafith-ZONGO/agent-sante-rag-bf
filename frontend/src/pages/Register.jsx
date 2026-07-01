import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur lors de l\'inscription');
      }

      // Inscription réussie, rediriger vers login
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-clinic-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-clinic-100">
        <h1 className="text-3xl font-bold text-clinic-900 text-center mb-6">Créer un compte ✨</h1>
        {error && <div className="bg-alertweb-100 text-alertweb-700 p-3 rounded-xl mb-4 text-sm">{error}</div>}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-clinic-700 mb-1">Nom d'utilisateur</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-clinic-200 focus:outline-none focus:ring-2 focus:ring-clinic-500"
              placeholder="Ex: docteur_ouedraogo"
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
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-clinic-600 text-white font-semibold py-3 rounded-xl hover:bg-clinic-700 transition-colors"
          >
            S'inscrire
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-clinic-600">
          Vous avez déjà un compte ? <Link to="/login" className="text-clinic-600 font-semibold hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
