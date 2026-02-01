import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('All fields are required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    const success = await login(email, password, 'admin');
    setIsLoading(false);

    if (success) {
      navigate('/admin/dashboard');
    } else {
      setError('Invalid admin credentials');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-blue-200 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-blue-200 dark:border-blue-700 p-8 transition-all hover:scale-[1.02] duration-300">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-200 dark:bg-blue-700 p-3 rounded-full shadow-md">
                <Shield className="h-10 w-10 text-blue-700 dark:text-blue-100" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Portal</h2>
            <p className="mt-1 text-gray-500 dark:text-gray-300 text-sm">
              Krishi Sathi - Secure Access
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm text-center animate-fade-in">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500">
                <Mail className="h-5 w-5" />
              </span>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Admin Email"
                className="w-full pl-10 pr-4 py-3 border border-blue-300 dark:border-blue-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400 dark:placeholder-gray-500 transition"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-10 pr-10 py-3 border border-blue-300 dark:border-blue-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400 dark:placeholder-gray-500 transition"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center transition-all duration-200"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign In'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
