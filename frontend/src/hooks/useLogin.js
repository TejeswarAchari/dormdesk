import { useState } from 'react';
import api from '../services/api';
import { validateEmail } from '../utils/helpers';

const useLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submitPasswordLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return { ok: false, message: 'Please fill in all fields' };
    }

    if (!validateEmail(normalizedEmail)) {
      return { ok: false, message: 'Please enter a valid email' };
    }

    try {
      const { data } = await api.post('/auth/login', {
        email: normalizedEmail,
        password,
      });

      return { ok: true, data };
    } catch (error) {
      return {
        ok: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  return {
    email,
    password,
    setEmail,
    setPassword,
    submitPasswordLogin,
  };
};

export default useLogin;
