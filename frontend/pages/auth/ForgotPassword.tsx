import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<'request' | 'reset'>('request');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/password/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('If your email exists, an OTP has been sent to it.');
        setPhase('reset');
      } else {
        setMessage(data.message || 'Error sending OTP.');
      }
    } catch (err) {
      setMessage('Network error.');
    }
    setLoading(false);
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (!otp || !newPassword || !confirmPassword) return setMessage('All fields are required');
    if (newPassword !== confirmPassword) return setMessage('Passwords do not match');
    setLoading(true);
    try {
      const res = await fetch('/api/password/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password: newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Password reset successful. Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
        setPhase('request');
        setEmail('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setMessage('Network error.');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Forgot Password</h2>

        {phase === 'request' && (
          <form onSubmit={requestOtp}>
            <label className="block mb-2 text-gray-700 font-semibold">Email Address</label>
            <div className="relative mb-4">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      {/* Mail icon from Login.tsx (lucide-react) */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                  <input
                    type="email"
                    className="w-full pl-10 p-3 border border-blue-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition placeholder-gray-400 bg-white"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                  />
            </div>
            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
              <div className="mt-4 text-center">
                 <a href="/login" className="text-sm text-blue-600 hover:text-blue-800">Back to Login</a>
              </div>
          </form>
        )}

        {phase === 'reset' && (
          <form onSubmit={resetPassword}>
            <label className="block mb-2 text-gray-700">Enter OTP</label>
            <input
              type="text"
              className="w-full p-2 border rounded mb-4"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              required
            />
            <label className="block mb-2 text-gray-700">New Password</label>
            <input
              type="password"
              className="w-full p-2 border rounded mb-4"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
            />
            <label className="block mb-2 text-gray-700">Confirm New Password</label>
            <input
              type="password"
              className="w-full p-2 border rounded mb-4"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <div className="mt-3 text-center">
              <button
                type="button"
                className="text-sm text-gray-600 underline"
                onClick={() => setPhase('request')}
              >
                Back
              </button>
            </div>
          </form>
        )}

        {message && <p className="mt-4 text-center text-sm text-gray-600">{message}</p>}
      </div>
    </div>
  );
};

export default ForgotPassword;
