import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Send, WarningAlt, CheckmarkOutline, Time, Close, Information } from "@carbon/icons-react";
import { Crown, Edit, Save, Megaphone, Shield, MessageCircle, Power } from "lucide-react";
import { MatchLobbyWidget } from "./MatchLobbyWidget";
import { MessagingModal } from "./MessagingModal";
import { StandingsWidget } from "./StandingsWidget";
import { ManagementWidget } from "./ManagementWidget";
import { ScheduleWidget } from "./ScheduleWidget";
import { LeagueInfoWidget } from "./LeagueInfoWidget";

// Import payment app icons
import paypalIcon from "figma:asset/eb0b956045f8a57dbb7f6d8b901652bc81e464d0.png";
import cashAppIcon from "figma:asset/31603d8c13efa7fec0ae291d3ae50b82e9e90a5b.png";
import venmoIcon from "figma:asset/5072126c2afea515d933acc501d82ec57bcaf991.png";

// Softer spring animation curve
const softSpringEasing = "cubic-bezier(0.25, 1.1, 0.4, 1)";

// League info data - Replace with your API data
const leagueInfo = {
  format: "",
  prizePerWin: 0,
  currentWeek: 0,
  totalWeeks: 0,
  potTotal: 0,
  payouts: [],
};

// User's current status - Replace with your API data
const userStatus = {
  standingsPlace: 0,
  paymentStatus: "paid", // "paid", "due", "late"
  weekMatchStatus: "pending", // "completed", "pending", "late"
};

// Current user info - Replace with your API data
const currentUser = {
  name: "",
  avatar: "",
  role: "OWNER", // "OWNER", "THE_MAN", or "PLAYER"
};

// Users data - Replace with your API data
const mockUsers: any[] = [];

// Current week matchup - Replace with your API data
const currentMatchup = {
  id: 0,
  opponent: {
    name: "",
    avatar: "",
    rating: 0,
  },
  week: 0,
  paymentStatus: "unpaid",
  scheduledDate: "",
  scheduledTime: "",
  canSchedule: false,
  isConfirmed: false,
};

// Full schedule data - Replace with your API data
const fullSchedule: any[] = [];

// Payment options - Replace with your payment details
const paymentOptions = [
  {
    name: "Venmo",
    icon: venmoIcon,
    url: "https://venmo.com/",
    username: "",
  },
  {
    name: "PayPal",
    icon: paypalIcon,
    url: "https://www.paypal.com/",
    username: "",
  },
  {
    name: "Chime",
    icon: cashAppIcon,
    url: "https://www.chime.com/",
    username: "",
  },
];

// Messages data - Replace with your API data
const mockMessages: any[] = [];

// Divisions data - Replace with your API data
const divisions: any[] = [
  { id: "div1", name: "Division 1", playerCount: 12, color: "blue" },
  { id: "div2", name: "Division 2", playerCount: 10, color: "purple" },
  { id: "div3", name: "Division 3", playerCount: 11, color: "green" },
  { id: "div4", name: "Division 4", playerCount: 9, color: "orange" },
]; // Array of { id, name, playerCount, color }

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
const leagueStats = {
  totalPlayers: 5,
  pendingApprovalsCount: 0,
  paidCount: 4,
  dueCount: 1,
  lateCount: 0,
  completedMatches: 5,
  totalMatches: 10,
};

// League status - Replace with your API data
const leagueStatus = {
  hasStarted: false, // Set to true once league starts to hide pending approvals
};

function Dashboard() {
  const [standingsExpanded, setStandingsExpanded] = useState(false);
  const [messagingOpponent, setMessagingOpponent] = useState<{
    name: string;
    avatar: string;
    rating: number;
  } | null>(null);
  const [currentMatchSchedule, setCurrentMatchSchedule] = useState<{
    date: string | null;
    time: string | null;
    isPending?: boolean;
    isForfeit?: boolean;
  }>({
    date: null,
    time: null,
    isPending: false,
    isForfeit: false
  });
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [currentWeekForfeit, setCurrentWeekForfeit] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showMatchLobby, setShowMatchLobby] = useState(false);
  const [matchLobbyTime, setMatchLobbyTime] = useState<Date | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState(divisions[0]?.id || "div1");
  const [colorPickerDivision, setColorPickerDivision] = useState<any | null>(null);
  const [divisionColors, setDivisionColors] = useState<Record<string, string>>(
    divisions.reduce((acc, div) => ({ ...acc, [div.id]: div.color }), {})
  );
  const [pressTimer, setPressTimer] = useState<any>(null);
  const [selectedHue, setSelectedHue] = useState(0);
  
  // Check if current user is admin
  const isAdmin = currentUser.role === "OWNER" || currentUser.role === "THE_MAN";

  // Check if we should show match lobby (5 mins before match time)
  useEffect(() => {
    if (!matchLobbyTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = matchLobbyTime.getTime() - now.getTime();
      const minutesUntil = diff / 1000 / 60;
      
      // Show lobby 5 minutes before match
      if (minutesUntil <= 5 && minutesUntil > -30 && !currentWeekForfeit) {
        setShowMatchLobby(true);
      } else if (minutesUntil < -30) {
        // Hide lobby after 30 minutes past match time
        setShowMatchLobby(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [matchLobbyTime, currentWeekForfeit]);

  const handleScheduleConfirmed = (dateTime: string, isPending: boolean, isForfeit?: boolean) => {
    if (isForfeit) {
      // Mark as forfeited
      setCurrentMatchSchedule({
        date: null,
        time: null,
        isPending: false,
        isForfeit: true
      });
      setCurrentWeekForfeit(true);
      return;
    }
    
    if (!dateTime) {
      // Reset to unscheduled state
      setCurrentMatchSchedule({
        date: null,
        time: null,
        isPending: false,
        isForfeit: false
      });
      return;
    }
    
    // Parse the dateTime string to extract day and time
    // Example: "Friday 7pm" or "Friday at 7pm"
    let dayOfWeek = dateTime;
    let timeStr = "";
    
    // Try splitting by " at "
    const partsAt = dateTime.split(' at ');
    if (partsAt.length === 2) {
      dayOfWeek = partsAt[0];
      timeStr = partsAt[1];
    } else {
      // Try splitting by space and take last part as time (e.g., "Friday 7pm")
      const parts = dateTime.trim().split(' ');
      if (parts.length >= 2) {
        timeStr = parts[parts.length - 1];
        dayOfWeek = parts.slice(0, -1).join(' ');
      }
    }
    
    // Format the date as "Day MM/DD"
    // Calculate the actual date based on day of week
    const today = new Date();
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDayIndex = daysOfWeek.indexOf(dayOfWeek.toLowerCase().trim());
    
    let formattedDate = dayOfWeek; // Default to just the day name
    
    if (targetDayIndex !== -1) {
      const currentDayIndex = today.getDay();
      let daysUntilTarget = targetDayIndex - currentDayIndex;
      
      // If the target day has passed this week, schedule for next week
      if (daysUntilTarget < 0) {
        daysUntilTarget += 7;
      } else if (daysUntilTarget === 0) {
        // If it's today, assume they mean next week
        daysUntilTarget = 7;
      }
      
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysUntilTarget);
      
      const month = targetDate.getMonth() + 1;
      const day = targetDate.getDate();
      const dayName = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1).toLowerCase();
      
      formattedDate = `${dayName} ${month}/${day}`;
    } else {
      // If day is not recognized, still capitalize it
      formattedDate = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1).toLowerCase();
    }
    
    // Format the time as "xPM EST" or "xAM EST"
    let formattedTime = timeStr;
    
    // Extract time and meridiem
    const timeMatch = timeStr.match(/(\d+):?(\d*)?\s*(am|pm)/i);
    if (timeMatch) {
      const hour = timeMatch[1];
      const minutes = timeMatch[2] || '';
      const meridiem = timeMatch[3].toUpperCase();
      
      formattedTime = minutes ? `${hour}:${minutes}${meridiem} EST` : `${hour}${meridiem} EST`;
    }
    
    setCurrentMatchSchedule({
      date: formattedDate,
      time: formattedTime,
      isPending: isPending,
      isForfeit: false
    });
  };

  const handleOpenMessages = (opponent: { name: string; avatar: string; rating: number }) => {
    setMessagingOpponent(opponent);
    setHasUnreadMessages(false);
  };

  const handleCloseMessages = () => {
    setMessagingOpponent(null);
  };

  const handleNewMessage = () => {
    setHasUnreadMessages(true);
  };

  return (
    <div className="w-full min-h-screen p-4">
      <div className="mb-6">
        {/* Top row with title and info button */}
        <div className="flex items-center justify-between mb-2">
          <div className="font-['Lexend:Bold',_sans-serif] text-[20px] text-neutral-50">
            League Name
          </div>
          
          <button
            onClick={() => setShowInfoModal(true)}
            className="text-neutral-400 hover:text-neutral-200 transition-colors p-2 flex-shrink-0"
          >
            <Information size={20} />
          </button>
        </div>
        
        {/* View toggle and announce button */}
        {isAdmin && (
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 bg-neutral-800/50 rounded-lg p-1 border border-neutral-700/50">
              <button
                onClick={() => setIsAdminView(false)}
                className={`font-['Lexend:Regular',_sans-serif] text-[10px] px-2.5 py-1.5 rounded-md transition-all whitespace-nowrap ${
                  !isAdminView 
                    ? 'bg-blue-600 text-white' 
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Player View
              </button>
              <button
                onClick={() => setIsAdminView(true)}
                className={`font-['Lexend:Regular',_sans-serif] text-[10px] px-2.5 py-1.5 rounded-md transition-all whitespace-nowrap ${
                  isAdminView 
                    ? 'bg-blue-600 text-white' 
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Admin View
              </button>
            </div>
            
            {isAdminView && (
              <button
                onClick={() => setShowAnnouncementModal(true)}
                className="text-neutral-400 hover:text-neutral-200 transition-colors px-2.5 py-1.5 bg-neutral-800/50 hover:bg-neutral-800 rounded-lg border border-neutral-700/50 flex items-center gap-1.5 flex-shrink-0"
              >
                <Megaphone size={14} />
                <span className="font-['Lexend:Regular',_sans-serif] text-[10px]">Announce</span>
              </button>
            )}
          </div>
        )}
      </div>

      {isAdminView ? (
        <div className="space-y-4 w-full">
          {/* Division Selector - Scrollable */}
          <div className="bg-neutral-900/50 backdrop-blur-sm rounded-xl border border-neutral-800 p-3">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-900">
              {divisions.map((div) => {
                const color = divisionColors[div.id] || div.color;
                const colorClasses = {
                  blue: 'bg-blue-600 hover:bg-blue-500 border-blue-500',
                  purple: 'bg-purple-600 hover:bg-purple-500 border-purple-500',
                  green: 'bg-green-600 hover:bg-green-500 border-green-500',
                  orange: 'bg-orange-600 hover:bg-orange-500 border-orange-500',
                  red: 'bg-red-600 hover:bg-red-500 border-red-500',
                  yellow: 'bg-yellow-600 hover:bg-yellow-500 border-yellow-500',
                  pink: 'bg-pink-600 hover:bg-pink-500 border-pink-500',
                  cyan: 'bg-cyan-600 hover:bg-cyan-500 border-cyan-500',
                };
                
                return (
                  <button
                    key={div.id}
                    onClick={() => setSelectedDivision(div.id)}
                    onTouchStart={() => {
                      const timer = setTimeout(() => {
                        setColorPickerDivision(div);
                      }, 500);
                      setPressTimer(timer);
                    }}
                    onTouchEnd={() => {
                      if (pressTimer) clearTimeout(pressTimer);
                    }}
                    className={`font-['Lexend:SemiBold',_sans-serif] text-[11px] px-3 py-2 rounded-lg border transition-all whitespace-nowrap flex-shrink-0 ${
                      selectedDivision === div.id
                        ? `${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue} text-white shadow-lg`
                        : 'bg-neutral-800/50 text-neutral-400 border-neutral-700 hover:bg-neutral-800'
                    }`}
                  >
                    {div.name} ({div.playerCount})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Management Widget */}
          <ManagementWidget
            selectedDivision={selectedDivision}
            divisions={divisions}
            pendingApprovals={pendingApprovals}
            allPlayers={allPlayers}
            alternates={alternates}
            leagueStats={leagueStats}
            leagueStatus={leagueStatus}
          />
        </div>
      ) : (
        <div className="flex gap-4 w-full">
          {/* League Info Widget */}
          <LeagueInfoWidget
            onOpenMessages={handleOpenMessages}
            currentMatchSchedule={currentMatchSchedule}
            hasUnreadMessages={hasUnreadMessages}
            isAdminView={isAdminView}
          />
          <ScheduleWidget 
            onOpenMessages={handleOpenMessages}
            currentWeekForfeit={currentWeekForfeit}
          />
          <StandingsWidget 
            isExpanded={standingsExpanded}
            setIsExpanded={setStandingsExpanded}
          />
        </div>
      )}

      {/* Messaging Modal */}
      {messagingOpponent && (
        <MessagingModal
          opponent={messagingOpponent}
          onClose={handleCloseMessages}
          onScheduleConfirmed={handleScheduleConfirmed}
          onNewMessage={handleNewMessage}
        />
      )}

      {/* Match Lobby */}
      {showMatchLobby && matchLobbyTime && (
        <MatchLobbyWidget
          matchTime={matchLobbyTime}
          opponent={currentMatchup.opponent}
          onClose={() => setShowMatchLobby(false)}
        />
      )}

      {/* Info Modal */}
      {showInfoModal && createPortal(
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={() => setShowInfoModal(false)}
        >
          <div
            className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl border border-neutral-700/50 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-neutral-900/95 backdrop-blur-xl flex items-center justify-between px-6 py-4 border-b border-neutral-700/50 z-10">
              <div className="font-['Lexend:Bold',_sans-serif] text-[18px] text-neutral-50">
                Dashboard Guide
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-neutral-400 hover:text-neutral-200 transition-colors p-2"
              >
                <Close size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Overview Section */}
              <div>
                <div className="font-['Lexend:SemiBold',_sans-serif] text-[15px] text-blue-400 mb-2">
                  📊 Overview Widget
                </div>
                <div className="font-['Lexend:Regular',_sans-serif] text-[13px] text-neutral-300 leading-relaxed">
                  Shows league format, prize structure, and current week. Displays your standings placement and weekly match status. Track pot total and payment due dates.
                </div>
              </div>

              {/* Schedule Section */}
              <div>
                <div className="font-['Lexend:SemiBold',_sans-serif] text-[15px] text-green-400 mb-2">
                  📅 Schedule Widget
                </div>
                <div className="font-['Lexend:Regular',_sans-serif] text-[13px] text-neutral-300 leading-relaxed">
                  View all your matches for the season. Current week is highlighted. Click message icon to coordinate with opponents. Past matches show results, future matches display as TBD until scheduled.
                </div>
              </div>

              {/* Standings Section */}
              <div>
                <div className="font-['Lexend:SemiBold',_sans-serif] text-[15px] text-purple-400 mb-2">
                  🏆 Standings Widget
                </div>
                <div className="font-['Lexend:Regular',_sans-serif] text-[13px] text-neutral-300 leading-relaxed">
                  Drawer-style widget showing player rankings. Green highlight indicates playoff spots. Click player avatars for detailed stats. Sorts by wins, then overall rating.
                </div>
              </div>

              {/* Messaging Section */}
              <div>
                <div className="font-['Lexend:SemiBold',_sans-serif] text-[15px] text-orange-400 mb-2">
                  💬 Messaging System
                </div>
                <div className="font-['Lexend:Regular',_sans-serif] text-[13px] text-neutral-300 leading-relaxed">
                  Chat with opponents to coordinate matches. Use commands like <span className="font-['Lexend:SemiBold',_sans-serif] text-blue-300">/schedule Friday 7pm</span> to set times or <span className="font-['Lexend:SemiBold',_sans-serif] text-red-300">/forfeit</span> to concede.
                </div>
              </div>

              {/* Payment Section */}
              <div>
                <div className="font-['Lexend:SemiBold',_sans-serif] text-[15px] text-yellow-400 mb-2">
                  💳 Payment Status
                </div>
                <div className="font-['Lexend:Regular',_sans-serif] text-[13px] text-neutral-300 leading-relaxed">
                  Color-coded icons show payment status: <span className="text-green-400">Green (Paid)</span>, <span className="text-yellow-400">Yellow (Due)</span>, <span className="text-red-400">Red (Late)</span>. Click when dues are pending to submit payment.
                </div>
              </div>

              {/* Match Lobby Section */}
              <div>
                <div className="font-['Lexend:SemiBold',_sans-serif] text-[15px] text-cyan-400 mb-2">
                  🎮 Match Lobby
                </div>
                <div className="font-['Lexend:Regular',_sans-serif] text-[13px] text-neutral-300 leading-relaxed">
                  Appears 5 minutes before scheduled match time. Shows countdown, both players, and ready status. At 2 minutes, click \"Ready in Lobby\" to begin. Report each game result, then submit final score. Both players must confirm same score or it's flagged for admin review.
                </div>
              </div>

              {/* Tips Section */}
              <div className="pt-4 border-t border-neutral-800">
                <div className="font-['Lexend:SemiBold',_sans-serif] text-[14px] text-neutral-200 mb-2">
                  💡 Quick Tips
                </div>
                <ul className="space-y-2 font-['Lexend:Regular',_sans-serif] text-[13px] text-neutral-400">
                  <li>• Red notification badges indicate unread messages</li>
                  <li>• Pending matches show as \"TBD\" until scheduled</li>
                  <li>• Forfeited matches appear with \"FORFEITED\" status</li>
                  <li>• All dates are calculated from current week</li>
                </ul>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Color Picker Modal */}
      {colorPickerDivision && createPortal(
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={() => setColorPickerDivision(null)}
        >
          <div
            className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl border border-neutral-700/50 shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-['Lexend:Bold',_sans-serif] text-[18px] text-neutral-50 mb-4">
              Customize {colorPickerDivision.name}
            </div>

            {/* Preset Colors */}
            <div className="mb-6">
              <div className="font-['Lexend:SemiBold',_sans-serif] text-[13px] text-neutral-400 mb-3">
                Preset Colors
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['blue', 'purple', 'green', 'orange', 'red', 'yellow', 'pink', 'cyan'].map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setDivisionColors(prev => ({
                        ...prev,
                        [colorPickerDivision.id]: color
                      }));
                      setColorPickerDivision(null);
                    }}
                    className={`h-12 rounded-lg border-2 transition-all ${
                      divisionColors[colorPickerDivision.id] === color
                        ? 'border-white scale-105'
                        : 'border-transparent hover:border-neutral-600'
                    } ${
                      color === 'blue' ? 'bg-blue-600' :
                      color === 'purple' ? 'bg-purple-600' :
                      color === 'green' ? 'bg-green-600' :
                      color === 'orange' ? 'bg-orange-600' :
                      color === 'red' ? 'bg-red-600' :
                      color === 'yellow' ? 'bg-yellow-600' :
                      color === 'pink' ? 'bg-pink-600' :
                      'bg-cyan-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Premium Hue Slider */}
            <div className="mb-6">
              <div className="font-['Lexend:SemiBold',_sans-serif] text-[13px] text-neutral-400 mb-3 flex items-center gap-2">
                Premium Hue Slider <Crown size={14} className="text-yellow-500" />
              </div>
              <div className="relative h-12 rounded-lg overflow-hidden mb-3"
                style={{
                  background: 'linear-gradient(to right, hsl(0, 70%, 50%), hsl(60, 70%, 50%), hsl(120, 70%, 50%), hsl(180, 70%, 50%), hsl(240, 70%, 50%), hsl(300, 70%, 50%), hsl(360, 70%, 50%))'
                }}
              >
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={selectedHue}
                  onChange={(e) => setSelectedHue(parseInt(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-1 h-full bg-white shadow-lg"
                  style={{ left: `${(selectedHue / 360) * 100}%` }}
                />
              </div>
              <div
                className="h-12 rounded-lg border-2 border-white mb-3"
                style={{ backgroundColor: `hsl(${selectedHue}, 70%, 50%)` }}
              />
              <button
                onClick={() => {
                  // Store custom hue as special color value
                  setDivisionColors(prev => ({
                    ...prev,
                    [colorPickerDivision.id]: `hue-${selectedHue}`
                  }));
                  setColorPickerDivision(null);
                }}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-['Lexend:SemiBold',_sans-serif] text-[13px] py-2 rounded-lg transition-colors"
              >
                Apply Custom Color
              </button>
            </div>

            <button
              onClick={() => setColorPickerDivision(null)}
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-['Lexend:Regular',_sans-serif] text-[13px] py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Announcement Modal */}
      {showAnnouncementModal && createPortal(
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={() => setShowAnnouncementModal(false)}
        >
          <div
            className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl border border-neutral-700/50 shadow-2xl max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="font-['Lexend:Bold',_sans-serif] text-[18px] text-neutral-50 flex items-center gap-2">
                <Megaphone size={20} className="text-blue-400" />
                Send Announcement
              </div>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="text-neutral-400 hover:text-neutral-200 transition-colors p-2"
              >
                <Close size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="font-['Lexend:SemiBold',_sans-serif] text-[13px] text-neutral-300 mb-2 block">
                  Message
                </label>
                <textarea
                  className="w-full bg-neutral-800/50 border border-neutral-700 rounded-lg px-3 py-2 font-['Lexend:Regular',_sans-serif] text-[13px] text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                  placeholder="Enter announcement message..."
                />
              </div>

              <div>
                <label className="font-['Lexend:SemiBold',_sans-serif] text-[13px] text-neutral-300 mb-2 block">
                  Recipients
                </label>
                <select className="w-full bg-neutral-800/50 border border-neutral-700 rounded-lg px-3 py-2 font-['Lexend:Regular',_sans-serif] text-[13px] text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Players</option>
                  <option>Division 1</option>
                  <option>Division 2</option>
                  <option>Division 3</option>
                  <option>Division 4</option>
                </select>
              </div>

              <button
                onClick={() => {
                  // Handle announcement send
                  setShowAnnouncementModal(false);
                }}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-['Lexend:SemiBold',_sans-serif] text-[13px] py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Send size={16} />
                Send Announcement
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Match Rules Modal */}
      {showInfoModal && createPortal(
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={() => setShowInfoModal(false)}
        >
          <div
            className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl border border-neutral-700/50 shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700/50">
              <div className="font-['Lexend:Bold',_sans-serif] text-[16px] text-neutral-50">
                Match Rules
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-neutral-400 hover:text-neutral-200 transition-colors p-2"
              >
                <Close size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <div className="font-['Lexend:Bold',_sans-serif] text-[12px] text-neutral-200 mb-2">
                  GAME FORMAT
                </div>
                <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-400 leading-relaxed">
                  Best of 3 • 501 Double In/Out
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-700">
                <div className="font-['Lexend:Bold',_sans-serif] text-[12px] text-neutral-200 mb-2">
                  GAME ORDER
                </div>
                <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-400 leading-relaxed mb-1">
                  Higher seed picks 1st game
                </div>
                <div className="font-['Lexend:Regular',_sans-serif] text-[10px] text-neutral-400 mt-0.5">
                  Loser of 2nd game picks the last game
                </div>
              </div>
              <div className="pt-2 border-t border-neutral-700">
                <div className="font-['Lexend:Bold',_sans-serif] text-[10px] text-neutral-300 mb-1">
                  Master In | Master Out | Full Bull
                </div>
                <div className="font-['Lexend:SemiBold',_sans-serif] text-[10px] text-neutral-300">
                  Cork for all
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export function Frame760() {
  return (
    <div className="bg-[#1a1a1a] box-border content-stretch flex flex-row gap-4 items-start justify-center p-0 relative size-full min-h-screen overflow-auto">
      <Dashboard />
    </div>
  );
}
