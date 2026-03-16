import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { paymentAPI } from '../services/api';
import { CreditCard, CheckCircle, X, ShieldCheck, Loader2, Smartphone, Crown, Zap } from 'lucide-react';
export default function Payment({ onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState('lv1');
    const [selectedDuration, setSelectedDuration] = useState('1-month');
    const [paymentMethod, setPaymentMethod] = useState('card');
    // Test card details - Pre-filled for free membership purchase
    const [cardNumber, setCardNumber] = useState('8871474139');
    const [expiry, setExpiry] = useState('2609');
    const [cvc, setCvc] = useState('123');
    // Pricing configuration
    const pricing = {
        lv1: {
            '1-day': 49,
            '1-week': 199,
            '1-month': 399
        },
        lv2: {
            '1-day': 99,
            '1-week': 399,
            '1-month': 799
        }
    };
    // Plan name mapping
    const getPlanName = () => {
        return `premium-${selectedLevel}-${selectedDuration}`;
    };
    const getPlanDisplayName = () => {
        const durationNames = {
            '1-day': '1 Day',
            '1-week': '1 Week',
            '1-month': '1 Month'
        };
        return `Premium ${selectedLevel.toUpperCase()} - ${durationNames[selectedDuration]}`;
    };
    const getAmount = () => {
        return pricing[selectedLevel][selectedDuration];
    };
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };
    const handlePayment = async (e) => {
        e.preventDefault();
        setLoading(true);
        const planName = getPlanName();
        const amount = getAmount();
        // Test card or Admin override - Apply free membership for any plan
        if (paymentMethod === 'card' && (cardNumber === 'ADMINFREEPASS' || cardNumber === '8871474139')) {
            try {
                const response = await paymentAPI.createSubscription(planName);
                // If the API returns a new token, save it to localStorage
                if (response.data && response.data.token) {
                    localStorage.setItem('token', response.data.token);
                    console.log('Token updated in localStorage after payment');
                }
                onSuccess(planName);
                alert(`Test card applied! ${getPlanDisplayName()} activated successfully!`);
            }
            catch (error) {
                alert('Test card application failed. Check API.');
            }
            finally {
                setLoading(false);
            }
            return;
        }
        if (paymentMethod === 'razorpay') {
            const res = await loadRazorpayScript();
            if (!res) {
                alert('Razorpay SDK failed to load. Are you online?');
                setLoading(false);
                return;
            }
            try {
                const { data: orderData } = await paymentAPI.createRazorpayOrder(amount, planName);
                const options = {
                    key: "YOUR_RAZORPAY_KEY_ID",
                    amount: orderData.amount,
                    currency: orderData.currency,
                    name: "ScoreX Cricket",
                    description: `Subscription for ${getPlanDisplayName()}`,
                    order_id: orderData.id,
                    handler: async function (response) {
                        try {
                            await paymentAPI.verifyRazorpayPayment({
                                razorpayOrderId: response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpaySignature: response.razorpay_signature,
                                plan: planName
                            });
                            onSuccess(planName);
                            alert('Payment Successful!');
                        }
                        catch (err) {
                            alert('Payment verification failed');
                        }
                    },
                    prefill: {
                        name: "ScoreX User",
                        email: "user@example.com",
                        contact: ""
                    },
                    theme: { color: selectedLevel === 'lv2' ? "#8B5CF6" : "#2563EB" }
                };
                const paymentObject = new window.Razorpay(options);
                paymentObject.open();
            }
            catch (err) {
                console.error(err);
                alert('Failed to initiate payment');
            }
            finally {
                setLoading(false);
            }
        }
        else {
            // Standard Card Gateway Logic
            setTimeout(async () => {
                try {
                    await paymentAPI.createSubscription(planName);
                    onSuccess(planName);
                }
                catch (error) {
                    alert('Payment failed. Please try again.');
                }
                finally {
                    setLoading(false);
                }
            }, 2000);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]", children: [_jsxs("div", { className: `bg-gradient-to-r ${selectedLevel === 'lv2' ? 'from-purple-600 to-violet-700' : 'from-blue-600 to-indigo-700'} p-6 text-white flex justify-between items-start`, children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-2xl font-bold flex items-center gap-2", children: [_jsx(ShieldCheck, { className: "w-6 h-6" }), " Premium Upgrade"] }), _jsx("p", { className: "text-blue-100 text-sm mt-1", children: "Unlock animated overlays & advanced stats" })] }), _jsx("button", { onClick: onClose, className: "bg-white/20 p-1 rounded-full hover:bg-white/30 transition", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsxs("div", { className: "p-6 overflow-y-auto", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3", children: "Select Membership Level" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { onClick: () => setSelectedLevel('lv1'), className: `border-2 p-4 rounded-xl cursor-pointer transition-all ${selectedLevel === 'lv1'
                                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'}`, children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Zap, { className: `w-5 h-5 ${selectedLevel === 'lv1' ? 'text-blue-600' : 'text-gray-400'}` }), _jsx("span", { className: "font-bold dark:text-white", children: "Level 1" }), selectedLevel === 'lv1' && _jsx(CheckCircle, { className: "w-4 h-4 text-blue-600 ml-auto" })] }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: "Basic overlays & features" }), _jsx("p", { className: "text-lg font-bold text-blue-600 dark:text-blue-400 mt-2", children: "From \u20B949" })] }), _jsxs("div", { onClick: () => setSelectedLevel('lv2'), className: `border-2 p-4 rounded-xl cursor-pointer transition-all ${selectedLevel === 'lv2'
                                                ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-purple-400'}`, children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Crown, { className: `w-5 h-5 ${selectedLevel === 'lv2' ? 'text-purple-600' : 'text-gray-400'}` }), _jsx("span", { className: "font-bold dark:text-white", children: "Level 2" }), selectedLevel === 'lv2' && _jsx(CheckCircle, { className: "w-4 h-4 text-purple-600 ml-auto" })] }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: "All overlays & premium features" }), _jsx("p", { className: "text-lg font-bold text-purple-600 dark:text-purple-400 mt-2", children: "From \u20B999" })] })] })] }), _jsxs("div", { className: "mb-6", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3", children: "Select Duration" }), _jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsxs("div", { onClick: () => setSelectedDuration('1-day'), className: `border-2 p-3 rounded-xl cursor-pointer transition-all text-center ${selectedDuration === '1-day'
                                                ? selectedLevel === 'lv2' ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700'}`, children: [_jsx("div", { className: "font-bold text-sm dark:text-white", children: "1 Day" }), _jsxs("div", { className: `text-lg font-bold ${selectedLevel === 'lv2' ? 'text-purple-600' : 'text-blue-600'}`, children: ["\u20B9", pricing[selectedLevel]['1-day']] })] }), _jsxs("div", { onClick: () => setSelectedDuration('1-week'), className: `border-2 p-3 rounded-xl cursor-pointer transition-all text-center ${selectedDuration === '1-week'
                                                ? selectedLevel === 'lv2' ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700'}`, children: [_jsx("div", { className: "font-bold text-sm dark:text-white", children: "1 Week" }), _jsxs("div", { className: `text-lg font-bold ${selectedLevel === 'lv2' ? 'text-purple-600' : 'text-blue-600'}`, children: ["\u20B9", pricing[selectedLevel]['1-week']] })] }), _jsxs("div", { onClick: () => setSelectedDuration('1-month'), className: `border-2 p-3 rounded-xl cursor-pointer transition-all text-center ${selectedDuration === '1-month'
                                                ? selectedLevel === 'lv2' ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700'}`, children: [_jsx("div", { className: "font-bold text-sm dark:text-white", children: "1 Month" }), _jsxs("div", { className: `text-lg font-bold ${selectedLevel === 'lv2' ? 'text-purple-600' : 'text-blue-600'}`, children: ["\u20B9", pricing[selectedLevel]['1-month']] })] })] })] }), _jsx("div", { className: `mb-6 p-4 rounded-xl ${selectedLevel === 'lv2' ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`, children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("p", { className: "font-semibold dark:text-white", children: getPlanDisplayName() }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: selectedLevel === 'lv1' ? ' Basic animated overlays' : 'All premium overlays + priority support' })] }), _jsxs("div", { className: `text-2xl font-bold ${selectedLevel === 'lv2' ? 'text-purple-600' : 'text-blue-600'}`, children: ["\u20B9", getAmount()] })] }) }), _jsxs("div", { className: "flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-6", children: [_jsxs("button", { type: "button", onClick: () => setPaymentMethod('razorpay'), className: `flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${paymentMethod === 'razorpay' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 dark:text-gray-300'}`, children: [_jsx(Smartphone, { className: "w-4 h-4" }), " UPI / NetBanking"] }), _jsxs("button", { type: "button", onClick: () => setPaymentMethod('card'), className: `flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${paymentMethod === 'card' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 dark:text-gray-300'}`, children: [_jsx(CreditCard, { className: "w-4 h-4" }), " Card"] })] }), _jsxs("form", { onSubmit: handlePayment, className: "space-y-4", children: [paymentMethod === 'card' ? (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Card Number (Test: 8871474139)" }), _jsxs("div", { className: "relative", children: [_jsx(CreditCard, { className: "absolute left-3 top-3 w-5 h-5 text-gray-400" }), _jsx("input", { type: "text", value: cardNumber, onChange: (e) => setCardNumber(e.target.value.replace(/[^0-9A-Z]/gi, '').substring(0, 16)), placeholder: "0000 0000 0000 0000", className: "w-full pl-10 p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono uppercase", required: true })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx("input", { type: "text", placeholder: "MM/YY", value: expiry, onChange: (e) => setExpiry(e.target.value), className: "w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white", required: true }), _jsx("input", { type: "text", placeholder: "CVC", value: cvc, onChange: (e) => setCvc(e.target.value), className: "w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white", required: true })] })] })) : (_jsxs("div", { className: "text-center py-4 text-gray-500 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600", children: [_jsx("p", { className: "text-sm", children: "You will be redirected to Razorpay securely." }), _jsx("p", { className: "text-xs mt-1", children: "Supports GPay, PhonePe, Paytm & NetBanking" })] })), _jsx("button", { type: "submit", disabled: loading, className: `w-full mt-6 py-3 font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${selectedLevel === 'lv2'
                                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'}`, children: loading ? _jsx(Loader2, { className: "w-5 h-5 animate-spin" }) : `Pay ₹${getAmount()} Securely` })] })] })] }) }));
}
