import { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  TouchSensor,
  useSensor, 
  useSensors, 
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trophy, GripVertical, Save } from 'lucide-react';
import { tournamentAPI, bracketAPI } from '../services/api';
import { Tournament, Team } from './types';

// Sortable Team Item Component
function SortableTeam({ id, team, index }: { id: string; team: Team; index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex items-center justify-between p-3 mb-2 bg-white dark:bg-gray-700 rounded-lg border ${isDragging ? 'border-blue-500 shadow-lg' : 'border-gray-200 dark:border-gray-600'}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-gray-400 font-mono text-sm w-6">#{index + 1}</span>
        <span className="font-medium text-gray-900 dark:text-white">{team.name}</span>
      </div>
      <div {...attributes} {...listeners} className="cursor-grab touch-none p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
        <GripVertical className="h-5 w-5 text-gray-400" />
      </div>
    </div>
  );
}

export default function BracketView() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [bracketTeams, setBracketTeams] = useState<Team[]>([]);
  const [isLoading, setLoading] = useState(false);

  // Sensors for Drag and Drop (Mouse, Touch, Keyboard)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor), 
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const res = await tournamentAPI.getTournaments();
      setTournaments(res.data.tournaments || []);
    } catch (e) {
      console.error("Failed to load tournaments");
    }
  };

  const handleTournamentSelect = async (tId: string) => {
    if (!tId) return;
    setLoading(true);
    try {
      const res = await tournamentAPI.getTournament(tId);
      const tData = res.data;
      setSelectedTournament(tData);
      // Initialize bracket with team list
      setBracketTeams(tData.teams || []);
    } catch (e) {
      console.error("Failed to load details");
    } finally {
      setLoading(false);
    }
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
      // Logic to save the reordered teams as the seed order
      // This is a simplified example assuming backend endpoint exists
      await bracketAPI.updateBracket(selectedTournament._id, { 
          teams: bracketTeams.map(t => t._id) 
      });
      alert("Bracket seeding saved!");
    } catch (e) {
      alert("Failed to save bracket");
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 dark:text-white">
            <Trophy className="text-yellow-500" /> Tournament Brackets
        </h1>

        {/* Selection */}
        <div className="mb-8">
            <select 
                className="w-full md:w-1/3 p-3 rounded-lg border dark:bg-gray-800 dark:text-white"
                onChange={(e) => handleTournamentSelect(e.target.value)}
            >
                <option value="">Select a Tournament</option>
                {tournaments.map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                ))}
            </select>
        </div>

        {selectedTournament && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Drag & Drop Area */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-700 dark:text-gray-300">Seed Teams</h3>
                        <span className="text-xs text-gray-500">Drag to reorder</span>
                    </div>
                    
                    <DndContext 
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext 
                            items={bracketTeams.map(t => t._id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-2">
                                {bracketTeams.map((team, index) => (
                                    <SortableTeam 
                                        key={team._id} 
                                        id={team._id} 
                                        team={team} 
                                        index={index} 
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>

                    <button 
                        onClick={saveBracket}
                        className="mt-6 w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" /> Save Seeding
                    </button>
                </div>

                {/* Preview Area (Simple Knockout Visualization) */}
                <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                        <Trophy className="w-16 h-16 mx-auto mb-2 opacity-20" />
                        <p>Bracket Preview Visualization</p>
                        <p className="text-sm opacity-60">(Generates after saving seeds)</p>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}