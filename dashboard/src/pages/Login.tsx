import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/client';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { access_token } = await login(email, password);
      localStorage.setItem('access_token', access_token);
      navigate('/');
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      height: '100vh', background: '#f4f6f9',
    }}>
      <div style={{
        background: 'white', padding: '40px', borderRadius: '6px',
        border: '1px solid #e4e4e8', width: '320px',
      }}>
        <h2 style={{ marginBottom: '24px', color: '#2563a6', fontSize: '18px' }}>
          Mini PaaS — Sign In
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#555664' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%', padding: '8px 10px', fontSize: '13px',
                border: '1px solid #d0d0d8', borderRadius: '3px', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#555664' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '8px 10px', fontSize: '13px',
                border: '1px solid #d0d0d8', borderRadius: '3px', boxSizing: 'border-box',
              }}
            />
          </div>
          {error && (
            <p style={{ color: '#c0392b', fontSize: '12px', marginBottom: '14px' }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '9px', background: '#2563a6', color: 'white',
              border: 'none', borderRadius: '3px', fontSize: '13px', cursor: 'pointer',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {import.meta.env.DEV && (
          <div style={{ marginTop: '16px', borderTop: '1px solid #e4e4e8', paddingTop: '14px' }}>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>Dev only</p>
            <button
              onClick={() => { setEmail('alex@test.com'); setPassword('testpass123'); }}
              style={{
                width: '100%', padding: '7px', background: 'transparent', color: '#9ca3af',
                border: '1px dashed #d0d0d8', borderRadius: '3px', fontSize: '12px', cursor: 'pointer',
              }}
            >
              Fill dev credentials
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
