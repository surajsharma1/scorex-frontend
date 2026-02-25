import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Club } from './types';
import { clubAPI } from '../services/api';
import { Users, Plus, Loader, Crown } from 'lucide-react';

export default function ClubManagement() {
// Translation hook available if needed later
  const [clubs, setClubs] = useState<Club[]>([]);
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'explore' | 'my'>('explore');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newClub, setNewClub] = useState({ name: '', description: '' });

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    setLoading(true);
    try {
      const [allRes, myRes] = await Promise.all([
          clubAPI.getClubs(),
          clubAPI.getMyClubs()
      ]);
      setClubs(allRes.data.clubs || []);
      setMyClubs(myRes.data.clubs || []);
    } catch (err) {
      console.error("Failed to load clubs");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClub = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          await clubAPI.createClub(newClub);
          setShowCreateForm(false);
          setNewClub({ name: '', description: '' });
          loadClubs();
      } catch (e) {
          alert("Failed to create club");
      }
  };

  const handleJoinClub = async (id: string) => {
      try {
          await clubAPI.joinClub(id);
          loadClubs(); // Refresh to update status
          alert("Joined club successfully!");
      } catch (e) {
          alert("Failed to join club");
      }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold flex items-center gap-2 dark:text-white">
                <Users className="text-blue-500" /> Cricket Clubs
            </h1>
            <button 
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
            >
                <Plus className="w-4 h-4" /> Create Club
            </button>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 border-b border-gray-200 dark:border-gray-700">
            <button
                onClick={() => setActiveTab('explore')}
                className={`px-6 py-3 font-medium ${activeTab === 'explore' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
                Explore Clubs
            </button>
            <button
                onClick={() => setActiveTab('my')}
                className={`px-6 py-3 font-medium ${activeTab === 'my' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
                My Clubs ({myClubs.length})
            </button>
        </div>

        {loading ? <div className="p-10 text-center"><Loader className="animate-spin mx-auto" /></div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(activeTab === 'explore' ? clubs : myClubs).map(club => (
                    <div key={club._id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xl font-bold text-blue-600">
                                {club.name.charAt(0)}
                            </div>
                            {activeTab === 'explore' && !myClubs.find(c => c._id === club._id) && (
                                <button 
                                    onClick={() => handleJoinClub(club._id)}
                                    className="text-sm bg-gray-100 dark:bg-gray-700 hover:bg-green-100 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full transition"
                                >
                                    Join
                                </button>
                            )}
                            {activeTab === 'my' && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Member</span>
                            )}
                        </div>
                        <h3 className="text-xl font-bold dark:text-white mb-2">{club.name}</h3>
                        <p className="text-gray-500 text-sm mb-4 line-clamp-2">{club.description || 'No description provided.'}</p>
                        <div className="flex items-center text-xs text-gray-400 gap-4">
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {club.members?.length || 0} Members</span>
                            <span className="flex items-center gap-1"><Crown className="w-3 h-3" /> Admin</span>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* Create Modal */}
        {showCreateForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md">
                    <h3 className="text-xl font-bold mb-4 dark:text-white">Create New Club</h3>
                    <form onSubmit={handleCreateClub} className="space-y-4">
                        <input 
                            placeholder="Club Name"
                            value={newClub.name}
                            onChange={e => setNewClub({...newClub, name: e.target.value})}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                        />
                        <textarea 
                            placeholder="Description"
                            value={newClub.description}
                            onChange={e => setNewClub({...newClub, description: e.target.value})}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white h-24"
                        />
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setShowCreateForm(false)} className="flex-1 py-2 bg-gray-200 rounded">Cancel</button>
                            <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded font-bold">Create</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
}