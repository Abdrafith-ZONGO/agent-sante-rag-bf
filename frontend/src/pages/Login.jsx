import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, AlertTriangle, Loader2 } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

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
        throw new Error('Nom d\'utilisateur ou mot de passe incorrect.');
      }

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('username', username);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-clinic-50">
      {/* Côté Image - Visible uniquement sur grands écrans */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-clinic-900">
        <img 
          src="/login-bg.png" 
          alt="Santé Numérique" 
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-clinic-900/90 to-transparent flex flex-col justify-end p-12">
          <h2 className="text-4xl font-bold text-white mb-4">Agent Santé BF</h2>
          <p className="text-clinic-100 text-lg">Votre assistant médical intelligent pour l'orientation et la prévention au Burkina Faso.</p>
        </div>
      </div>

      {/* Côté Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-clinic-900 mb-2">Bon retour 👋</h1>
            <p className="text-clinic-600">Connectez-vous pour accéder à votre espace de santé.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm flex items-center gap-3 animate-shake shadow-sm">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
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
                  className="w-full pl-11 pr-4 py-3.5 bg-white rounded-xl border border-clinic-200 focus:outline-none focus:ring-2 focus:ring-clinic-500 focus:border-transparent transition-all shadow-sm"
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
                  className="w-full pl-11 pr-4 py-3.5 bg-white rounded-xl border border-clinic-200 focus:outline-none focus:ring-2 focus:ring-clinic-500 focus:border-transparent transition-all shadow-sm"
                  style={{ fontSize: '16px' }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-clinic-600 text-white font-semibold py-3.5 rounded-xl hover:bg-clinic-700 focus:ring-4 focus:ring-clinic-200 transition-all shadow-md flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-clinic-600">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-clinic-700 font-bold hover:text-clinic-800 transition-colors underline decoration-2 underline-offset-4">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
