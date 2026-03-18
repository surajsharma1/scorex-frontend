import { useState, useEffect } from 'react';
import { 
  DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor,
  useSensor, useSensors, DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trophy, GripVertical, Save, ChevronDown } from 'lucide-react';
import { tournamentAPI, bracketAPI } from '../services/api';
import { Tournament, Team } from './types';

// Sortable Team Item Component
function SortableTeam({ id, team, index }: { id: string; team: Team; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1
  };

  return (
    <div 
      ref={setNodeRef}
      className={`flex items-center justify-between p-4 mb-3 rounded-xl transition-all ${isDragging ? 'shadow-2xl scale-[1.02]' : ''}`}
      // Using global theme variables for the drag items
      style={{ 
        ...style, 
        background: 'var(--bg-elevated)', 
        border: `1px solid ${isDragging ? '#22c55e' : 'var(--border)'}`,
        boxShadow: isDragging ? '0 8px 32px rgba(34,197,94,0.15)' : 'none'
      }}>
      <div className="flex items-center gap-4">

        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs"
             style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
          {index + 1}
        </div>
        <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{team.name}</span>
      </div>
      <div {...attributes} {...listeners} className="cursor-grab touch-none p-2 rounded-lg hover:bg-white/5 transition-colors">
        <GripVertical className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
      </div>
    </div>
  );
}

export default function BracketView() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [bracketTeams, setBracketTeams] = useState<Team[]>([]);
  const [isLoading, setLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor), 
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { loadTournaments(); }, []);

  const loadTournaments = async () => {
    try {
      const res = await tournamentAPI.getTournaments();
      setTournaments(res.data.tournaments || res.data.data || res.data || []);
    } catch (e) { console.error("Failed to load tournaments"); }
  };

  const handleTournamentSelect = async (tId: string) => {
    if (!tId) return;
    setLoading(true);
    try {
      const res = await tournamentAPI.getTournament(tId);
      const tData = res.data.data || res.data;
      setSelectedTournament(tData);
      setBracketTeams(tData.teams || []);
    } catch (e) { console.error("Failed to load details"); } 
    finally { setLoading(false); }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setBracketTeams((items) => {
        const oldIndex = items.findIndex(item => item._id === active.id);
        const newIndex = items.findIndex(item => item._id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const saveBracket = async () => {
    if (!selectedTournament) return;
    try {
      await bracketAPI.updateBracket(selectedTournament._id, { teams: bracketTeams.map(t => t._id) });
      alert("Bracket seeding saved!");
    } catch (e) { alert("Failed to save bracket"); }
  };

  return (
    <div className="p-6 max-w-6xl relative min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        {/* Background Orb */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%)' }} />

        {/* Header & Green Selection Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-green-400 to-emerald-600" />
                <h1 className="text-3xl font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Trophy className="w-8 h-8 text-green-400" /> Tournament Brackets
                </h1>
              </div>
              <p className="ml-5 text-sm" style={{ color: 'var(--text-muted)' }}>Manage your knockout seeding</p>
            </div>

            {/* GREEN SELECT BUTTON TRICK */}
            <div className="relative group cursor-pointer w-full sm:w-auto">
              <div className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg"
                   style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000', boxShadow: '0 0 16px rgba(34,197,94,0.3)' }}>
                Select Tournament <ChevronDown className="w-4 h-4" />
              </div>
              <select 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
                onChange={(e) => handleTournamentSelect(e.target.value)}
              >
                <option value="">Select a Tournament</option>
                {tournaments.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-20 relative z-10">
            <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          </div>
        )}

        {/* Main Content Area */}
        {selectedTournament && !isLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                {/* Drag & Drop Area */}
                <div className="p-6 rounded-2xl shadow-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                        <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Seed Teams</h3>
                        <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>Drag to reorder</span>
                    </div>
                    
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={bracketTeams.map(t => t._id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-1">
                                {bracketTeams.map((team, index) => (
                                    <SortableTeam key={team._id} id={team._id} team={team} index={index} />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>

                    <button 
                        onClick={saveBracket}
                        className="mt-6 w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000', boxShadow: '0 0 20px rgba(34,197,94,0.2)' }}
                    >
                        <Save className="w-4 h-4" /> Save Seeding
                    </button>
                </div>

                {/* Preview Area */}
                <div className="p-8 rounded-2xl border-2 border-dashed flex items-center justify-center text-center"
                     style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'var(--border)' }}>
                    <div>
                        <Trophy className="w-20 h-20 mx-auto mb-4 opacity-20" style={{ color: 'var(--text-primary)' }} />
                        <p className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Bracket Preview Visualization</p>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>(Generates automatically after saving seeds)</p>
                    </div>
                </div>
            </div>
        )}

        {!selectedTournament && !isLoading && (
           <div className="text-center py-20 rounded-3xl relative z-10" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
             <Trophy className="w-16 h-16 opacity-20 mx-auto mb-4" style={{ color: 'var(--text-primary)' }} />
             <p className="font-semibold text-lg" style={{ color: 'var(--text-muted)' }}>Use the green button above to select a tournament</p>
           </div>
        )}
    </div>
  );
}