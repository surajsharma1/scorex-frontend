import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import { authAPI } from '../services/api';
import { getApiBaseUrl } from '../services/env';
import { Mail, Lock, Zap, AlertTriangle } from 'lucide-react';
export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await authAPI.login(form);
            const data = res.data;
            if (data.success) {
                login(data);
                navigate('/dashboard');
            }
            else {
                setError(data.message || 'Login failed');
            }
        }
        catch (e) {
            setError(e.response?.data?.message || 'Invalid credentials');
        }
        finally {
            setLoading(false);
        }
    };
    const handleGoogle = () => {
        const state = encodeURIComponent(window.location.origin);
        window.location.href = `${getApiBaseUrl()}/auth/google?state=${state}`;
    };
    return (_jsx("div", { className: "min-h-screen bg-slate-950 flex items-center justify-center p-4", children: _jsxs("div", { className: "w-full max-w-md", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("div", { className: "w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4", children: _jsx(Zap, { className: "w-8 h-8 text-white" }) }), _jsx("h1", { className: "text-3xl font-black text-white", children: "ScoreX" }), _jsx("p", { className: "text-slate-500 mt-1", children: "Sign in to your account" })] }), _jsxs("div", { className: "bg-slate-900 border border-slate-800 rounded-2xl p-6", children: [error && (_jsxs("div", { className: "mb-4 p-3 bg-red-900/30 border border-red-700/40 rounded-xl flex items-center gap-2 text-red-300 text-sm", children: [_jsx(AlertTriangle, { className: "w-4 h-4 flex-shrink-0" }), error] })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-sm font-semibold mb-1.5 block", children: "Email" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" }), _jsx("input", { type: "email", value: form.email, onChange: e => setForm({ ...form, email: e.target.value }), placeholder: "you@example.com", required: true, className: "w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-sm font-semibold mb-1.5 block", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" }), _jsx("input", { type: "password", value: form.password, onChange: e => setForm({ ...form, password: e.target.value }), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true, className: "w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors" })] })] }), _jsx("div", { className: "flex justify-end", children: _jsx(Link, { to: "/forgot-password", className: "text-blue-400 hover:text-blue-300 text-sm", children: "Forgot password?" }) }), _jsx("button", { type: "submit", disabled: loading, className: "w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all", children: loading ? 'Signing in...' : 'Sign In' })] }), _jsxs("div", { className: "flex items-center gap-3 my-5", children: [_jsx("div", { className: "flex-1 h-px bg-slate-800" }), _jsx("span", { className: "text-slate-600 text-xs", children: "or" }), _jsx("div", { className: "flex-1 h-px bg-slate-800" })] }), _jsxs("button", { onClick: handleGoogle, className: "w-full flex items-center justify-center gap-3 py-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-xl transition-all text-sm", children: [_jsxs("svg", { className: "w-5 h-5", viewBox: "0 0 24 24", children: [_jsx("path", { fill: "#4285F4", d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" }), _jsx("path", { fill: "#34A853", d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" }), _jsx("path", { fill: "#FBBC05", d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" }), _jsx("path", { fill: "#EA4335", d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" })] }), "Continue with Google"] }), _jsxs("p", { className: "text-center mt-5 text-slate-500 text-sm", children: ["Don't have an account? ", _jsx(Link, { to: "/register", className: "text-blue-400 hover:text-blue-300 font-semibold", children: "Sign up" })] })] })] }) }));
}
