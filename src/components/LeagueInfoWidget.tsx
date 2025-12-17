import { useState } from "react";
import { createPortal } from "react-dom";
import { Close, Information } from "@carbon/icons-react";
import { MessageCircle, Crown } from "lucide-react";

// Import payment app icons
import paypalIcon from "figma:asset/eb0b956045f8a57dbb7f6d8b901652bc81e464d0.png";
import cashAppIcon from "figma:asset/31603d8c13efa7fec0ae291d3ae50b82e9e90a5b.png";
import venmoIcon from "figma:asset/5072126c2afea515d933acc501d82ec57bcaf991.png";

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

export function LeagueInfoWidget({ 
  onOpenMessages,
  currentMatchSchedule,
  hasUnreadMessages,
  isAdminView = false
}: { 
  onOpenMessages?: (opponent: { name: string; avatar: string; rating: number }) => void;
  currentMatchSchedule?: { date: string | null; time: string | null; isPending?: boolean; isForfeit?: boolean };
  hasUnreadMessages?: boolean;
  isAdminView?: boolean;
}) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showFormatInfoModal, setShowFormatInfoModal] = useState(false);
  const [showPayoutsModal, setShowPayoutsModal] = useState(false);

  const getPaymentStatusColor = () => {
    switch (userStatus.paymentStatus) {
      case "paid":
        return "text-green-400";
      case "due":
        return "text-yellow-400";
      case "late":
        return "text-red-400";
      default:
        return "text-neutral-400";
    }
  };

  const getWeekMatchStatusColor = () => {
    switch (userStatus.weekMatchStatus) {
      case "completed":
        return "text-green-400";
      case "pending":
        return "text-yellow-400";
      case "late":
        return "text-red-400";
      default:
        return "text-neutral-400";
    }
  };

  // Admin view shows different content
  if (isAdminView) {
    return (
      <div className="bg-[#000000] rounded-2xl border border-neutral-800 overflow-hidden flex flex-col h-full">
        {/* Widget Header */}
        <div className="flex items-center justify-center px-4 py-3 border-b border-neutral-800 flex-shrink-0">
          <div className="font-['Lexend:SemiBold',_sans-serif] text-[16px] text-neutral-50">
            LEAGUE OVERVIEW
          </div>
        </div>

        {/* League branding/name placeholder */}
        <div className="p-6 border-b border-neutral-800">
          <div className="text-center">
            <div className="font-['Lexend:Bold',_sans-serif] text-[24px] text-neutral-50 mb-1">
              League Name
            </div>
            <div className="font-['Lexend:Regular',_sans-serif] text-[12px] text-neutral-400">
              Admin Dashboard
            </div>
          </div>
        </div>

        {/* Admin controls hint */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <Crown className="size-12 text-yellow-500/50 mx-auto mb-3" />
            <div className="font-['Lexend:SemiBold',_sans-serif] text-[13px] text-neutral-300 mb-1">
              Admin View Active
            </div>
            <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-500">
              Toggle off to see player view
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[#000000] rounded-2xl border border-neutral-800 overflow-hidden flex flex-col h-full">
        {/* Widget Header */}
        <div className="flex items-center justify-center px-4 py-3 border-b border-neutral-800 flex-shrink-0">
          <div className="font-['Lexend:SemiBold',_sans-serif] text-[16px] text-neutral-50">
            OVERVIEW
          </div>
        </div>

        {/* Widget Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* User Profile Section */}
          <div className="flex items-center gap-3">
            <div className="relative size-12 rounded-full overflow-hidden bg-neutral-800 shrink-0">
              <img
                src={currentUser.avatar || "https://via.placeholder.com/48"}
                alt={currentUser.name}
                className="size-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-['Lexend:SemiBold',_sans-serif] text-[14px] text-neutral-50 truncate">
                {currentUser.name || "Player Name"}
              </div>
              <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-400">
                {userStatus.standingsPlace > 0 ? `${userStatus.standingsPlace}${
                  userStatus.standingsPlace === 1 ? 'st' :
                  userStatus.standingsPlace === 2 ? 'nd' :
                  userStatus.standingsPlace === 3 ? 'rd' : 'th'
                } place` : "-"}
              </div>
            </div>
          </div>

          {/* Current Week */}
          <div className="bg-neutral-900 rounded-lg p-3 border border-neutral-800">
            <div className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-neutral-400 mb-1">
              Current Week
            </div>
            <div className="font-['Lexend:SemiBold',_sans-serif] text-[16px] text-neutral-50">
              Week {leagueInfo.currentWeek || 0} of {leagueInfo.totalWeeks || 0}
            </div>
          </div>

          {/* Status Grid */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="bg-neutral-900 rounded-lg p-3 border border-neutral-800 hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <div className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-neutral-400 mb-1">
                Payment
              </div>
              <div className={`font-['Lexend:SemiBold',_sans-serif] text-[13px] capitalize ${getPaymentStatusColor()}`}>
                {userStatus.paymentStatus || "unknown"}
              </div>
            </button>
            <div className="bg-neutral-900 rounded-lg p-3 border border-neutral-800">
              <div className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-neutral-400 mb-1">
                Week Match
              </div>
              <div className={`font-['Lexend:SemiBold',_sans-serif] text-[13px] capitalize ${getWeekMatchStatusColor()}`}>
                {userStatus.weekMatchStatus || "unknown"}
              </div>
            </div>
          </div>

          {/* League Info */}
          <div className="space-y-2">
            <button
              onClick={() => setShowFormatInfoModal(true)}
              className="w-full bg-neutral-900 rounded-lg p-3 border border-neutral-800 hover:bg-neutral-800 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center justify-between">
                <div className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-neutral-400">
                  Format
                </div>
                <Information size={16} className="text-neutral-500" />
              </div>
              <div className="font-['Lexend:Regular',_sans-serif] text-[13px] text-neutral-50 mt-1">
                {leagueInfo.format || "Not set"}
              </div>
            </button>

            <div className="bg-neutral-900 rounded-lg p-3 border border-neutral-800">
              <div className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-neutral-400 mb-1">
                Prize per Win
              </div>
              <div className="font-['Lexend:Regular',_sans-serif] text-[13px] text-neutral-50">
                ${leagueInfo.prizePerWin || 0}
              </div>
            </div>

            <button
              onClick={() => setShowPayoutsModal(true)}
              className="w-full bg-neutral-900 rounded-lg p-3 border border-neutral-800 hover:bg-neutral-800 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center justify-between">
                <div className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-neutral-400">
                  Pot Total
                </div>
                <Information size={16} className="text-neutral-500" />
              </div>
              <div className="font-['Lexend:Regular',_sans-serif] text-[13px] text-green-400 mt-1">
                ${leagueInfo.potTotal || 0}
              </div>
            </button>
          </div>

          {/* Current Match */}
          {currentMatchup.opponent.name && (
            <div className="bg-neutral-900 rounded-lg p-3 border border-neutral-800">
              <div className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-neutral-400 mb-2">
                Week {currentMatchup.week || leagueInfo.currentWeek} Matchup
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="relative size-8 rounded-full overflow-hidden bg-neutral-800 shrink-0">
                    <img
                      src={currentMatchup.opponent.avatar}
                      alt={currentMatchup.opponent.name}
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-['Lexend:Regular',_sans-serif] text-[12px] text-neutral-50 truncate">
                      {currentMatchup.opponent.name}
                    </div>
                    <div className="font-['Lexend:Regular',_sans-serif] text-[10px] text-neutral-400">
                      Rating: {currentMatchup.opponent.rating.toFixed(1)}
                    </div>
                  </div>
                </div>
                {onOpenMessages && (
                  <button
                    onClick={() => onOpenMessages(currentMatchup.opponent)}
                    className="relative p-2 hover:bg-neutral-800 rounded-lg transition-colors shrink-0"
                  >
                    <MessageCircle size={18} className="text-neutral-400" />
                    {hasUnreadMessages && (
                      <div className="absolute top-1 right-1 size-2 bg-red-500 rounded-full"></div>
                    )}
                  </button>
                )}
              </div>
              
              {/* Match Schedule Status */}
              {currentMatchSchedule?.isForfeit ? (
                <div className="mt-3 p-2 bg-red-900/20 border border-red-700/50 rounded-lg">
                  <div className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-red-400">
                    Match Forfeited
                  </div>
                </div>
              ) : currentMatchSchedule?.date && currentMatchSchedule?.time ? (
                <div className={`mt-3 p-2 ${currentMatchSchedule.isPending ? 'bg-yellow-900/20 border border-yellow-700/50' : 'bg-green-900/20 border border-green-700/50'} rounded-lg`}>
                  <div className={`font-['Lexend:SemiBold',_sans-serif] text-[11px] ${currentMatchSchedule.isPending ? 'text-yellow-400' : 'text-green-400'}`}>
                    {currentMatchSchedule.isPending ? 'Pending Confirmation' : 'Confirmed'}
                  </div>
                  <div className="font-['Lexend:Regular',_sans-serif] text-[12px] text-neutral-200 mt-1">
                    {currentMatchSchedule.date} at {currentMatchSchedule.time}
                  </div>
                </div>
              ) : (
                <div className="mt-3 p-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg">
                  <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-400">
                    Not scheduled yet
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && createPortal(
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowPaymentModal(false)}
        >
          <div
            className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="font-['Lexend:Bold',_sans-serif] text-[18px] text-neutral-50">
                Submit Payment
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-neutral-400 hover:text-neutral-200 transition-colors p-2"
              >
                <Close size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {paymentOptions.map((option) => (
                <a
                  key={option.name}
                  href={option.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-neutral-800/50 hover:bg-neutral-800 rounded-lg border border-neutral-700 transition-colors"
                >
                  <img src={option.icon} alt={option.name} className="size-10 rounded-lg" />
                  <div className="flex-1">
                    <div className="font-['Lexend:SemiBold',_sans-serif] text-[13px] text-neutral-50">
                      {option.name}
                    </div>
                    <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-400">
                      {option.username || "Not configured"}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Format Info Modal */}
      {showFormatInfoModal && createPortal(
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowFormatInfoModal(false)}
        >
          <div
            className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-md w-full p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="font-['Lexend:Bold',_sans-serif] text-[18px] text-neutral-50">
                Format Details
              </div>
              <button
                onClick={() => setShowFormatInfoModal(false)}
                className="text-neutral-400 hover:text-neutral-200 transition-colors p-2"
              >
                <Close size={20} />
              </button>
            </div>
            <div className="font-['Lexend:Regular',_sans-serif] text-[13px] text-neutral-300 leading-relaxed">
              Format details will be displayed here. This can be customized with your league rules and format information.
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Payouts Modal */}
      {showPayoutsModal && createPortal(
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowPayoutsModal(false)}
        >
          <div
            className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="font-['Lexend:Bold',_sans-serif] text-[18px] text-neutral-50">
                Prize Breakdown
              </div>
              <button
                onClick={() => setShowPayoutsModal(false)}
                className="text-neutral-400 hover:text-neutral-200 transition-colors p-2"
              >
                <Close size={20} />
              </button>
            </div>
            <div className="space-y-2">
              {leagueInfo.payouts.length > 0 ? (
                leagueInfo.payouts.map((payout: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg">
                    <div className="font-['Lexend:SemiBold',_sans-serif] text-[13px] text-neutral-50">
                      {payout.place}
                    </div>
                    <div className="font-['Lexend:SemiBold',_sans-serif] text-[13px] text-green-400">
                      ${payout.amount}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 font-['Lexend:Regular',_sans-serif] text-[12px] text-neutral-500">
                  No payout structure configured
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
