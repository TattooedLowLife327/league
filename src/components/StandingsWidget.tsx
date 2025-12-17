import { useState } from "react";
import { ChevronLeft, ChevronRight, Close } from "@carbon/icons-react";

// Users data - Replace with your API data
const mockUsers: any[] = [];

// Divisions data - Replace with your API data
const divisions: any[] = [
  { id: "div1", name: "Division 1", playerCount: 12, color: "blue" },
  { id: "div2", name: "Division 2", playerCount: 10, color: "purple" },
  { id: "div3", name: "Division 3", playerCount: 11, color: "green" },
  { id: "div4", name: "Division 4", playerCount: 9, color: "orange" },
]; // Array of { id, name, playerCount, color }

export function StandingsWidget({ isExpanded, setIsExpanded }: { isExpanded: boolean; setIsExpanded: (val: boolean) => void }) {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedDivision, setSelectedDivision] = useState<string>("all");
  
  // Calculate playoff spots based on number of players
  const getPlayoffSpots = (totalPlayers: number) => {
    if (totalPlayers <= 6) return 3;
    if (totalPlayers === 7) return 4;
    if (totalPlayers === 8) return 4;
    if (totalPlayers >= 9) return 5;
    return 0;
  };

  const playoffSpots = getPlayoffSpots(mockUsers.length);

  return (
    <>
      {/* Collapsed Widget - Always visible */}
      <div className="relative flex-shrink-0 h-full">
        <div
          className="bg-[#000000] rounded-2xl border border-neutral-800 overflow-hidden flex flex-col w-auto h-full"
        >
          {/* Widget Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div
                className="font-['Lexend:SemiBold',_sans-serif] text-[16px] text-neutral-50 opacity-0 w-0 overflow-hidden"
              >
                STANDINGS
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(true)}
              className="text-neutral-400 hover:text-neutral-300 transition-colors p-1"
            >
              <ChevronLeft size={20} />
            </button>
          </div>

          {/* Collapsed view - just profile pictures */}
          <div className="flex flex-col gap-2 p-3 items-center">
            {mockUsers.map((user) => (
              <div
                key={user.id}
                className="relative size-10 rounded-full overflow-hidden bg-neutral-800 shrink-0 hover:ring-2 hover:ring-neutral-600 transition-all cursor-pointer"
                title={user.name}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedUser(user);
                }}
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="size-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drawer - Slides in from the right */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setIsExpanded(false)}
          />
          
          {/* Drawer Panel */}
          <div
            className="fixed right-4 bg-neutral-900/95 backdrop-blur-xl border border-neutral-700/50 rounded-2xl shadow-2xl w-full max-w-md h-[600px] flex flex-col z-50 transition-all duration-300 ease-out"
            style={{ top: '116px' }}
          >
            {/* Widget Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700/50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="font-['Lexend:SemiBold',_sans-serif] text-[16px] text-neutral-50">
                  STANDINGS
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-neutral-400 hover:text-neutral-300 transition-colors p-1"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Division Tabs */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-700/50 flex-shrink-0 overflow-x-auto">
              <button
                onClick={() => setSelectedDivision("all")}
                className={`font-['Lexend:Regular',_sans-serif] text-[12px] px-3 py-1.5 rounded-md whitespace-nowrap transition-all ${
                  selectedDivision === "all"
                    ? 'bg-purple-600 text-white'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }`}
              >
                All Players
              </button>
              {divisions.map((division) => (
                <button
                  key={division.id}
                  onClick={() => setSelectedDivision(division.id)}
                  className={`font-['Lexend:Regular',_sans-serif] text-[12px] px-3 py-1.5 rounded-md whitespace-nowrap transition-all ${
                    selectedDivision === division.id
                      ? 'bg-purple-600 text-white'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                  }`}
                >
                  {division.name} <span className="text-neutral-400">({division.playerCount})</span>
                </button>
              ))}
            </div>

            {/* Widget Content */}
            <div className="flex flex-col flex-1 min-h-0">
              {/* Header Row */}
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-2 px-4 py-2 bg-neutral-800/50 flex-shrink-0">
                <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-400 w-6">
                  #
                </div>
                <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-400">
                  Player
                </div>
                <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-400 w-10 text-center">
                  Wins
                </div>
                <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-400 w-10 text-center">
                  CR
                </div>
                <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-400 w-10 text-center">
                  01
                </div>
                <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-400 w-12 text-center">
                  Overall
                </div>
              </div>

              {/* User List */}
              <div className="overflow-y-auto flex-1">
                {mockUsers.map((user, index) => {
                  const isPlayoffSpot = index < playoffSpots;
                  return (
                    <div
                      key={user.id}
                      className={`grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-2 px-4 py-2 hover:bg-neutral-800/50 transition-colors cursor-pointer border-b border-neutral-700/50 last:border-b-0 ${
                        isPlayoffSpot ? "bg-neutral-800/60" : ""
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="font-['Lexend:SemiBold',_sans-serif] text-[12px] text-neutral-500 w-6">
                        {index + 1}
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative size-8 rounded-full overflow-hidden bg-neutral-800 shrink-0">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="size-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-['Lexend:Regular',_sans-serif] text-[13px] text-neutral-50 truncate">
                            {user.name}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-center w-10">
                        <div className="font-['Lexend:SemiBold',_sans-serif] text-[12px] text-neutral-50">
                          {user.wins}
                        </div>
                      </div>
                      <div className="flex items-center justify-center w-10">
                        <div className="font-['Lexend:Regular',_sans-serif] text-[12px] text-neutral-200">
                          {user.crRating.toFixed(1)}
                        </div>
                      </div>
                      <div className="flex items-center justify-center w-10">
                        <div className="font-['Lexend:Regular',_sans-serif] text-[12px] text-neutral-200">
                          {user.o1Rating.toFixed(1)}
                        </div>
                      </div>
                      <div className="flex items-center justify-center w-12">
                        <div
                          className={`font-['Lexend:SemiBold',_sans-serif] text-[12px] px-1.5 py-0.5 rounded ${
                            user.overallRating >= 9.0
                              ? "bg-green-900/30 text-green-400"
                              : user.overallRating >= 8.5
                              ? "bg-blue-900/30 text-blue-400"
                              : user.overallRating >= 8.0
                              ? "bg-yellow-900/30 text-yellow-400"
                              : "bg-orange-900/30 text-orange-400"
                          }`}
                        >
                          {user.overallRating.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-neutral-900 rounded-2xl border border-neutral-700 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-700">
              <div className="flex items-center gap-3">
                <div className="relative size-12 rounded-full overflow-hidden bg-neutral-800 shrink-0">
                  <img
                    src={selectedUser.avatar}
                    alt={selectedUser.name}
                    className="size-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-['Lexend:SemiBold',_sans-serif] text-neutral-50">
                    {selectedUser.name}
                  </div>
                  <div className="font-['Lexend:Regular',_sans-serif] text-[12px] text-neutral-400">
                    #{mockUsers.findIndex(u => u.id === selectedUser.id) + 1} in Standings
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-neutral-400 hover:text-neutral-300 transition-colors p-1"
              >
                <Close size={20} />
              </button>
            </div>

            {/* Stats Grid */}
            <div className="p-4 border-b border-neutral-700">
              <div className="font-['Lexend:SemiBold',_sans-serif] text-[13px] text-neutral-400 mb-3">
                Season Stats
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-neutral-800/50 rounded-lg p-3">
                  <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-400 mb-1">
                    Wins
                  </div>
                  <div className="font-['Lexend:SemiBold',_sans-serif] text-[20px] text-neutral-50">
                    {selectedUser.wins}
                  </div>
                </div>
                <div className="bg-neutral-800/50 rounded-lg p-3">
                  <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-400 mb-1">
                    Overall Rating
                  </div>
                  <div className={`font-['Lexend:SemiBold',_sans-serif] text-[20px] ${
                    selectedUser.overallRating >= 9.0
                      ? "text-green-400"
                      : selectedUser.overallRating >= 8.5
                      ? "text-blue-400"
                      : selectedUser.overallRating >= 8.0
                      ? "text-yellow-400"
                      : "text-orange-400"
                  }`}>
                    {selectedUser.overallRating.toFixed(1)}
                  </div>
                </div>
                <div className="bg-neutral-800/50 rounded-lg p-3">
                  <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-400 mb-1">
                    CR Rating
                  </div>
                  <div className="font-['Lexend:SemiBold',_sans-serif] text-[20px] text-neutral-50">
                    {selectedUser.crRating.toFixed(1)}
                  </div>
                </div>
                <div className="bg-neutral-800/50 rounded-lg p-3">
                  <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-400 mb-1">
                    01 Rating
                  </div>
                  <div className="font-['Lexend:SemiBold',_sans-serif] text-[20px] text-neutral-50">
                    {selectedUser.o1Rating.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>

            {/* Game Averages vs Opponents */}
            <div className="p-4">
              <div className="font-['Lexend:SemiBold',_sans-serif] text-[13px] text-neutral-400 mb-3">
                Game Averages vs Opponents
              </div>
              <div className="space-y-2">
                {mockUsers
                  .filter(u => u.id !== selectedUser.id)
                  .slice(0, 5)
                  .map((opponent) => {
                    // Replace with real game data from your API
                    const gamesPlayed = 0;
                    const avg501 = 0;
                    const avgCR = 0;
                    const avgCH = 0;
                    
                    return (
                      <div key={opponent.id} className="bg-neutral-800/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="relative size-6 rounded-full overflow-hidden bg-neutral-800 shrink-0">
                            <img
                              src={opponent.avatar}
                              alt={opponent.name}
                              className="size-full object-cover"
                            />
                          </div>
                          <div className="font-['Lexend:Regular',_sans-serif] text-[12px] text-neutral-50">
                            {opponent.name}
                          </div>
                          <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-500 ml-auto">
                            {gamesPlayed} {gamesPlayed === 1 ? 'game' : 'games'}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <div className="font-['Lexend:Regular',_sans-serif] text-[10px] text-neutral-400">
                              501
                            </div>
                            <div className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-neutral-200">
                              {avg501}
                            </div>
                          </div>
                          <div>
                            <div className="font-['Lexend:Regular',_sans-serif] text-[10px] text-neutral-400">
                              CR
                            </div>
                            <div className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-neutral-200">
                              {avgCR}
                            </div>
                          </div>
                          <div>
                            <div className="font-['Lexend:Regular',_sans-serif] text-[10px] text-neutral-400">
                              CH
                            </div>
                            <div className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-neutral-200">
                              {avgCH}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
