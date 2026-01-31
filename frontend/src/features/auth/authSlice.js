import { createSlice } from '@reduxjs/toolkit';

// Checking if user is already logged in from localStorage
const userFromStorage = localStorage.getItem('userInfo')
  ? JSON.parse(localStorage.getItem('userInfo'))
  : null;

const initialState = {
  userInfo: userFromStorage,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 1. Actions for Login
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.isLoading = false;
      state.userInfo = action.payload;
      state.error = null;
      // Save to local storage manually here or in the component
      localStorage.setItem('userInfo', JSON.stringify(action.payload));
    },
    loginFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // 2. Actions for Register
    registerStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    registerSuccess: (state, action) => {
      state.isLoading = false;
      state.userInfo = action.payload;
      state.error = null;
      localStorage.setItem('userInfo', JSON.stringify(action.payload));
    },
    registerFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // 3. Action for Logout
    logout: (state) => {
      state.userInfo = null;
      state.error = null;
      localStorage.removeItem('userInfo');
    },
  },
});

// Export the actions so we can use them in our pages
export const { 
  loginStart, loginSuccess, loginFailure, 
  registerStart, registerSuccess, registerFailure, 
  logout 
} = authSlice.actions;

export default authSlice.reducer;