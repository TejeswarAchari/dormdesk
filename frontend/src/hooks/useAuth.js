import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  loginStart,
  loginSuccess,
  loginFailure,
  registerStart,
  registerSuccess,
  registerFailure,
} from '../features/auth/authSlice';

const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo, isLoading, error } = useSelector((state) => state.auth);

  const redirectByRole = (userData) => {
    if (userData.role === 'student') {
      navigate('/student-dashboard');
      return;
    }

    navigate('/caretaker-dashboard');
  };

  return {
    userInfo,
    isLoading,
    error,
    startLogin: () => dispatch(loginStart()),
    loginSucceeded: (userData) => {
      dispatch(loginSuccess(userData));
      redirectByRole(userData);
    },
    loginFailed: (message) => dispatch(loginFailure(message)),
    startRegister: () => dispatch(registerStart()),
    registerSucceeded: (userData) => {
      dispatch(registerSuccess(userData));
      redirectByRole(userData);
    },
    registerFailed: (message) => dispatch(registerFailure(message)),
  };
};

export default useAuth;
