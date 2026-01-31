import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { Mail, Lock, Loader2 } from "lucide-react"; // Icons
import api from "../services/api";
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "../features/auth/authSlice";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    // 1. Dispatch Start Action
    dispatch(loginStart());

    try {
      // 2. Make API Call
      const { data } = await api.post("/auth/login", { email, password });

      // 3. Dispatch Success
      dispatch(loginSuccess(data));
      toast.success(`Welcome back, ${data.name}!`);

      // 4. Redirect based on Role
      if (data.role === "student") {
        navigate("/student-dashboard");
      } else {
        navigate("/caretaker-dashboard");
      }
    } catch (error) {
      // 5. Dispatch Failure
      const message = error.response?.data?.message || "Login failed";
      dispatch(loginFailure(message));
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-50 p-4">
  <div className="w-full max-w-6xl mx-auto flex items-center justify-start gap-16">

    
    {/* Left Image Section */}
    <div className="hidden md:block w-1/2">
      <img
        src="/loginPage.png"
        alt="Login Illustration"
        className="w-full h-auto object-contain"
      />
    </div>

     <div className="bg-primary-50/60 backdrop-blur-md p-8 rounded-2xl w-full max-w-md ">

        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center rounded-full">
            <img
              src="/logo-theme.png"
              alt="DormDesk Logo"
              className="w-70 h-40 object-contain"
            />
          </div>

          <h1 className="text-2xl font-bold text-dark-900">
            Login to HostelCMS
          </h1>

          <p className="text-dark-800 mt-2 text-sm">
            Welcome back! Please enter your details.
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-dark-800 mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-dark-800 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Login"}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Login;
