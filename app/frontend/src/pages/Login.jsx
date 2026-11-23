import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Login.css';

function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    try {
      const endpoint = isRegister ? '/api/users/register' : '/api/users/login';
      const payload = isRegister ? form : { email: form.email, password: form.password };
      const { data } = await api.post(endpoint, payload);

      localStorage.setItem('token', data.token);
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  }

  return (
    <div className="login">
      <h2>{isRegister ? 'Create Account' : 'Sign In'}</h2>

      <form onSubmit={handleSubmit} className="login-form">
        {isRegister && (
          <input
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        {error && <div className="login-error">{error}</div>}

        <button type="submit">{isRegister ? 'Register' : 'Sign In'}</button>
      </form>

      <p className="login-toggle">
        {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button className="btn-link" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Sign In' : 'Register'}
        </button>
      </p>
    </div>
  );
}

export default Login;
