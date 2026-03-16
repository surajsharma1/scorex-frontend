import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Lock, Loader2, CheckCircle } from 'lucide-react';
export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirm) {
            setError('Passwords do not match');
            return;
        }
        if (!token) {
            setError('Invalid reset token');
            return;
        }
        setStatus('loading');
        try {
            await authAPI.resetPassword(token, password);
            setStatus('success');
            setTimeout(() => navigate('/login'), 3000);
        }
        catch (e) {
            setStatus('error');
            setError('Failed to reset password. Link may be expired.');
        }
    };
    if (status === 'success') {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-900 text-white p-4", children: _jsxs("div", { className: "bg-gray-800 p-8 rounded-2xl shadow-xl text-center max-w-sm", children: [_jsx("div", { className: "w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(CheckCircle, { className: "w-8 h-8" }) }), _jsx("h2", { className: "text-xl font-bold mb-2", children: "Password Reset!" }), _jsx("p", { className: "text-gray-400", children: "Redirecting to login..." })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-900 text-white p-4", children: _jsxs("div", { className: "w-full max-w-md bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700", children: [_jsx("h1", { className: "text-2xl font-bold mb-6 text-center", children: "Set New Password" }), error && (_jsx("div", { className: "mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm", children: error })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-1", children: "New Password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-3 w-5 h-5 text-gray-500" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full pl-10 p-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none", required: true })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-1", children: "Confirm Password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-3 w-5 h-5 text-gray-500" }), _jsx("input", { type: "password", value: confirm, onChange: (e) => setConfirm(e.target.value), className: "w-full pl-10 p-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none", required: true })] })] }), _jsx("button", { type: "submit", disabled: status === 'loading', className: "w-full py-3 bg-green-600 hover:bg-green-700 rounded-xl font-bold transition-all flex items-center justify-center", children: status === 'loading' ? _jsx(Loader2, { className: "animate-spin w-5 h-5" }) : 'Update Password' })] })] }) }));
}
