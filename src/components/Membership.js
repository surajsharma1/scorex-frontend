import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAuth } from '../App';
import { Check, Zap, Crown, Star } from 'lucide-react';
const PLANS = [
    {
        name: 'Free', price: 0, period: '', icon: Zap, color: 'border-slate-700',
        headerColor: 'from-slate-800 to-slate-900',
        features: ['Up to 3 tournaments', 'Basic scoring', '5 overlays', 'Standard support'],
        level: 0
    },
    {
        name: 'Premium', price: 499, period: '/month', icon: Star, color: 'border-blue-500/50',
        headerColor: 'from-blue-900/60 to-blue-800/40',
        features: ['Unlimited tournaments', 'Live scoring + undo', '20 premium overlays', 'Priority support', 'Match analytics', 'Export data'],
        level: 1, popular: true
    },
    {
        name: 'Enterprise', price: 1499, period: '/month', icon: Crown, color: 'border-purple-500/50',
        headerColor: 'from-purple-900/60 to-purple-800/40',
        features: ['Everything in Premium', 'Custom overlays', 'White-label', 'API access', 'Dedicated support', 'Club management'],
        level: 2
    },
];
export default function Membership() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(null);
    const handleUpgrade = async (plan) => {
        if (plan.level === 0)
            return;
        setLoading(plan.name);
        // Razorpay integration placeholder
        setTimeout(() => {
            alert(`Razorpay checkout for ${plan.name} - ₹${plan.price}/month\n\nIntegrate Razorpay SDK here with your key.`);
            setLoading(null);
        }, 500);
    };
    const currentLevel = user?.membershipLevel || 0;
    return (_jsxs("div", { className: "p-6 max-w-5xl", children: [_jsxs("div", { className: "text-center mb-10", children: [_jsx("h1", { className: "text-3xl font-black text-white", children: "Membership Plans" }), _jsx("p", { className: "text-slate-500 mt-2", children: "Upgrade to unlock premium features and overlays" }), currentLevel > 0 && (_jsxs("div", { className: "inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-blue-900/30 border border-blue-500/30 text-blue-400 text-sm font-semibold", children: [_jsx(Star, { className: "w-4 h-4" }), " Currently on ", PLANS[currentLevel]?.name] }))] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: PLANS.map(plan => {
                    const isCurrent = plan.level === currentLevel;
                    const isLower = plan.level < currentLevel;
                    return (_jsxs("div", { className: `relative bg-slate-900 border-2 rounded-2xl overflow-hidden transition-all ${plan.color} ${plan.popular ? 'scale-105 shadow-xl shadow-blue-500/10' : ''}`, children: [plan.popular && (_jsx("div", { className: "absolute top-0 left-0 right-0 bg-blue-600 text-white text-xs font-bold text-center py-1", children: "MOST POPULAR" })), _jsxs("div", { className: `bg-gradient-to-br ${plan.headerColor} px-6 pt-${plan.popular ? '8' : '6'} pb-6`, children: [_jsx(plan.icon, { className: `w-8 h-8 mb-3 ${plan.level === 0 ? 'text-slate-400' : plan.level === 1 ? 'text-blue-400' : 'text-purple-400'}` }), _jsx("h3", { className: "text-white font-black text-xl", children: plan.name }), _jsxs("div", { className: "mt-2 flex items-end gap-1", children: [_jsxs("span", { className: "text-3xl font-black text-white", children: ["\u20B9", plan.price] }), _jsx("span", { className: "text-slate-400 text-sm mb-0.5", children: plan.period })] })] }), _jsxs("div", { className: "px-6 py-5", children: [_jsx("ul", { className: "space-y-3 mb-6", children: plan.features.map(f => (_jsxs("li", { className: "flex items-center gap-2 text-sm text-slate-300", children: [_jsx(Check, { className: `w-4 h-4 flex-shrink-0 ${plan.level === 2 ? 'text-purple-400' : plan.level === 1 ? 'text-blue-400' : 'text-slate-500'}` }), f] }, f))) }), _jsx("button", { onClick: () => handleUpgrade(plan), disabled: isCurrent || isLower || loading === plan.name, className: `w-full py-3 rounded-xl font-bold text-sm transition-all disabled:cursor-not-allowed
                    ${isCurrent ? 'bg-green-900/30 border border-green-500/40 text-green-400 cursor-default' :
                                            isLower ? 'bg-slate-800 text-slate-600' :
                                                plan.level === 2 ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/20' :
                                                    plan.level === 1 ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20' :
                                                        'bg-slate-700 text-slate-300'}`, children: loading === plan.name ? 'Processing...' :
                                            isCurrent ? '✓ Current Plan' :
                                                isLower ? 'Downgrade' :
                                                    plan.level === 0 ? 'Free Forever' : `Upgrade to ${plan.name}` })] })] }, plan.name));
                }) })] }));
}
