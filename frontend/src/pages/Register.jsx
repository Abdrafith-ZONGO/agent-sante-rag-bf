import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, AlertTriangle, Loader2, ShieldCheck } from 'lucide-react';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

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
        throw new Error(errorData.detail || 'Ce nom d\'utilisateur est peut-être déjà pris.');
      }

      // Inscription réussie, rediriger vers login
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-clinic-50 via-clinic-100 to-clinic-200">
      
      {/* Formulaire avec effet Glassmorphism */}
      <div className="w-full max-w-md p-8 sm:p-10 bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-clinic-100 text-clinic-600 mb-4 shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-clinic-900 mb-2">Créer un compte ✨</h1>
          <p className="text-clinic-600">Rejoignez l'assistant santé intelligent</p>
        </div>

        {error && (
          <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm flex items-center gap-3 animate-shake shadow-sm">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-clinic-800 mb-2">Nom d'utilisateur</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-clinic-400" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/80 rounded-xl border border-clinic-200 focus:outline-none focus:ring-2 focus:ring-clinic-500 focus:border-transparent transition-all shadow-sm"
                style={{ fontSize: '16px' }}
                placeholder="Ex: docteur_ouedraogo"
                autoComplete="username"
                autoCapitalize="none"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-clinic-800 mb-2">Mot de passe</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-clinic-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/80 rounded-xl border border-clinic-200 focus:outline-none focus:ring-2 focus:ring-clinic-500 focus:border-transparent transition-all shadow-sm"
                style={{ fontSize: '16px' }}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-clinic-600 text-white font-semibold py-3.5 rounded-xl hover:bg-clinic-700 focus:ring-4 focus:ring-clinic-200 transition-all shadow-lg shadow-clinic-500/30 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Création en cours...
              </>
            ) : (
              'S\'inscrire'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-clinic-700">
          Vous avez déjà un compte ?{' '}
          <Link to="/login" className="text-clinic-800 font-bold hover:text-clinic-900 transition-colors underline decoration-2 underline-offset-4">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
