import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// In src/components/TeamForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamAPI } from '../services/api';
export default function TeamForm() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        color: '',
        players: [{ name: '', role: '', jerseyNumber: '' }],
    });
    const [loading, setLoading] = useState(false);
    const addPlayer = () => {
        setFormData({
            ...formData,
            players: [...formData.players, { name: '', role: '', jerseyNumber: '' }],
        });
    };
    const updatePlayer = (index, field, value) => {
        const updatedPlayers = [...formData.players];
        updatedPlayers[index] = { ...updatedPlayers[index], [field]: value };
        setFormData({ ...formData, players: updatedPlayers });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            console.log('Submitting team data:', formData);
            const result = await teamAPI.createTeam(formData);
            console.log('Team created successfully:', result);
            alert('Team created!');
            // Use React Router navigation instead of window.location.href
            navigate('/teams');
        }
        catch (error) {
            console.error('Failed to create team:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error';
            // Show detailed error message
            alert(`Failed to create team: ${errorMessage}`);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "p-6", children: [_jsx("h2", { className: "text-2xl mb-4", children: "Create Team" }), _jsxs("form", { onSubmit: handleSubmit, className: "bg-white p-6 rounded shadow-md", children: [_jsx("input", { type: "text", placeholder: "Team Name", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), className: "w-full p-2 mb-4 border rounded", required: true }), _jsx("input", { type: "color", placeholder: "Color", value: formData.color, onChange: (e) => setFormData({ ...formData, color: e.target.value }), className: "w-full p-2 mb-4 border rounded", required: true }), _jsx("h3", { className: "text-lg mb-2", children: "Players" }), formData.players.map((player, index) => (_jsxs("div", { className: "mb-4 p-4 border rounded", children: [_jsx("input", { type: "text", placeholder: "Player Name", value: player.name, onChange: (e) => updatePlayer(index, 'name', e.target.value), className: "w-full p-2 mb-2 border rounded", required: true }), _jsx("input", { type: "text", placeholder: "Role (e.g., Batsman)", value: player.role, onChange: (e) => updatePlayer(index, 'role', e.target.value), className: "w-full p-2 mb-2 border rounded", required: true }), _jsx("input", { type: "number", placeholder: "Jersey Number", value: player.jerseyNumber, onChange: (e) => updatePlayer(index, 'jerseyNumber', e.target.value), className: "w-full p-2 mb-2 border rounded", required: true })] }, index))), _jsx("button", { type: "button", onClick: addPlayer, className: "bg-gray-500 text-white px-4 py-2 rounded mr-2", children: "Add Player" }), _jsx("button", { type: "submit", disabled: loading, className: "bg-blue-500 text-white px-4 py-2 rounded", children: loading ? 'Creating...' : 'Create Team' })] })] }));
}
