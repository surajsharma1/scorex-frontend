import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Loader2, Mail, Lock, User, CheckCircle, ArrowRight, KeyRound, AlertCircle, Check } from 'lucide-react';

// Validation functions
const validateUsername = (username: string): string | null => {
  if (!username) return 'Username is required';
  if (username.length < 3) return 'Username must be at least 3 characters';
  if (username.length > 50) return 'Username must be less than 50 characters';
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores';
  return null;
};

const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  if (password.length > 100) return 'Password must be less than 100 characters';
  if (!/(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])/.test(password)) {
    return 'Password must contain at least one letter, one number, and one special character';
  }
  return null;
};

const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
};

interface FieldErrors {
  username: string | null;
  email: string | null;
  password: string | null;
  confirmPassword: string | null;
}

export default function Register() {
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [touched, setTouched] = useState({
    username: false,
    email: false,
    password: false,
    confirmPassword: false
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
    username: null,
    email: null,
    password: null,
    confirmPassword: null
  });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Validate a single field
  const validateField = (name: string, value: string): string | null => {
    switch (name) {
      case 'username':
        return validateUsername(value);
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePassword(value);
      case 'confirmPassword':
        return validateConfirmPassword(formData.password, value);
      default:
        return null;
    }
  };

  // Handle input change with real-time validation
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validate on change if field has been touched
    if (touched[name as keyof typeof touched]) {
      const error = validateField(name, name === 'confirmPassword' ? formData.password : value);
      setFieldErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // Handle blur - mark field as touched and validate
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, name === 'confirmPassword' ? formData.password : value);
    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  // Check if form is valid
  const isFormValid = (): boolean => {
    const usernameError = validateUsername(formData.username);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmPassword);
    
    return !usernameError && !emailError && !passwordError && !confirmPasswordError;
  };

  // Step 1: Submit Details & Request OTP
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const usernameError = validateUsername(formData.username);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmPassword);
    
    setFieldErrors({
      username: usernameError,
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError
    });
    
    setTouched({
      username: true,
      email: true,
      password: true,
      confirmPassword: true
    });

    if (usernameError || emailError || passwordError || confirmPasswordError) {
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // This endpoint should create a temporary user/record and send OTP via Nodemailer
      await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      
      setStep('otp');
      alert(`OTP sent to ${formData.email}. Please check your inbox (and spam folder).`);
    } catch (err: any) {
      // Handle backend validation errors
      if (err.response?.data?.errors) {
        const errors: FieldErrors = { username: null, email: null, password: null, confirmPassword: null };
        err.response.data.errors.forEach((err: { field: string; message: string }) => {
          if (err.field in errors) {
            errors[err.field as keyof FieldErrors] = err.message;
          }
        });
        setFieldErrors(errors);
      } else {
        setError(err.response?.data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await authAPI.verifyEmailOTP({
        email: formData.email,
        otp: otp
      });

      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    } catch (err: any) {
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {step === 'details' ? 'Create Account' : 'Verify Email'}
          </h1>
          <p className="text-gray-400">
            {step === 'details' ? 'Join ScoreX today' : `Enter OTP sent to ${formData.email}`}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        {step === 'details' ? (
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
              <div className="relative">
                <User className={`absolute left-3 top-3 w-5 h-5 ${fieldErrors.username ? 'text-red-500' : touched.username && !fieldErrors.username ? 'text-green-500' : 'text-gray-500'}`} />
                <input 
                  type="text" 
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 p-3 bg-gray-700 border rounded-xl focus:ring-2 outline-none transition-colors ${
                    fieldErrors.username 
                      ? 'border-red-500 focus:ring-red-500' 
                      : touched.username && !fieldErrors.username 
                        ? 'border-green-500 focus:ring-green-500' 
                        : 'border-gray-600 focus:ring-green-500'
                  }`}
                  placeholder="cricket_fan_99"
                />
                {touched.username && !fieldErrors.username && formData.username && (
                  <Check className="absolute right-3 top-3 w-5 h-5 text-green-500" />
                )}
              </div>
              {fieldErrors.username && touched.username && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {fieldErrors.username}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">3-50 characters, letters, numbers, and underscores only</p>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <div className="relative">
                <Mail className={`absolute left-3 top-3 w-5 h-5 ${fieldErrors.email ? 'text-red-500' : touched.email && !fieldErrors.email ? 'text-green-500' : 'text-gray-500'}`} />
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 p-3 bg-gray-700 border rounded-xl focus:ring-2 outline-none transition-colors ${
                    fieldErrors.email 
                      ? 'border-red-500 focus:ring-red-500' 
                      : touched.email && !fieldErrors.email 
                        ? 'border-green-500 focus:ring-green-500' 
                        : 'border-gray-600 focus:ring-green-500'
                  }`}
                  placeholder="you@example.com"
                />
                {touched.email && !fieldErrors.email && formData.email && (
                  <Check className="absolute right-3 top-3 w-5 h-5 text-green-500" />
                )}
              </div>
              {fieldErrors.email && touched.email && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <div className="relative">
                <Lock className={`absolute left-3 top-3 w-5 h-5 ${fieldErrors.password ? 'text-red-500' : touched.password && !fieldErrors.password ? 'text-green-500' : 'text-gray-500'}`} />
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 p-3 bg-gray-700 border rounded-xl focus:ring-2 outline-none transition-colors ${
                    fieldErrors.password 
                      ? 'border-red-500 focus:ring-red-500' 
                      : touched.password && !fieldErrors.password 
                        ? 'border-green-500 focus:ring-green-500' 
                        : 'border-gray-600 focus:ring-green-500'
                  }`}
                  placeholder="Min 6 chars with letter, number & special char"
                />
                {touched.password && !fieldErrors.password && formData.password && (
                  <Check className="absolute right-3 top-3 w-5 h-5 text-green-500" />
                )}
              </div>
              {fieldErrors.password && touched.password && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
              <div className="relative">
                <CheckCircle className={`absolute left-3 top-3 w-5 h-5 ${fieldErrors.confirmPassword ? 'text-red-500' : touched.confirmPassword && !fieldErrors.confirmPassword ? 'text-green-500' : 'text-gray-500'}`} />
                <input 
                  type="password" 
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 p-3 bg-gray-700 border rounded-xl focus:ring-2 outline-none transition-colors ${
                    fieldErrors.confirmPassword 
                      ? 'border-red-500 focus:ring-red-500' 
                      : touched.confirmPassword && !fieldErrors.confirmPassword 
                        ? 'border-green-500 focus:ring-green-500' 
                        : 'border-gray-600 focus:ring-green-500'
                  }`}
                  placeholder="Retype password"
                />
                {touched.confirmPassword && !fieldErrors.confirmPassword && formData.confirmPassword && (
                  <Check className="absolute right-3 top-3 w-5 h-5 text-green-500" />
                )}
              </div>
              {fieldErrors.confirmPassword && touched.confirmPassword && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 mt-4 bg-green-600 hover:bg-green-700 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <>Next Step <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">One-Time Password (OTP)</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input 
                  type="text" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full pl-10 p-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 outline-none tracking-widest text-center text-xl font-mono"
                  placeholder="123456"
                  maxLength={6}
                  required 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Verify & Create Account'}
            </button>

            <button 
              type="button" 
              onClick={() => setStep('details')}
              className="w-full text-sm text-gray-400 hover:text-white"
            >
              Back to Details
            </button>
          </form>
        )}

        {step === 'details' && (
          <div className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-green-400 hover:text-green-300 font-bold">
              Log In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}