import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setMessage('Passwords do not match');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/password/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Password reset successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage(data.message || 'Error resetting password.');
      }
    } catch (err) {
      setMessage('Network error.');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Reset Password</h2>
        <label className="block mb-2 text-gray-700">New Password</label>
        <input
          type="password"
          className="w-full p-2 border rounded mb-4"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <label className="block mb-2 text-gray-700">Confirm Password</label>
        <input
          type="password"
          className="w-full p-2 border rounded mb-4"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
        />
        {/* Message block moved outside input/label elements */}
        {message &&
          (message.toLowerCase().includes('invalid otp') ? (
            <p className="mt-4 text-center text-sm text-red-600 font-semibold">{message}</p>
          ) : (
            <p className="mt-4 text-center text-sm text-gray-600">{message}</p>
          ))}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
        {message && <p className="mt-4 text-center text-sm text-gray-600">{message}</p>}
      </form>
    </div>
  );
};

export default ResetPassword;