import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import api from '../services/api';
import { User, Mail, Shield, CreditCard, Edit3, Save, X } from 'lucide-react';
export default function Profile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ username: '', fullName: '' });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    useEffect(() => {
        api.get('/auth/me').then(r => {
            const u = r.data.data;
            setProfile(u);
            setForm({ username: u.username || '', fullName: u.fullName || '' });
        }).catch(() => { });
    }, []);
    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/users/profile', form);
            setProfile((p) => ({ ...p, ...form }));
            setEditing(false);
            setMsg('Profile updated!');
            setTimeout(() => setMsg(''), 3000);
        }
        catch (e) {
            setMsg(e.response?.data?.message || 'Update failed');
        }
        finally {
            setSaving(false);
        }
    };
    const membershipLabels = ['Free', 'Premium', 'Enterprise'];
    const membershipColors = ['text-slate-400', 'text-amber-400', 'text-purple-400'];
    return (_jsxs("div", { className: "p-6 max-w-2xl", children: [_jsx("h1", { className: "text-2xl font-black text-white mb-6", children: "Profile" }), msg && _jsx("div", { className: "mb-4 p-3 bg-blue-900/30 border border-blue-700/40 rounded-xl text-blue-300 text-sm", children: msg }), _jsxs("div", { className: "bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-4", children: [_jsxs("div", { className: "flex items-start justify-between mb-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-2xl", children: (profile?.username || user?.username || 'U')[0]?.toUpperCase() }), _jsxs("div", { children: [_jsx("h2", { className: "text-white font-black text-xl", children: profile?.username || user?.username }), _jsx("p", { className: "text-slate-500 text-sm", children: profile?.email || user?.email }), _jsxs("p", { className: `text-sm font-semibold mt-0.5 ${membershipColors[profile?.membershipLevel || 0]}`, children: [membershipLabels[profile?.membershipLevel || 0], " Member"] })] })] }), _jsx("button", { onClick: () => setEditing(!editing), className: "flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 text-sm rounded-xl transition-all", children: editing ? _jsxs(_Fragment, { children: [_jsx(X, { className: "w-4 h-4" }), " Cancel"] }) : _jsxs(_Fragment, { children: [_jsx(Edit3, { className: "w-4 h-4" }), " Edit"] }) })] }), editing ? (_jsxs("form", { onSubmit: save, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-sm font-semibold mb-1 block", children: "Username" }), _jsx("input", { value: form.username, onChange: e => setForm({ ...form, username: e.target.value }), className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-sm font-semibold mb-1 block", children: "Full Name" }), _jsx("input", { value: form.fullName, onChange: e => setForm({ ...form, fullName: e.target.value }), placeholder: "Your full name", className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" })] }), _jsxs("button", { type: "submit", disabled: saving, className: "flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition-all", children: [_jsx(Save, { className: "w-4 h-4" }), " ", saving ? 'Saving...' : 'Save Changes'] })] })) : (_jsx("div", { className: "space-y-3", children: [
                            { label: 'Email', value: profile?.email, icon: Mail },
                            { label: 'Role', value: profile?.role, icon: Shield },
                            { label: 'Full Name', value: profile?.fullName || '—', icon: User },
                            { label: 'Member Since', value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—', icon: CreditCard },
                        ].map(f => (_jsxs("div", { className: "flex items-center gap-3 py-2.5 border-b border-slate-800 last:border-0", children: [_jsx(f.icon, { className: "w-4 h-4 text-slate-600 flex-shrink-0" }), _jsx("span", { className: "text-slate-500 text-sm w-28", children: f.label }), _jsx("span", { className: "text-white text-sm capitalize", children: f.value })] }, f.label))) }))] })] }));
}
