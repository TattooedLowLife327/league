import { MessageCircle } from "lucide-react";

// Full schedule data - Replace with your API data
const fullSchedule: any[] = [];

// League info data - Replace with your API data
const leagueInfo = {
  format: "",
  prizePerWin: 0,
  currentWeek: 0,
  totalWeeks: 0,
  potTotal: 0,
  payouts: [],
};

export function ScheduleWidget({ onOpenMessages, currentWeekForfeit }: { onOpenMessages: (opponent: { name: string; avatar: string; rating: number }) => void; currentWeekForfeit?: boolean }) {
  // Include all matches now (we'll handle current week specially if forfeited)
  const allMatches = currentWeekForfeit 
    ? fullSchedule 
    : fullSchedule.filter(match => match.week !== leagueInfo.currentWeek);

  const futureMatches = allMatches.filter(match => match.week > leagueInfo.currentWeek || (match.week === leagueInfo.currentWeek && currentWeekForfeit));

  return (
    <div className="bg-[#000000] rounded-2xl border border-neutral-800 overflow-hidden flex flex-col h-full">
      {/* Widget Header */}
      <div className="flex items-center justify-center px-4 py-3 border-b border-neutral-800 flex-shrink-0">
        <div className="font-['Lexend:SemiBold',_sans-serif] text-[16px] text-neutral-50">
          SCHEDULE
        </div>
      </div>

      {/* Widget Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {futureMatches.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center py-8">
              <div className="font-['Lexend:Regular',_sans-serif] text-[13px] text-neutral-500">
                No upcoming matches
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {futureMatches.map((match) => (
              <div
                key={match.id}
                className="bg-neutral-900 rounded-lg p-3 border border-neutral-800 hover:border-neutral-700 transition-colors"
              >
                {/* Week Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-neutral-400">
                    Week {match.week}
                  </div>
                  {match.scheduledDate && match.scheduledTime && (
                    <div className="font-['Lexend:Regular',_sans-serif] text-[10px] text-green-400">
                      {match.scheduledDate} • {match.scheduledTime}
                    </div>
                  )}
                </div>

                {/* Opponent Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="relative size-8 rounded-full overflow-hidden bg-neutral-800 shrink-0">
                      <img
                        src={match.opponent.avatar}
                        alt={match.opponent.name}
                        className="size-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-['Lexend:Regular',_sans-serif] text-[12px] text-neutral-50 truncate">
                        {match.opponent.name}
                      </div>
                      <div className="font-['Lexend:Regular',_sans-serif] text-[10px] text-neutral-400">
                        Rating: {match.opponent.rating.toFixed(1)}
                      </div>
                    </div>
                  </div>

                  {/* Message Button */}
                  <button
                    onClick={() => onOpenMessages(match.opponent)}
                    className="p-2 hover:bg-neutral-800 rounded-lg transition-colors shrink-0"
                  >
                    <MessageCircle size={18} className="text-neutral-400" />
                  </button>
                </div>

                {/* Match Status */}
                {!match.scheduledDate && !match.scheduledTime && (
                  <div className="mt-3 p-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg">
                    <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-400">
                      Not scheduled yet
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
