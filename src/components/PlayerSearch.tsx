import { useState, useRef, useCallback } from 'react';
import { userAPI } from '../services/api';
import { Search, Loader2, UserPlus, X, Mail } from 'lucide-react';

interface User {
  _id: string;
  username: string;
  email?: string;
  fullName?: string;
  avatar?: string;
}

interface PlayerSearchProps {
  onSelect: (user: User) => void;
  excludeIds?: string[];
  placeholder?: string;
}

export default function PlayerSearch({
  onSelect,
  excludeIds = [],
  placeholder = 'Search by username or email...',
}: PlayerSearchProps) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen]   = useState(false);
  const [error, setError]     = useState('');
  const debounceRef           = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (val: string) => {
    if (val.length < 2) { setResults([]); setIsOpen(false); return; }
    setLoading(true);
    setError('');
    try {
      const res = await userAPI.searchUsers(val);
      // ✅ FIX: backend returns { success, data: [...] } not { users: [...] }
      const users: User[] = res.data.data || res.data.users || [];
      setResults(users.filter(u => !excludeIds.includes(u._id)));
      setIsOpen(true);
    } catch (e) {
      setError('Search failed. Try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [excludeIds]);

  const handleChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 2) { setResults([]); setIsOpen(false); return; }
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  const handleSelect = (user: User) => {
    onSelect(user);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--bg-elevated)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-green-500/40 focus:border-green-500/50 outline-none text-sm transition-all"
        />
        {query && (
          <button
            onMouseDown={e => { e.preventDefault(); handleClear(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-700 transition-all"
          >
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-[var(--bg-card)] rounded-xl shadow-2xl border border-[var(--border)] overflow-hidden">
          {loading ? (
            <div className="p-4 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin text-green-500" />
              Searching...
            </div>
          ) : error ? (
            <div className="p-3 text-center text-xs text-red-400">{error}</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No users found for <span className="text-white font-bold">"{query}"</span>
            </div>
          ) : (
            <ul className="max-h-56 overflow-y-auto divide-y divide-[var(--border)]">
              {results.map(user => (
                <li
                  key={user._id}
                  onMouseDown={e => { e.preventDefault(); handleSelect(user); }}
                  className="flex items-center justify-between px-3 py-2.5 hover:bg-[var(--bg-elevated)] cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20 flex items-center justify-center text-xs font-black text-green-400 flex-shrink-0">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[var(--text-primary)] truncate">{user.username}</p>
                      {/* ✅ Show email so user can confirm they picked the right person */}
                      {user.email && (
                        <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          {user.email}
                        </p>
                      )}
                      {user.fullName && !user.email && (
                        <p className="text-[11px] text-[var(--text-muted)] truncate">{user.fullName}</p>
                      )}
                    </div>
                  </div>
                  <UserPlus className="w-4 h-4 text-green-400 flex-shrink-0 ml-2" />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}