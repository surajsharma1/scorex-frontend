import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import { authAPI } from '../services/api';
import { Mail, Lock, User, Zap, AlertTriangle } from 'lucide-react';
export default function Register() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await authAPI.register({ username: form.username, email: form.email, password: form.password });
            if (res.data.success) {
                login(res.data);
                navigate('/dashboard');
            }
            else
                setError(res.data.message || 'Registration failed');
        }
        catch (e) {
            setError(e.response?.data?.message || 'Registration failed');
        }
        finally {
            setLoading(false);
        }
    };
    const fields = [
        { key: 'username', label: 'Username', type: 'text', icon: User, placeholder: 'johndoe' },
        { key: 'email', label: 'Email', type: 'email', icon: Mail, placeholder: 'you@example.com' },
        { key: 'password', label: 'Password', type: 'password', icon: Lock, placeholder: '••••••••' },
        { key: 'confirmPassword', label: 'Confirm Password', type: 'password', icon: Lock, placeholder: '••••••••' },
    ];
    return (_jsx("div", { className: "min-h-screen bg-slate-950 flex items-center justify-center p-4", children: _jsxs("div", { className: "w-full max-w-md", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("div", { className: "w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4", children: _jsx(Zap, { className: "w-8 h-8 text-white" }) }), _jsx("h1", { className: "text-3xl font-black text-white", children: "Join ScoreX" }), _jsx("p", { className: "text-slate-500 mt-1", children: "Create your account" })] }), _jsxs("div", { className: "bg-slate-900 border border-slate-800 rounded-2xl p-6", children: [error && (_jsxs("div", { className: "mb-4 p-3 bg-red-900/30 border border-red-700/40 rounded-xl flex items-center gap-2 text-red-300 text-sm", children: [_jsx(AlertTriangle, { className: "w-4 h-4 flex-shrink-0" }), error] })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [fields.map(f => (_jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-sm font-semibold mb-1.5 block", children: f.label }), _jsxs("div", { className: "relative", children: [_jsx(f.icon, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" }), _jsx("input", { type: f.type, value: form[f.key], onChange: e => setForm({ ...form, [f.key]: e.target.value }), placeholder: f.placeholder, required: true, className: "w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors" })] })] }, f.key))), _jsx("button", { type: "submit", disabled: loading, className: "w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all mt-2", children: loading ? 'Creating account...' : 'Create Account' })] }), _jsxs("p", { className: "text-center mt-5 text-slate-500 text-sm", children: ["Already have an account? ", _jsx(Link, { to: "/login", className: "text-blue-400 hover:text-blue-300 font-semibold", children: "Sign in" })] })] })] }) }));
}
