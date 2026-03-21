import React, { useRef, useState } from 'react';

interface SimpleInputFormProps {
  onSubmit: (data: { name: string; shortName?: string; role?: string }) => Promise<void>;
  isTeam?: boolean;
  saving: boolean;
  error: string;
  onCancel: () => void;
  initialData?: { name: string; shortName?: string; role?: string };
}

export default function SimpleInputForm({ 
  onSubmit, 
  isTeam = false, 
  saving, 
  error, 
  onCancel,
  initialData = { name: '' }
}: SimpleInputFormProps) {
  const nameRef = useRef<HTMLInputElement>(null);
  const shortNameRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLSelectElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = nameRef.current?.value.trim();
    if (!name) return;
    
    const data: any = { name };
    if (isTeam && shortNameRef.current) {
      data.shortName = shortNameRef.current.value.trim();
      if (!data.shortName) return;
    }
    if (!isTeam && roleRef.current) {
      data.role = roleRef.current.value;
    }
    
    try {
      await onSubmit(data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
        {isTeam ? 'Create New Team' : 'Add Player'}
      </h3>
      
      {error && (
        <div className="text-sm text-red-400 bg-red-900/20 p-3 rounded-xl border border-red-500/30">
          {error}
        </div>
      )}
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Name
          </label>
          <input 
            ref={nameRef}
            defaultValue={initialData.name}
            className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30 focus-visible:border-[var(--accent)] transition-all border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
            placeholder={isTeam ? "Team Name (e.g. Mumbai Indians)" : "Player Name"} 
            required
            autoFocus
          />
        </div>
        
        {isTeam && (
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Short Name
            </label>
            <input 
              ref={shortNameRef}
              defaultValue={initialData.shortName || ''}
              maxLength={4}
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30 focus-visible:border-[var(--accent)] transition-all border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
              placeholder="MI" 
              required
            />
          </div>
        )}
        
        {!isTeam && (
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Role
            </label>
            <select 
              ref={roleRef}
              defaultValue={initialData.role || 'batsman'}
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none" 
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              <option value="batsman">Batsman</option>
              <option value="bowler">Bowler</option>
              <option value="all-rounder">All Rounder</option>
              <option value="wicket-keeper">Wicket Keeper</option>
            </select>
          </div>
        )}
      </div>
      
      <div className="flex gap-3 pt-2">
        <button 
          type="submit" 
          disabled={saving} 
          className="flex-1 px-6 py-2.5 rounded-xl font-bold text-sm transition-all"
          style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000' }}
        >
          {saving ? 'Saving...' : isTeam ? 'Save Team' : 'Add Player'}
        </button>
        <button 
          type="button" 
          onClick={onCancel}
          className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

