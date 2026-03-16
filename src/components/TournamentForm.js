import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentAPI, teamAPI } from '../services/api';
import { Calendar, Trophy, CheckCircle, Lock } from 'lucide-react';
import Membership from './Membership';
export default function TournamentForm() {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        format: 'T20',
        selectedTeams: [],
    });
    const [availableTeams, setAvailableTeams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPayment, setShowPayment] = useState(false);
    const [membershipStatus, setMembershipStatus] = useState('free');
    const navigate = useNavigate();
    // Check membership status on component mount
    useEffect(() => {
        const checkMembership = () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    const membership = payload.membership || 'free';
                    // Check if membership has expired
                    if (payload.membershipExpiresAt) {
                        const expiryDate = new Date(payload.membershipExpiresAt);
                        if (expiryDate < new Date()) {
                            // Membership has expired
                            setMembershipStatus('free');
                            return;
                        }
                    }
                    setMembershipStatus(membership);
                }
                catch (error) {
                    console.error('Error parsing token:', error);
                    setMembershipStatus('free');
                }
            }
            else {
                setMembershipStatus('free');
            }
        };
        checkMembership();
    }, []);
    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const res = await teamAPI.getTeams();
                // Handle both array and object response formats
                const teams = Array.isArray(res.data) ? res.data : res.data.teams || [];
                setAvailableTeams(teams);
            }
            catch (error) {
                console.error("Failed to load teams:", error);
                setAvailableTeams([]);
            }
        };
        fetchTeams();
    }, []);
    const handleTeamToggle = (teamId) => {
        setFormData(prev => ({
            ...prev,
            selectedTeams: prev.selectedTeams.includes(teamId)
                ? prev.selectedTeams.filter(id => id !== teamId)
                : [...prev.selectedTeams, teamId]
        }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // Map frontend fields to backend API expected fields
            // Backend expects lowercase: locationType ('indoor', 'outdoor', 'both')
            // type ('round_robin', 'knockout', 'double_elimination', 'league', 'group_stage')
            const payload = {
                name: formData.name,
                description: formData.description,
                startDate: formData.startDate,
                endDate: formData.endDate,
                organizer: 'Local',
                location: 'Stadium',
                // Don't send locationType and type - let backend use defaults
                teams: formData.selectedTeams
            };
            console.log('Creating tournament with payload:', payload);
            console.log('Full payload details:', JSON.stringify(payload, null, 2));
            const res = await tournamentAPI.createTournament(payload);
            console.log('Tournament created successfully:', res.data);
            // Navigate to tournaments list
            navigate('/tournaments');
        }
        catch (err) {
            console.error('Failed to create tournament:', err);
            console.error('Error response:', err.response?.data);
            // Show more detailed error message
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            }
            else if (err.response?.data?.errors) {
                // Handle Zod validation errors array
                const errorMessages = err.response.data.errors.map((e) => `${e.field}: ${e.message}`).join(', ');
                setError(errorMessages);
            }
            else if (err.message) {
                setError(err.message);
            }
            else {
                setError('Failed to create tournament. Please try again.');
            }
        }
        finally {
            setLoading(false);
        }
    };
    // Show error alert
    useEffect(() => {
        if (error) {
            alert(error);
            setError(null);
        }
    }, [error]);
    // Show payment modal if user needs to upgrade
    if (showPayment) {
        return _jsx(Membership, {});
    }
    // Check if user has premium membership - if not, prompt for upgrade
    const requiresPremium = membershipStatus === 'free';
    const handleUpgradeClick = () => {
        setShowPayment(true);
    };
    // Has access - show form
    return (_jsx("div", { className: "p-6 bg-gray-50 dark:bg-gray-900 min-h-screen", children: _jsxs("div", { className: "max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden", children: [_jsx("div", { className: "bg-gradient-to-r from-green-600 to-emerald-700 p-6 text-white", children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-2xl font-bold flex items-center gap-2", children: [_jsx(Trophy, { className: "w-6 h-6" }), " Create Tournament"] }), _jsx("p", { className: "text-green-100 opacity-90", children: "Setup a new league or series" })] }), requiresPremium && (_jsxs("button", { onClick: handleUpgradeClick, className: "flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-md", children: [_jsx(Lock, { className: "w-4 h-4" }), "Upgrade to Premium"] })), !requiresPremium && membershipStatus === 'basic' && (_jsx("span", { className: "bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium", children: "Basic Plan" })), !requiresPremium && membershipStatus === 'premium' && (_jsx("span", { className: "bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium", children: "Premium Plan" }))] }) }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Tournament Name" }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), className: "w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white", placeholder: "Ex: Premier League 2024", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Start Date" }), _jsxs("div", { className: "relative", children: [_jsx(Calendar, { className: "absolute left-3 top-3 w-5 h-5 text-gray-400" }), _jsx("input", { type: "date", value: formData.startDate, onChange: (e) => setFormData({ ...formData, startDate: e.target.value }), className: "w-full pl-10 p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white", required: true })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "End Date (Optional)" }), _jsx("input", { type: "date", value: formData.endDate, onChange: (e) => setFormData({ ...formData, endDate: e.target.value }), className: "w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Format" }), _jsxs("select", { value: formData.format, onChange: (e) => setFormData({ ...formData, format: e.target.value }), className: "w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white", children: [_jsx("option", { value: "T20", children: "T20" }), _jsx("option", { value: "ODI", children: "ODI" }), _jsx("option", { value: "Test", children: "Test Match" })] })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex justify-between", children: [_jsx("span", { children: "Select Teams" }), _jsxs("span", { className: "text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full", children: [formData.selectedTeams.length, " Selected"] })] }), availableTeams.length > 0 ? (_jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto border p-3 rounded-lg dark:border-gray-600", children: availableTeams.map(team => (_jsxs("div", { onClick: () => handleTeamToggle(team._id), className: `p-3 rounded-lg cursor-pointer border transition-all flex items-center justify-between ${formData.selectedTeams.includes(team._id)
                                            ? 'bg-green-50 border-green-500 dark:bg-green-900/30'
                                            : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600'}`, children: [_jsx("span", { className: "font-medium dark:text-white truncate", children: team.name }), formData.selectedTeams.includes(team._id) && _jsx(CheckCircle, { className: "w-4 h-4 text-green-600" })] }, team._id))) })) : (_jsx("div", { className: "p-4 text-center text-gray-500 dark:text-gray-400 border rounded-lg", children: "No teams available. You can create a tournament without teams." }))] }), _jsxs("div", { className: "pt-4 border-t dark:border-gray-700 flex justify-end gap-3", children: [_jsx("button", { type: "button", onClick: () => navigate('/tournaments'), className: "px-6 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700", children: "Cancel" }), _jsx("button", { type: "submit", disabled: loading, className: "px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all shadow-md disabled:opacity-50", children: loading ? 'Creating...' : 'Create Tournament' })] })] })] }) }));
}
