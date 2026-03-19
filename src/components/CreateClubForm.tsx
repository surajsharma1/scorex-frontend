import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clubAPI } from '../services/api';
import { useAuth } from '../App';
import { useToast } from '../hooks/useToast';

const CreateClubForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'public' as 'public' | 'initiation_required',
    location: '',
  });
  
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Create club first
      const clubRes = await clubAPI.createClub(formData);
      if (!clubRes.data.success) throw new Error('Failed to create club');
      
      const clubId = clubRes.data.data._id;
      
      // Upload logo if selected
      if (logoFile) {
        await clubAPI.uploadLogo(clubId, logoFile);
      }
      
      // Upload banner if selected
      if (bannerFile) {
        await clubAPI.uploadBanner(clubId, bannerFile);
      }
      
      addToast({
        type: 'success',
        title: 'Club Created!',
        message: 'Your club has been created successfully!'
      });
      navigate('/clubs?tab=my');
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create club'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        setLogoFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
        setBannerFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>
            Create New Club
          </h1>
          <p className="text-xl" style={{ color: 'var(--text-muted)' }}>
            Build your sports community
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] rounded-3xl p-12 border border-[var(--border)] shadow-2xl">
          {/* Club name */}
          <div className="mb-8">
            <label className="block text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Club Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-6 py-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] focus:ring-2 focus:ring-green-500/30 focus:border-transparent transition-all text-lg"
              placeholder="e.g., FC Barcelona Fans"
              style={{ color: 'var(--text-primary)' }}
              required
            />
          </div>

          {/* Description */}
          <div className="mb-8">
            <label className="block text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Description *
            </label>
            <textarea
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-6 py-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] focus:ring-2 focus:ring-green-500/30 focus:border-transparent transition-all resize-vertical text-lg"
              placeholder="Tell us about your club - sports, location, goals..."
              style={{ color: 'var(--text-primary)' }}
              required
            />
          </div>

          {/* Images */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Logo */}
            <div>
              <label className="block text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Club Logo
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="w-full px-6 py-5 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-secondary)] hover:border-green-500/50 transition-all cursor-pointer"
                  style={{ color: 'var(--text-primary)' }}
                />
                {logoPreview && (
                  <img 
                    src={logoPreview} 
                    alt="Logo preview" 
                    className="mt-4 w-32 h-32 rounded-2xl object-cover shadow-lg mx-auto"
                  />
                )}
              </div>
              <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
                Recommended: 128x128px square
              </p>
            </div>

            {/* Banner */}
            <div>
              <label className="block text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Club Banner
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  className="w-full px-6 py-5 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-secondary)] hover:border-green-500/50 transition-all cursor-pointer"
                  style={{ color: 'var(--text-primary)' }}
                />
                {bannerPreview && (
                  <img 
                    src={bannerPreview} 
                    alt="Banner preview" 
                    className="mt-4 w-full h-32 rounded-2xl object-cover shadow-lg"
                  />
                )}
              </div>
              <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
                Recommended: 1200x300px wide
              </p>
            </div>
          </div>

          {/* Settings */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Type */}
            <div>
              <label className="block text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Club Type *
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border border-[var(--border)] rounded-2xl hover:bg-[var(--bg-hover)] cursor-pointer transition-all">
                  <input
                    type="radio"
                    name="type"
                    value="public"
                    checked={formData.type === 'public'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-5 h-5 text-green-500 focus:ring-green-500"
                  />
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>Public Club</div>
                    <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Anyone can join instantly</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 border border-[var(--border)] rounded-2xl hover:bg-[var(--bg-hover)] cursor-pointer transition-all bg-orange-500/5 border-orange-500/20">
                  <input
                    type="radio"
                    name="type"
                    value="initiation_required"
                    checked={formData.type === 'initiation_required'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-5 h-5 text-orange-500 focus:ring-orange-500"
                  />
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>Private Club</div>
                    <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Manual approval required</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Location (Optional)
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-6 py-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] focus:ring-2 focus:ring-green-500/30 focus:border-transparent transition-all"
                placeholder="e.g., Mumbai, India"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-8 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => navigate('/clubs')}
              className="flex-1 px-8 py-5 border border-[var(--border)] font-bold rounded-2xl hover:bg-[var(--bg-hover)] transition-all text-lg"
              style={{ color: 'var(--text-primary)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="flex-1 px-8 py-5 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-green-500/25 transform hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Club'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateClubForm;

