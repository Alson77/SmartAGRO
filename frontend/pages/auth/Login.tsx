import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Real-time email validation
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (touched.email) {
      if (!value.trim()) {
        setEmailError('Email is required');
      } else if (!validateEmail(value)) {
        setEmailError('Please enter a valid email address');
      } else {
        setEmailError('');
      }
    }
  };

  // Real-time password validation
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (touched.password) {
      if (!value.trim()) {
        setPasswordError('Password is required');
      } else if (value.length < 6) {
        setPasswordError('Password must be at least 6 characters');
      } else {
        setPasswordError('');
      }
    }
  };

  // Handle field blur
  const handleEmailBlur = () => {
    setTouched(prev => ({ ...prev, email: true }));
    if (!email.trim()) {
      setEmailError('Email is required');
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
    }
  };

  const handlePasswordBlur = () => {
    setTouched(prev => ({ ...prev, password: true }));
    if (!password.trim()) {
      setPasswordError('Password is required');
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Mark all fields as touched
    setTouched({ email: true, password: true });

    // Validate all fields
    let hasError = false;

    if (!email.trim()) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      hasError = true;
    } else {
      setEmailError('');
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasError = true;
    } else {
      setPasswordError('');
    }

    if (hasError) return;

    setIsLoading(true);
    const success = await login(email, password);
    setIsLoading(false);

    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid email or password. Please try again or register first.');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        {/* Animated Circles */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-emerald-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 text-green-600/20 text-8xl animate-bounce" style={{ animationDuration: '3s' }}>🌾</div>
        <div className="absolute bottom-20 right-20 text-emerald-600/20 text-7xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}>🌱</div>
        <div className="absolute bottom-20 left-10 text-teal-600/20 text-6xl animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}>🚜</div>
      </div>

      {/* Main Content: Left text, Right form */}
      <div className="w-full max-w-6xl flex items-center justify-between gap-8 relative z-10">
        {/* Left Section: Appealing Text */}
        <div className="w-1/2 pr-8 hidden lg:flex flex-col items-start justify-center space-y-6">
          <div className="space-y-3">
            <h1 className="text-5xl font-bold leading-tight tracking-tight whitespace-nowrap">
              <span className="text-green-700">Welcome to </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">Krishi Sathi</span>
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
          </div>
          
          <div className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
            <p className="text-xl text-gray-700 leading-relaxed pl-4 font-light">
              Empowering Nepalese farmers with <span className="font-semibold text-green-600">technology</span>, <span className="font-semibold text-green-600">insights</span>, and <span className="font-semibold text-green-600">community</span>. Manage your crops, subsidies, and market prices all in one place.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 group">
              <div className="mt-1 w-2 h-2 rounded-full bg-green-500 group-hover:scale-125 transition-transform"></div>
              <p className="text-gray-600 text-base">Track your farming activities and subsidies</p>
            </div>
            <div className="flex items-start gap-3 group">
              <div className="mt-1 w-2 h-2 rounded-full bg-green-500 group-hover:scale-125 transition-transform"></div>
              <p className="text-gray-600 text-base">Get real-time market prices and updates</p>
            </div>
            <div className="flex items-start gap-3 group">
              <div className="mt-1 w-2 h-2 rounded-full bg-green-500 group-hover:scale-125 transition-transform"></div>
              <p className="text-gray-600 text-base">Report crop issues and get expert help</p>
            </div>
          </div>
          
          <div className="mt-4 px-6 py-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border-l-4 border-green-500">
            <p className="text-green-900 font-semibold text-lg">Your journey to smart farming starts here!</p>
          </div>
        </div>

        {/* Right Section: Sign-in Form */}
        <div className="w-full lg:w-1/2 max-w-md lg:ml-auto">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 transform hover:scale-[1.02] transition-transform duration-300">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <div className="bg-green-200 dark:bg-green-700 p-3 rounded-full shadow-lg">
                  <Leaf className="h-8 w-8 text-green-700 dark:text-green-100" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Krishi Sathi</h2>
              <p className="mt-1 text-gray-600 dark:text-gray-300 text-sm">Smart Farmer Nepal</p>
            </div>

            {/* Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-300 px-4 py-2 rounded-lg text-sm text-center animate-fade-in">
                  {error}
                </div>
              )}

              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    onBlur={handleEmailBlur}
                    placeholder="Email Address"
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 transition placeholder-gray-400 dark:placeholder-gray-500 bg-white/80 dark:bg-zinc-800/80 ${
                      emailError && touched.email
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-400'
                        : 'border-green-200 dark:border-green-700 focus:ring-green-400 focus:border-green-400'
                    }`}
                  />
                </div>
                {emailError && touched.email && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400 animate-fadeIn">
                    {emailError}
                  </p>
                )}
              </div>

              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    onBlur={handlePasswordBlur}
                    placeholder="Password"
                    className={`w-full pl-10 pr-10 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 transition placeholder-gray-400 dark:placeholder-gray-500 bg-white/80 dark:bg-zinc-800/80 ${
                      passwordError && touched.password
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-400'
                        : 'border-green-200 dark:border-green-700 focus:ring-green-400 focus:border-green-400'
                    }`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-300" /> : <Eye className="h-5 w-5 text-gray-400 dark:text-gray-300" />}
                  </button>
                </div>
                {passwordError && touched.password && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400 animate-fadeIn">
                    {passwordError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-semibold rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Sign In'}
              </button>
            </form>

            {/* Footer: Forgot Password & Sign Up in one line with separator */}
            <div className="mt-6 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 gap-2">
              <span>
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-green-700 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100 transition-colors">
                  Sign Up
                </Link>
              </span>
              <span className="mx-2 select-none">|</span>
              <Link to="/forgot-password" className="font-medium text-green-700 hover:underline text-right">
                Forgot Password?
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Project Work 7th Semester */}
      <footer className="absolute bottom-0 left-0 w-full bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-200/50 backdrop-blur-sm z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <p className="text-sm text-gray-700 font-medium tracking-wide">
            Project Work <span className="text-green-600 font-semibold">7th Semester B.Sc. CSIT</span>
          </p>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>
      </footer>
    </div>
  );
};

export default Login;