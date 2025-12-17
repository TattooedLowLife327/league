import { useState } from "react";
import { ChevronLeft, ChevronRight, CheckmarkOutline, Close } from "@carbon/icons-react";
import { Edit, Save, Shield, Megaphone, MessageCircle } from "lucide-react";

// Admin data - Replace with your API data
const pendingApprovals: any[] = []; // Players awaiting approval
const allPlayers: any[] = [
  {
    id: "player1",
    name: "Alex Thunder",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    division: "Division 1",
    wins: 8,
    losses: 2,
    points: 24,
    overall_numeric: 9.2,
    is_division_leader: true,
    is_dqd: false,
  },
  {
    id: "player2",
    name: "Jordan Steel",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    division: "Division 1",
    wins: 6,
    losses: 4,
    points: 18,
    overall_numeric: 8.7,
    is_division_leader: false,
    is_dqd: false,
  },
  {
    id: "player3",
    name: "Chris Viper",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop",
    division: "Division 2",
    wins: 5,
    losses: 3,
    points: 15,
    overall_numeric: 7.8,
    is_division_leader: true,
    is_dqd: false,
  },
  {
    id: "player4",
    name: "Sam Phoenix",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    division: "Division 3",
    wins: 7,
    losses: 1,
    points: 21,
    overall_numeric: 8.5,
    is_division_leader: true,
    is_dqd: false,
  },
  {
    id: "player5",
    name: "Taylor Blaze",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    division: "Division 4",
    wins: 4,
    losses: 6,
    points: 12,
    overall_numeric: 7.2,
    is_division_leader: true,
    is_dqd: false,
  },
]; // All approved players with divisions
const alternates: any[] = []; // Waitlist/substitute players

// League status - Replace with your API data
const leagueStatus = {
  hasStarted: false, // Set to true once league starts to hide pending approvals
};

// Divisions data - Replace with your API data
const divisions: any[] = [
  { id: "div1", name: "Division 1", playerCount: 12, color: "blue" },
  { id: "div2", name: "Division 2", playerCount: 10, color: "purple" },
  { id: "div3", name: "Division 3", playerCount: 11, color: "green" },
  { id: "div4", name: "Division 4", playerCount: 9, color: "orange" },
]; // Array of { id, name, playerCount, color }

export function ManagementWidget({ divisionColors }: { divisionColors: Record<string, string> }) {
  const [activeTab, setActiveTab] = useState<"pending" | "players" | "alternates">(leagueStatus.hasStarted ? "players" : "pending");
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [expandedDivision, setExpandedDivision] = useState<string | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<any | null>(null);
  const [editValues, setEditValues] = useState<{ wins: number; losses: number; points: number }>({ wins: 0, losses: 0, points: 0 });
  const [dqModalPlayer, setDqModalPlayer] = useState<any | null>(null);
  const [dqReason, setDqReason] = useState("");
  const [forfeitModalPlayer, setForfeitModalPlayer] = useState<any | null>(null);
  const [forfeitReason, setForfeitReason] = useState("");
  const [messageModalPlayer, setMessageModalPlayer] = useState<any | null>(null);

  // Group players by division
  const playersByDivision = allPlayers.reduce((acc: any, player: any) => {
    if (!acc[player.division]) {
      acc[player.division] = [];
    }
    acc[player.division].push(player);
    return acc;
  }, {});

  const suggestDivision = (rating: number) => {
    if (rating >= 9.0) return "Premier";
    if (rating >= 8.0) return "Elite";
    if (rating >= 7.0) return "Advanced";
    return "Open";
  };

  const getDivisionColorClasses = (divisionName: string) => {
    const division = divisions.find(d => d.name === divisionName);
    if (!division) return "";
    
    const currentColor = divisionColors[division.id] || division.color;
    
    // Check if it's a hue value
    if (currentColor.startsWith('hue-')) {
      return `hue-color-${currentColor}`;
    }
    
    const colorMap: Record<string, string> = {
      blue: "bg-blue-500/10 border-l-2 border-l-blue-500/50",
      purple: "bg-purple-500/10 border-l-2 border-l-purple-500/50",
      green: "bg-green-500/10 border-l-2 border-l-green-500/50",
      orange: "bg-orange-500/10 border-l-2 border-l-orange-500/50",
      red: "bg-red-500/10 border-l-2 border-l-red-500/50",
      yellow: "bg-yellow-500/10 border-l-2 border-l-yellow-500/50",
      pink: "bg-pink-500/10 border-l-2 border-l-pink-500/50",
      cyan: "bg-cyan-500/10 border-l-2 border-l-cyan-500/50",
      indigo: "bg-indigo-500/10 border-l-2 border-l-indigo-500/50",
      lime: "bg-lime-500/10 border-l-2 border-l-lime-500/50",
      teal: "bg-teal-500/10 border-l-2 border-l-teal-500/50",
      fuchsia: "bg-fuchsia-500/10 border-l-2 border-l-fuchsia-500/50",
    };
    
    return colorMap[currentColor] || "";
  };

  return (
    <div className="bg-[#000000] rounded-2xl border border-neutral-800 overflow-hidden flex-1">
      {/* Widget Header */}
      <div className="flex items-center justify-center px-4 py-3 border-b border-neutral-800">
        <div className="font-['Lexend:SemiBold',_sans-serif] text-[13px] text-neutral-50">
          MANAGEMENT
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-neutral-800">
        {!leagueStatus.hasStarted && (
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex-1 px-4 py-3 font-['Lexend:Regular',_sans-serif] text-[11px] transition-colors ${
              activeTab === "pending"
                ? "bg-neutral-900 text-neutral-50"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Pending {pendingApprovals.length > 0 && (
              <span className="ml-1 bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full text-[9px]">
                {pendingApprovals.length}
              </span>
            )}
          </button>
        )}
        <button
          onClick={() => setActiveTab("players")}
          className={`flex-1 px-4 py-3 font-['Lexend:Regular',_sans-serif] text-[11px] transition-colors ${
            activeTab === "players"
              ? "bg-neutral-900 text-neutral-50"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Players
        </button>
        <button
          onClick={() => setActiveTab("alternates")}
          className={`flex-1 px-4 py-3 font-['Lexend:Regular',_sans-serif] text-[11px] transition-colors ${
            activeTab === "alternates"
              ? "bg-neutral-900 text-neutral-50"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Alternates
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto h-[calc(600px-120px)] p-4">
        {activeTab === "pending" && !leagueStatus.hasStarted && (
          <div className="space-y-3">
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-8">
                <div className="font-['Lexend:Regular',_sans-serif] text-[12px] text-neutral-500">
                  No pending approvals
                </div>
              </div>
            ) : (
              pendingApprovals.map((player) => (
                <div key={player.id} className="bg-neutral-900 rounded-lg p-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative size-10 rounded-full overflow-hidden bg-neutral-800 shrink-0">
                      <img src={player.avatar} alt={player.name} className="size-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="font-['Lexend:SemiBold',_sans-serif] text-[12px] text-neutral-50">
                        {player.name}
                      </div>
                      <div className="font-['Lexend:Regular',_sans-serif] text-[10px] text-neutral-400">
                        Rating: {player.overall_numeric} • {player.submitted_date}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select 
                      className="flex-1 bg-neutral-800 text-neutral-200 rounded px-2 py-1.5 font-['Lexend:Regular',_sans-serif] text-[11px] border border-neutral-700"
                      defaultValue={suggestDivision(player.overall_numeric)}
                    >
                      <option value="Premier">Premier</option>
                      <option value="Elite">Elite</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Open">Open</option>
                    </select>
                    <button className="bg-green-600/80 hover:bg-green-600 p-2 rounded-lg transition-colors">
                      <CheckmarkOutline size={16} className="text-white" />
                    </button>
                    <button className="bg-red-600/80 hover:bg-red-600 p-2 rounded-lg transition-colors">
                      <Close size={16} className="text-white" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "players" && (
          <div className="space-y-3">
            {Object.keys(playersByDivision).length === 0 ? (
              <div className="text-center py-8">
                <div className="font-['Lexend:Regular',_sans-serif] text-[12px] text-neutral-500">
                  No players yet
                </div>
              </div>
            ) : (
              Object.entries(playersByDivision).map(([division, players]: [string, any]) => (
                <div key={division} className="bg-neutral-900 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedDivision(expandedDivision === division ? null : division)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-800 transition-colors"
                  >
                    <div className="font-['Lexend:SemiBold',_sans-serif] text-[12px] text-neutral-50">
                      {division} <span className="text-neutral-500">({players.length})</span>
                    </div>
                    {expandedDivision === division ? <ChevronLeft size={16} className="text-neutral-400 rotate-90" /> : <ChevronRight size={16} className="text-neutral-400" />}
                  </button>
                  {expandedDivision === division && (
                    <div className="border-t border-neutral-800">
                      {players.map((player: any) => {
                        const division = divisions.find(d => d.name === player.division);
                        const currentColor = division ? (divisionColors[division.id] || division.color) : '';
                        const isHueColor = currentColor.startsWith('hue-');
                        const hueValue = isHueColor ? parseInt(currentColor.replace('hue-', '')) : null;
                        
                        const baseClasses = `border-b border-neutral-800 last:border-0 ${player.is_dqd ? 'opacity-50' : ''}`;
                        const colorClasses = !isHueColor ? getDivisionColorClasses(player.division) : 'border-l-2';
                        
                        return (
                        <div 
                          key={player.id} 
                          className={`${baseClasses} ${colorClasses}`}
                          style={isHueColor ? {
                            backgroundColor: `hsl(${hueValue}, 70%, 55%, 0.1)`,
                            borderLeftColor: `hsl(${hueValue}, 70%, 55%, 0.5)`
                          } : {}}
                        >
                          <button
                            onClick={() => setSelectedPlayer(selectedPlayer?.id === player.id ? null : player)}
                            className="w-full px-4 py-2 flex items-center gap-3 hover:bg-neutral-800/50 transition-colors"
                          >
                            <div className="relative size-8 rounded-full overflow-hidden bg-neutral-800 shrink-0">
                              <img src={player.avatar} alt={player.name} className="size-full object-cover" />
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-['Lexend:SemiBold',_sans-serif] text-[12px] text-neutral-50 flex items-center gap-2">
                                {player.name}
                                {player.is_division_leader && <Shield size={12} className="text-yellow-400" />}
                              </div>
                              <div className="font-['Lexend:Regular',_sans-serif] text-[10px] text-neutral-400">
                                {player.wins}W-{player.losses}L • {player.points} pts
                              </div>
                            </div>
                          </button>
                          
                          {/* Expanded Player Actions */}
                          {selectedPlayer?.id === player.id && (
                            <div className="px-4 pb-3 space-y-2">
                              {editingPlayer?.id === player.id ? (
                                <div className="bg-neutral-800/50 rounded-lg p-3 space-y-2">
                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <label className="font-['Lexend:Regular',_sans-serif] text-[10px] text-neutral-400 block mb-1">Wins</label>
                                      <input 
                                        type="number" 
                                        value={editValues.wins}
                                        onChange={(e) => setEditValues({ ...editValues, wins: parseInt(e.target.value) })}
                                        className="w-full bg-neutral-900 text-neutral-200 rounded px-2 py-1 font-['Lexend:Regular',_sans-serif] text-[11px] border border-neutral-700"
                                      />
                                    </div>
                                    <div>
                                      <label className="font-['Lexend:Regular',_sans-serif] text-[10px] text-neutral-400 block mb-1">Losses</label>
                                      <input 
                                        type="number" 
                                        value={editValues.losses}
                                        onChange={(e) => setEditValues({ ...editValues, losses: parseInt(e.target.value) })}
                                        className="w-full bg-neutral-900 text-neutral-200 rounded px-2 py-1 font-['Lexend:Regular',_sans-serif] text-[11px] border border-neutral-700"
                                      />
                                    </div>
                                    <div>
                                      <label className="font-['Lexend:Regular',_sans-serif] text-[10px] text-neutral-400 block mb-1">Points</label>
                                      <input 
                                        type="number" 
                                        value={editValues.points}
                                        onChange={(e) => setEditValues({ ...editValues, points: parseInt(e.target.value) })}
                                        className="w-full bg-neutral-900 text-neutral-200 rounded px-2 py-1 font-['Lexend:Regular',_sans-serif] text-[11px] border border-neutral-700"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => setEditingPlayer(null)}
                                      className="flex-1 bg-green-600/80 hover:bg-green-600 px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                      <Save size={14} className="text-white" />
                                      <span className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-white">Save</span>
                                    </button>
                                    <button 
                                      onClick={() => setEditingPlayer(null)}
                                      className="flex-1 bg-neutral-700/80 hover:bg-neutral-700 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                      <span className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-white">Cancel</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => {
                                      setEditingPlayer(player);
                                      setEditValues({ wins: player.wins, losses: player.losses, points: player.points });
                                    }}
                                    className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/50 px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                                  >
                                    <Edit size={14} className="text-blue-400" />
                                    <span className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-blue-400">Edit Record</span>
                                  </button>
                                  <button 
                                    onClick={() => setMessageModalPlayer(player)}
                                    className="flex-1 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/50 px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                                  >
                                    <MessageCircle size={14} className="text-purple-400" />
                                    <span className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-purple-400">Message</span>
                                  </button>
                                </div>
                              )}
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => setDqModalPlayer(player)}
                                  className="flex-1 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  <span className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-red-400">DQ Player</span>
                                </button>
                                <button 
                                  onClick={() => setForfeitModalPlayer(player)}
                                  className="flex-1 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/50 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  <span className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-yellow-400">Forfeit Match</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )})}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "alternates" && (
          <div className="space-y-3">
            {alternates.length === 0 ? (
              <div className="text-center py-8">
                <div className="font-['Lexend:Regular',_sans-serif] text-[12px] text-neutral-500">
                  No alternates
                </div>
              </div>
            ) : (
              alternates.map((alternate) => (
                <div key={alternate.id} className="bg-neutral-900 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative size-8 rounded-full overflow-hidden bg-neutral-800 shrink-0">
                      <img src={alternate.avatar} alt={alternate.name} className="size-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="font-['Lexend:SemiBold',_sans-serif] text-[12px] text-neutral-50">
                        {alternate.name}
                      </div>
                      <div className="font-['Lexend:Regular',_sans-serif] text-[10px] text-neutral-400">
                        Rating: {alternate.overall_numeric}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
