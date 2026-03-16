import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Mail, Zap, CheckCircle } from 'lucide-react';
export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authAPI.forgotPassword(email);
            setSent(true);
        }
        catch (e) {
            setSent(true);
        } // Show success regardless
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-slate-950 flex items-center justify-center p-4", children: _jsxs("div", { className: "w-full max-w-sm", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("div", { className: "w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4", children: _jsx(Zap, { className: "w-8 h-8 text-white" }) }), _jsx("h1", { className: "text-2xl font-black text-white", children: "Reset Password" }), _jsx("p", { className: "text-slate-500 mt-1 text-sm", children: "Enter your email to receive reset instructions" })] }), _jsx("div", { className: "bg-slate-900 border border-slate-800 rounded-2xl p-6", children: sent ? (_jsxs("div", { className: "text-center py-4", children: [_jsx(CheckCircle, { className: "w-12 h-12 text-green-500 mx-auto mb-3" }), _jsx("p", { className: "text-white font-semibold mb-1", children: "Email sent!" }), _jsx("p", { className: "text-slate-500 text-sm mb-4", children: "Check your inbox for reset instructions." }), _jsx(Link, { to: "/login", className: "text-blue-400 hover:text-blue-300 text-sm font-semibold", children: "Back to Login" })] })) : (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-sm font-semibold mb-1.5 block", children: "Email" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" }), _jsx("input", { type: "email", value: email, onChange: e => setEmail(e.target.value), placeholder: "you@example.com", required: true, className: "w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:border-blue-500" })] })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all", children: loading ? 'Sending...' : 'Send Reset Link' }), _jsx(Link, { to: "/login", className: "block text-center text-slate-500 hover:text-slate-300 text-sm transition-colors", children: "Back to Login" })] })) })] }) }));
}
