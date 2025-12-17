import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Send, WarningAlt, CheckmarkOutline, Time, Close, Information } from "@carbon/icons-react";
import { Crown, Edit, Save, Megaphone, Shield, MessageCircle, Power } from "lucide-react";
import { MatchLobbyWidget } from "./MatchLobbyWidget";

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

function MessagingModal({ 
  opponent, 
  onClose, 
  onScheduleConfirmed,
  onNewMessage
}: { 
  opponent: { name: string; avatar: string; rating: number }; 
  onClose: () => void;
  onScheduleConfirmed: (dateTime: string, isPending: boolean, isForfeit?: boolean) => void;
  onNewMessage?: () => void;
}) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(mockMessages);
  const [pendingSchedule, setPendingSchedule] = useState<{
    messageId: number;
    dateTime: string;
    userConfirmed: boolean;
    opponentConfirmed: boolean;
  } | null>(null);
  const [suggestionConfirmation, setSuggestionConfirmation] = useState<{
    original: string;
    corrected: string;
  } | null>(null);
  const [amPmConfirmation, setAmPmConfirmation] = useState<{
    dateTime: string;
    isReschedule: boolean;
  } | null>(null);
  const [forfeitConfirmation, setForfeitConfirmation] = useState(false);

  // Function to detect !schedule command
  const detectScheduleCommand = (text: string): string | null => {
    // Pattern: !schedule or schedule (without !) followed by any text (the proposed date/time)
    const matchWithExclamation = text.match(/^!schedule\s+(.+)$/i);
    const matchWithoutExclamation = text.match(/^schedule\s+(.+)$/i);
    
    const match = matchWithExclamation || matchWithoutExclamation;
    
    if (match && match[1]) {
      return match[1].trim();
    }
    return null;
  };

  // Function to detect !reschedule command
  const detectRescheduleCommand = (text: string): string | null => {
    const matchWithExclamation = text.match(/^!reschedule\s+(.+)$/i);
    const matchWithoutExclamation = text.match(/^reschedule\s+(.+)$/i);
    
    const match = matchWithExclamation || matchWithoutExclamation;
    
    if (match && match[1]) {
      return match[1].trim();
    }
    return null;
  };

  // Function to detect !forfeit command
  const detectForfeitCommand = (text: string): boolean => {
    return /^!?forfeit\s*$/i.test(text.trim());
  };

  // Function to detect !issue command
  const detectIssueCommand = (text: string): string | null => {
    const matchWithExclamation = text.match(/^!issue\s+(.+)$/i);
    const matchWithoutExclamation = text.match(/^issue\s+(.+)$/i);
    
    const match = matchWithExclamation || matchWithoutExclamation;
    
    if (match && match[1]) {
      return match[1].trim();
    }
    return null;
  };

  // Levenshtein distance function to check spelling similarity
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  // Function to check if time is missing am/pm
  const needsAmPmClarification = (dateTimeStr: string): boolean => {
    // Check if the string contains just a number without am/pm
    const words = dateTimeStr.split(' ');
    const justNumber = /^\d{1,2}(:?\d{2})?$/;
    
    // Check if it's a single word (just time) or multiple words (day + time)
    if (words.length === 1) {
      // Single word - check if it's just a number
      return justNumber.test(words[0]);
    } else if (words.length > 1) {
      // Multiple words - check if last word is just a number
      const lastWord = words[words.length - 1];
      return justNumber.test(lastWord);
    }
    return false;
  };

  // Function to fix misspelled time (am/pm)
  const fixTime = (timeStr: string): string => {
    // Match patterns like "8mp", "8Ma", "8Pm", etc.
    const timePattern = /(\d{1,2}):?(\d{2})?\s*([ap]?[mp]?|[ap])/i;
    const match = timeStr.match(timePattern);
    
    if (match) {
      const hour = match[1];
      const minutes = match[2] || '';
      const meridiem = match[3].toLowerCase();
      
      // Correct common typos
      let correctedMeridiem = '';
      if (meridiem.includes('p') && meridiem.includes('m')) {
        correctedMeridiem = 'pm';
      } else if (meridiem.includes('a') && meridiem.includes('m')) {
        correctedMeridiem = 'am';
      } else if (meridiem === 'p' || meridiem === 'pm' || meridiem === 'mp' || meridiem === 'pn') {
        correctedMeridiem = 'pm';
      } else if (meridiem === 'a' || meridiem === 'am' || meridiem === 'ma') {
        correctedMeridiem = 'am';
      }
      
      if (correctedMeridiem) {
        return minutes ? `${hour}:${minutes}${correctedMeridiem}` : `${hour}${correctedMeridiem}`;
      }
    }
    
    return timeStr;
  };

  // Function to fix misspelled day of week and time
  const fixDayOfWeek = (dateTimeStr: string): string => {
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayAbbreviations: { [key: string]: string } = {
      'mon': 'monday',
      'tue': 'tuesday',
      'tues': 'tuesday',
      'wed': 'wednesday',
      'thu': 'thursday',
      'thur': 'thursday',
      'thurs': 'thursday',
      'fri': 'friday',
      'sat': 'saturday',
      'sun': 'sunday'
    };
    const words = dateTimeStr.split(' ');
    
    // Check first word (most likely to be the day)
    if (words.length > 0) {
      const firstWord = words[0].toLowerCase();
      
      // Check if it's an abbreviation
      if (dayAbbreviations[firstWord]) {
        const fullDay = dayAbbreviations[firstWord];
        words[0] = fullDay.charAt(0).toUpperCase() + fullDay.slice(1);
      }
      // Check if it's already a valid day
      else if (daysOfWeek.includes(firstWord)) {
        // Capitalize it if it's valid
        words[0] = firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
      } else {
        // Try to find a close match (within 2 character edits)
        for (const day of daysOfWeek) {
          const distance = levenshteinDistance(firstWord, day);
          if (distance <= 2) {
            // Replace with correct spelling (capitalize first letter)
            const correctedDay = day.charAt(0).toUpperCase() + day.slice(1);
            words[0] = correctedDay;
            break;
          }
        }
      }
    }
    
    // Check last word (most likely to be the time)
    if (words.length > 1) {
      const lastWord = words[words.length - 1];
      const fixedTime = fixTime(lastWord);
      
      if (fixedTime !== lastWord) {
        words[words.length - 1] = fixedTime;
      }
    }
    
    return words.join(' ');
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      // Check if message starts with ! (command attempt)
      const isCommandAttempt = message.trim().startsWith('!');
      
      // Check for all command types
      const scheduleDateTime = detectScheduleCommand(message);
      const rescheduleDateTime = detectRescheduleCommand(message);
      const isForfeit = detectForfeitCommand(message);
      const issueDescription = detectIssueCommand(message);
      
      // Handle !issue command (private - not shown to opponent)
      if (issueDescription) {
        const privateMessage = {
          id: messages.length + 1,
          sender: "system" as const,
          text: `Issue reported to league director:\n"${issueDescription}"\n\nThe director will review and contact you shortly.`,
          timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
        };
        setMessages([...messages, privateMessage]);
        setMessage("");
        return;
      }
      
      // Handle !forfeit command
      if (isForfeit) {
        // Show forfeit confirmation modal
        setForfeitConfirmation(true);
        setMessage("");
        return;
      }
      
      // Validate command
      if (isCommandAttempt) {
        // Check if it's a valid command (with or without !)
        const msgLower = message.trim().toLowerCase();
        const isScheduleCommand = msgLower.startsWith('!schedule') || msgLower.startsWith('schedule');
        const isRescheduleCommand = msgLower.startsWith('!reschedule') || msgLower.startsWith('reschedule');
        const isForfeitCommand = msgLower.startsWith('!forfeit') || msgLower.startsWith('forfeit');
        const isIssueCommand = msgLower.startsWith('!issue') || msgLower.startsWith('issue');
        
        if (!isScheduleCommand && !isRescheduleCommand && !isForfeitCommand && !isIssueCommand) {
          // Command is misspelled
          const systemMessage = {
            id: messages.length + 1,
            sender: "system" as const,
            text: "Please resubmit command with proper spelling and format\nAvailable commands:\n!schedule [day] [time]\n!reschedule [day] [time]\n!forfeit\n!issue [description]",
            timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
          };
          setMessages([...messages, systemMessage]);
          setMessage("");
          return;
        }
        
        if (isScheduleCommand && !scheduleDateTime) {
          // !schedule command but no date/time provided
          const systemMessage = {
            id: messages.length + 1,
            sender: "system" as const,
            text: "Please resubmit command with proper spelling and format\nex: !schedule Friday 8pm",
            timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
          };
          setMessages([...messages, systemMessage]);
          setMessage("");
          return;
        }
        
        if (isRescheduleCommand && !rescheduleDateTime) {
          // !reschedule command but no date/time provided
          const systemMessage = {
            id: messages.length + 1,
            sender: "system" as const,
            text: "Please resubmit command with proper spelling and format\nex: !reschedule Friday 8pm",
            timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
          };
          setMessages([...messages, systemMessage]);
          setMessage("");
          return;
        }
        
        if (isIssueCommand && !issueDescription) {
          // !issue command but no description provided
          const systemMessage = {
            id: messages.length + 1,
            sender: "system" as const,
            text: "Please resubmit command with proper spelling and format\nex: !issue Opponent claims different score",
            timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
          };
          setMessages([...messages, systemMessage]);
          setMessage("");
          return;
        }
      }
      
      const newMessage = {
        id: messages.length + 1,
        sender: "user" as const,
        text: message,
        timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      };
      setMessages([...messages, newMessage]);
      
      // Handle !schedule command
      if (scheduleDateTime) {
        const correctedDateTime = fixDayOfWeek(scheduleDateTime);
        
        // Check if day was corrected (fuzzy matched) - ignore capitalization changes
        if (correctedDateTime.toLowerCase() !== scheduleDateTime.toLowerCase()) {
          // Day was auto-corrected, show confirmation popup
          setSuggestionConfirmation({
            original: scheduleDateTime,
            corrected: correctedDateTime,
          });
          setMessage("");
          return;
        }
        
        // Check if time needs am/pm clarification
        if (needsAmPmClarification(correctedDateTime)) {
          setAmPmConfirmation({
            dateTime: correctedDateTime,
            isReschedule: false,
          });
          setMessage("");
          return;
        }
        
        setPendingSchedule({
          messageId: newMessage.id,
          dateTime: correctedDateTime,
          userConfirmed: true, // User auto-confirms their own suggestion
          opponentConfirmed: false,
        });
        
        // Immediately update Overview with pending status
        onScheduleConfirmed(correctedDateTime, true);
      }
      
      // Handle !reschedule command
      if (rescheduleDateTime) {
        // Check if there's an existing schedule to reschedule
        if (!pendingSchedule) {
          const errorMessage = {
            id: messages.length + 1,
            sender: "system" as const,
            text: "No match has been scheduled yet. Please use !schedule to create a schedule first.",
            timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
          };
          setMessages([...messages, errorMessage]);
          setMessage("");
          return;
        }
        
        const correctedDateTime = fixDayOfWeek(rescheduleDateTime);
        
        // Check if day was corrected (fuzzy matched) - ignore capitalization changes
        if (correctedDateTime.toLowerCase() !== rescheduleDateTime.toLowerCase()) {
          // Day was auto-corrected, show confirmation popup
          setSuggestionConfirmation({
            original: rescheduleDateTime,
            corrected: correctedDateTime,
          });
          setMessage("");
          return;
        }
        
        // Check if time needs am/pm clarification
        if (needsAmPmClarification(correctedDateTime)) {
          setAmPmConfirmation({
            dateTime: correctedDateTime,
            isReschedule: true,
          });
          setMessage("");
          return;
        }
        
        setPendingSchedule({
          messageId: newMessage.id,
          dateTime: correctedDateTime,
          userConfirmed: true,
          opponentConfirmed: false,
        });
        
        // Update Overview with new pending schedule
        onScheduleConfirmed(correctedDateTime, true);
      }
      
      setMessage("");
    }
  };

  const handleConfirmSuggestion = () => {
    if (suggestionConfirmation) {
      const newMessage = {
        id: messages.length + 1,
        sender: "user" as const,
        text: `!schedule ${suggestionConfirmation.corrected}`,
        timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      };
      setMessages([...messages, newMessage]);
      
      setPendingSchedule({
        messageId: newMessage.id,
        dateTime: suggestionConfirmation.corrected,
        userConfirmed: true,
        opponentConfirmed: false,
      });
      
      onScheduleConfirmed(suggestionConfirmation.corrected, true);
      setSuggestionConfirmation(null);
    }
  };

  const handleResubmit = () => {
    setSuggestionConfirmation(null);
  };

  const handleAmPmChoice = (meridiem: 'am' | 'pm') => {
    if (amPmConfirmation) {
      const dateTimeWithMeridiem = `${amPmConfirmation.dateTime}${meridiem}`;
      const commandPrefix = amPmConfirmation.isReschedule ? '!reschedule' : '!schedule';
      
      const newMessage = {
        id: messages.length + 1,
        sender: "user" as const,
        text: `${commandPrefix} ${dateTimeWithMeridiem}`,
        timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      };
      setMessages([...messages, newMessage]);
      
      setPendingSchedule({
        messageId: newMessage.id,
        dateTime: dateTimeWithMeridiem,
        userConfirmed: true,
        opponentConfirmed: false,
      });
      
      onScheduleConfirmed(dateTimeWithMeridiem, true);
      setAmPmConfirmation(null);
    }
  };

  const handleOpponentConfirm = () => {
    if (pendingSchedule) {
      setPendingSchedule({
        ...pendingSchedule,
        opponentConfirmed: true,
      });
      
      // Add confirmation message from opponent
      const confirmMessage = {
        id: messages.length + 1,
        sender: "opponent" as const,
        text: `Confirmed! See you then 👍`,
        timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      };
      setMessages([...messages, confirmMessage]);
      
      // Update the match section in Overview with confirmed status
      onScheduleConfirmed(pendingSchedule.dateTime, false);
      
      // Close modal after a brief delay to show confirmation
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  const handleOpponentDecline = () => {
    if (pendingSchedule) {
      // Add decline message from opponent
      const declineMessage = {
        id: messages.length + 1,
        sender: "opponent" as const,
        text: `Sorry, that time doesn't work for me. Can you suggest another time?`,
        timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      };
      setMessages([...messages, declineMessage]);
      
      // Clear pending schedule
      setPendingSchedule(null);
      
      // Reset overview to unscheduled state
      onScheduleConfirmed("", false);
    }
  };

  const handleConfirmForfeit = () => {
    const forfeitMessage = {
      id: messages.length + 1,
      sender: "user" as const,
      text: "I need to forfeit this match",
      timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
    };
    const systemMessage = {
      id: messages.length + 2,
      sender: "system" as const,
      text: "Match forfeit has been recorded. The league director has been notified.",
      timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
    };
    setMessages([...messages, forfeitMessage, systemMessage]);
    
    // Clear any pending schedule and mark as forfeited in overview
    setPendingSchedule(null);
    onScheduleConfirmed("", false, true);
    
    setForfeitConfirmation(false);
  };

  const handleCancelForfeit = () => {
    setForfeitConfirmation(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900/80 backdrop-blur-xl rounded-2xl border border-neutral-700/50 shadow-2xl max-w-lg w-full h-[600px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700/50 flex-shrink-0 bg-neutral-800/30">
          <div className="flex items-center gap-3">
            <div className="relative size-10 rounded-full overflow-hidden bg-neutral-800 ring-2 ring-neutral-700/50">
              <img
                src={opponent.avatar}
                alt={opponent.name}
                className="size-full object-cover"
              />
            </div>
            <div>
              <div className="font-['Lexend:SemiBold',_sans-serif] text-[15px] text-neutral-50">
                {opponent.name}
              </div>
              <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-400">
                Rating: {opponent.rating.toFixed(1)}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 transition-colors p-2"
          >
            <Close size={24} />
          </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : msg.sender === "system" ? "justify-center" : "justify-start"}`}
            >
              <div className={`max-w-[75%] ${msg.sender === "user" ? "items-end" : msg.sender === "system" ? "items-center" : "items-start"} flex flex-col gap-1`}>
                <div
                  className={`px-4 py-2 rounded-2xl backdrop-blur-sm ${
                    msg.sender === "user"
                      ? "bg-blue-600/90 text-white shadow-lg shadow-blue-900/20"
                      : msg.sender === "system"
                      ? "bg-red-900/30 border border-red-700/50 text-red-400 shadow-lg shadow-red-900/20 text-center"
                      : "bg-neutral-800/90 text-neutral-50 shadow-lg shadow-black/20"
                  }`}
                >
                  <div className={`font-['Lexend:Regular',_sans-serif] text-[13px] ${msg.sender === "system" ? "whitespace-pre-line" : ""}`}>
                    {msg.text}
                  </div>
                </div>
                <div className="font-['Lexend:Regular',_sans-serif] text-[10px] text-neutral-500 px-2">
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}
          
          {/* Suggestion Confirmation */}
          {suggestionConfirmation && (
            <div className="flex justify-center">
              <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-700/50 rounded-xl p-4 max-w-[85%]">
                <div className="flex items-start gap-3">
                  <Information size={20} className="text-blue-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="font-['Lexend:SemiBold',_sans-serif] text-[12px] text-blue-400 mb-1">
                      Did you mean?
                    </div>
                    <div className="font-['Lexend:Regular',_sans-serif] text-[13px] text-neutral-200 mb-3">
                      {suggestionConfirmation.corrected}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleConfirmSuggestion}
                        className="flex-1 bg-green-600/80 hover:bg-green-600 backdrop-blur-sm text-white font-['Lexend:SemiBold',_sans-serif] text-[11px] px-3 py-1.5 rounded-lg transition-all"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={handleResubmit}
                        className="flex-1 bg-neutral-700/80 hover:bg-neutral-700 backdrop-blur-sm text-white font-['Lexend:SemiBold',_sans-serif] text-[11px] px-3 py-1.5 rounded-lg transition-all"
                      >
                        Resubmit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* AM/PM Confirmation */}
          {amPmConfirmation && (
            <div className="flex justify-center">
              <div className="bg-purple-900/20 backdrop-blur-sm border border-purple-700/50 rounded-xl p-4 max-w-[85%]">
                <div className="flex items-start gap-3">
                  <Time size={20} className="text-purple-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="font-['Lexend:SemiBold',_sans-serif] text-[12px] text-purple-400 mb-1">
                      AM or PM?
                    </div>
                    <div className="font-['Lexend:Regular',_sans-serif] text-[13px] text-neutral-200 mb-3">
                      {amPmConfirmation.dateTime}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAmPmChoice('am')}
                        className="flex-1 bg-blue-600/80 hover:bg-blue-600 backdrop-blur-sm text-white font-['Lexend:SemiBold',_sans-serif] text-[11px] px-3 py-1.5 rounded-lg transition-all"
                      >
                        {amPmConfirmation.dateTime}am
                      </button>
                      <button
                        onClick={() => handleAmPmChoice('pm')}
                        className="flex-1 bg-orange-600/80 hover:bg-orange-600 backdrop-blur-sm text-white font-['Lexend:SemiBold',_sans-serif] text-[11px] px-3 py-1.5 rounded-lg transition-all"
                      >
                        {amPmConfirmation.dateTime}pm
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Forfeit Confirmation */}
          {forfeitConfirmation && (
            <div className="flex justify-center">
              <div className="bg-red-900/20 backdrop-blur-sm border border-red-700/50 rounded-xl p-4 max-w-[85%]">
                <div className="flex items-start gap-3">
                  <WarningAlt size={20} className="text-red-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="font-['Lexend:SemiBold',_sans-serif] text-[12px] text-red-400 mb-1">
                      Confirm Forfeit
                    </div>
                    <div className="font-['Lexend:Regular',_sans-serif] text-[13px] text-neutral-200 mb-3">
                      By confirming, you understand a forfeiture does NOT constitute for a refund.
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleConfirmForfeit}
                        className="flex-1 bg-red-600/80 hover:bg-red-600 backdrop-blur-sm text-white font-['Lexend:SemiBold',_sans-serif] text-[11px] px-3 py-1.5 rounded-lg transition-all"
                      >
                        Confirm Forfeit
                      </button>
                      <button
                        onClick={handleCancelForfeit}
                        className="flex-1 bg-neutral-700/80 hover:bg-neutral-700 backdrop-blur-sm text-white font-['Lexend:SemiBold',_sans-serif] text-[11px] px-3 py-1.5 rounded-lg transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Pending Schedule Confirmation */}
          {pendingSchedule && !pendingSchedule.opponentConfirmed && (
            <div className="flex justify-center">
              <div className="bg-yellow-900/20 backdrop-blur-sm border border-yellow-700/50 rounded-xl p-4 max-w-[85%]">
                <div className="flex items-start gap-3">
                  <Time size={20} className="text-yellow-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="font-['Lexend:SemiBold',_sans-serif] text-[12px] text-yellow-400 mb-1">
                      Proposed Schedule
                    </div>
                    <div className="font-['Lexend:Regular',_sans-serif] text-[13px] text-neutral-200 mb-2">
                      {pendingSchedule.dateTime}
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        <CheckmarkOutline size={16} className="text-green-400" />
                        <span className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-300">You</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Time size={16} className="text-neutral-500" />
                        <span className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-500">{opponent.name}</span>
                      </div>
                    </div>
                    <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-400 mt-3">
                      Waiting for opponent confirmation...
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Confirmed Schedule */}
          {pendingSchedule && pendingSchedule.opponentConfirmed && (
            <div className="flex justify-center">
              <div className="bg-green-900/20 backdrop-blur-sm border border-green-700/50 rounded-xl p-4 max-w-[85%]">
                <div className="flex items-start gap-3">
                  <CheckmarkOutline size={20} className="text-green-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="font-['Lexend:SemiBold',_sans-serif] text-[12px] text-green-400 mb-1">
                      Match Scheduled!
                    </div>
                    <div className="font-['Lexend:Regular',_sans-serif] text-[13px] text-neutral-200">
                      {pendingSchedule.dateTime}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-neutral-700/50 flex-shrink-0 bg-neutral-800/30 backdrop-blur-sm">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              className="flex-1 bg-neutral-800/80 backdrop-blur-sm border border-neutral-700/50 rounded-lg px-4 py-2 font-['Lexend:Regular',_sans-serif] text-[13px] text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-600/90 hover:bg-blue-600 backdrop-blur-sm text-white px-4 py-2 rounded-lg transition-all flex items-center justify-center shadow-lg shadow-blue-900/20"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StandingsWidget({ isExpanded, setIsExpanded }: { isExpanded: boolean; setIsExpanded: (val: boolean) => void }) {
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

function ManagementWidget({ divisionColors }: { divisionColors: Record<string, string> }) {
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
                            {player.is_division_leader && (
                              <Crown size={14} className="text-yellow-400" />
                            )}
                            <div className="flex-1 text-left">
                              <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-50">
                                {player.name}
                              </div>
                            </div>
                            <div className="font-['Lexend:Regular',_sans-serif] text-[10px] text-neutral-400">
                              {player.wins}W-{player.losses}L
                            </div>
                          </button>
                          {selectedPlayer?.id === player.id && (
                            <div className="px-4 py-3 bg-neutral-800/30 space-y-3">
                              {player.is_dqd ? (
                                <>
                                  <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-2">
                                    <div className="font-['Lexend:SemiBold',_sans-serif] text-[10px] text-red-400 mb-1">
                                      DISQUALIFIED
                                    </div>
                                    <div className="font-['Lexend:Regular',_sans-serif] text-[10px] text-neutral-400">
                                      {player.dq_reason}
                                    </div>
                                  </div>
                                  <button className="w-full bg-blue-600/80 hover:bg-blue-600 text-white px-3 py-2 rounded-lg font-['Lexend:SemiBold',_sans-serif] text-[11px] transition-colors">
                                    Reinstate Player
                                  </button>
                                </>
                              ) : (
                                <>
                                  {editingPlayer?.id === player.id ? (
                                    <div className="space-y-2">
                                      <div className="grid grid-cols-3 gap-2">
                                        <div>
                                          <label className="font-['Lexend:Regular',_sans-serif] text-[9px] text-neutral-400 mb-1 block">Wins</label>
                                          <input
                                            type="number"
                                            value={editValues.wins}
                                            onChange={(e) => setEditValues({...editValues, wins: parseInt(e.target.value) || 0})}
                                            className="w-full bg-neutral-900 text-neutral-200 rounded px-2 py-1 font-['Lexend:Regular',_sans-serif] text-[11px] border border-neutral-700"
                                          />
                                        </div>
                                        <div>
                                          <label className="font-['Lexend:Regular',_sans-serif] text-[9px] text-neutral-400 mb-1 block">Losses</label>
                                          <input
                                            type="number"
                                            value={editValues.losses}
                                            onChange={(e) => setEditValues({...editValues, losses: parseInt(e.target.value) || 0})}
                                            className="w-full bg-neutral-900 text-neutral-200 rounded px-2 py-1 font-['Lexend:Regular',_sans-serif] text-[11px] border border-neutral-700"
                                          />
                                        </div>
                                        <div>
                                          <label className="font-['Lexend:Regular',_sans-serif] text-[9px] text-neutral-400 mb-1 block">Points</label>
                                          <input
                                            type="number"
                                            value={editValues.points}
                                            onChange={(e) => setEditValues({...editValues, points: parseInt(e.target.value) || 0})}
                                            className="w-full bg-neutral-900 text-neutral-200 rounded px-2 py-1 font-['Lexend:Regular',_sans-serif] text-[11px] border border-neutral-700"
                                          />
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <button 
                                          onClick={() => setEditingPlayer(null)}
                                          className="flex-1 bg-green-600/80 hover:bg-green-600 text-white px-3 py-2 rounded-lg font-['Lexend:SemiBold',_sans-serif] text-[11px] transition-colors flex items-center justify-center gap-1"
                                        >
                                          <Save size={14} /> Save
                                        </button>
                                        <button 
                                          onClick={() => setEditingPlayer(null)}
                                          className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-neutral-200 px-3 py-2 rounded-lg font-['Lexend:SemiBold',_sans-serif] text-[11px] transition-colors"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <button 
                                        onClick={() => {
                                          setEditingPlayer(player);
                                          setEditValues({ wins: player.wins, losses: player.losses, points: player.points });
                                        }}
                                        className="w-full bg-neutral-700 hover:bg-neutral-600 text-neutral-200 px-3 py-2 rounded-lg font-['Lexend:SemiBold',_sans-serif] text-[11px] transition-colors flex items-center justify-center gap-1"
                                      >
                                        <Edit size={14} /> Edit Record
                                      </button>
                                      
                                      {/* Action buttons row */}
                                      <div className="grid grid-cols-3 gap-2">
                                        <button 
                                          className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 px-3 py-2 rounded-lg font-['Lexend:SemiBold',_sans-serif] text-[11px] transition-colors flex items-center justify-center gap-1"
                                          title={player.is_division_leader ? 'Remove Division Leader' : 'Set Division Leader'}
                                        >
                                          <Shield size={14} />
                                        </button>
                                        <button 
                                          onClick={() => setMessageModalPlayer(player)}
                                          className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-2 rounded-lg font-['Lexend:SemiBold',_sans-serif] text-[11px] transition-colors flex items-center justify-center gap-1"
                                          title="Message Player"
                                        >
                                          <MessageCircle size={14} />
                                        </button>
                                        <button 
                                          onClick={() => setForfeitModalPlayer(player)}
                                          className="bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 px-3 py-2 rounded-lg font-['Lexend:SemiBold',_sans-serif] text-[11px] transition-colors flex items-center justify-center gap-1"
                                          title="Forfeit Player"
                                        >
                                          <Power size={14} />
                                        </button>
                                      </div>

                                      <button 
                                        onClick={() => setDqModalPlayer(player)}
                                        className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-2 rounded-lg font-['Lexend:SemiBold',_sans-serif] text-[11px] transition-colors"
                                      >
                                        Disqualify Player
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        );
                      })}
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
              alternates.map((player) => (
                <div key={player.id} className="bg-neutral-900 rounded-lg p-3">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative size-10 rounded-full overflow-hidden bg-neutral-800 shrink-0">
                      <img src={player.avatar} alt={player.name} className="size-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="font-['Lexend:SemiBold',_sans-serif] text-[12px] text-neutral-50">
                        {player.name}
                      </div>
                      <div className="font-['Lexend:Regular',_sans-serif] text-[10px] text-neutral-400">
                        Rating: {player.overall_numeric} • Added {player.date_added}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-blue-600/80 hover:bg-blue-600 text-white px-3 py-2 rounded-lg font-['Lexend:SemiBold',_sans-serif] text-[11px] transition-colors">
                      Promote to Active
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
      </div>

      {/* DQ Confirmation Modal */}
      {dqModalPlayer && createPortal(
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setDqModalPlayer(null)}
        >
          <div
            className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-['Lexend:Bold',_sans-serif] text-[18px] text-neutral-50 mb-4">
              Disqualify Player
            </div>
            <div className="font-['Lexend:Regular',_sans-serif] text-[13px] text-neutral-400 mb-4">
              Please provide a reason for disqualifying {dqModalPlayer.name}:
            </div>
            <textarea
              value={dqReason}
              onChange={(e) => setDqReason(e.target.value)}
              placeholder="Enter reason..."
              className="w-full bg-neutral-800 text-neutral-200 rounded-lg px-3 py-2 font-['Lexend:Regular',_sans-serif] text-[12px] border border-neutral-700 mb-4 min-h-[100px] resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // TODO: API call to DQ player
                  setDqModalPlayer(null);
                  setDqReason("");
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-['Lexend:SemiBold',_sans-serif] text-[12px] transition-colors"
              >
                Confirm DQ
              </button>
              <button
                onClick={() => {
                  setDqModalPlayer(null);
                  setDqReason("");
                }}
                className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-neutral-200 px-4 py-2 rounded-lg font-['Lexend:SemiBold',_sans-serif] text-[12px] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Forfeit Confirmation Modal */}
      {forfeitModalPlayer && createPortal(
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setForfeitModalPlayer(null)}
        >
          <div
            className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-['Lexend:Bold',_sans-serif] text-[18px] text-neutral-50 mb-4">
              Forfeit Player
            </div>
            <div className="font-['Lexend:Regular',_sans-serif] text-[13px] text-neutral-400 mb-4">
              Please provide a reason for forfeiting {forfeitModalPlayer.name}:
            </div>
            <textarea
              value={forfeitReason}
              onChange={(e) => setForfeitReason(e.target.value)}
              placeholder="Enter reason..."
              className="w-full bg-neutral-800 text-neutral-200 rounded-lg px-3 py-2 font-['Lexend:Regular',_sans-serif] text-[12px] border border-neutral-700 mb-4 min-h-[100px] resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // TODO: API call to forfeit player
                  setForfeitModalPlayer(null);
                  setForfeitReason("");
                }}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-['Lexend:SemiBold',_sans-serif] text-[12px] transition-colors"
              >
                Confirm Forfeit
              </button>
              <button
                onClick={() => {
                  setForfeitModalPlayer(null);
                  setForfeitReason("");
                }}
                className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-neutral-200 px-4 py-2 rounded-lg font-['Lexend:SemiBold',_sans-serif] text-[12px] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Message Player Modal */}
      {messageModalPlayer && createPortal(
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setMessageModalPlayer(null)}
        >
          <div
            className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="relative size-12 rounded-full overflow-hidden bg-neutral-800 shrink-0">
                <img src={messageModalPlayer.avatar} alt={messageModalPlayer.name} className="size-full object-cover" />
              </div>
              <div>
                <div className="font-['Lexend:Bold',_sans-serif] text-[16px] text-neutral-50">
                  Message {messageModalPlayer.name}
                </div>
                <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-400">
                  Send a direct message
                </div>
              </div>
            </div>
            <textarea
              placeholder="Type your message..."
              className="w-full bg-neutral-800 text-neutral-200 rounded-lg px-3 py-2 font-['Lexend:Regular',_sans-serif] text-[12px] border border-neutral-700 mb-4 min-h-[120px] resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // TODO: API call to send message
                  setMessageModalPlayer(null);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-['Lexend:SemiBold',_sans-serif] text-[12px] transition-colors flex items-center justify-center gap-2"
              >
                <Send size={16} /> Send Message
              </button>
              <button
                onClick={() => setMessageModalPlayer(null)}
                className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-neutral-200 px-4 py-2 rounded-lg font-['Lexend:SemiBold',_sans-serif] text-[12px] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function ScheduleWidget({ onOpenMessages, currentWeekForfeit }: { onOpenMessages: (opponent: { name: string; avatar: string; rating: number }) => void; currentWeekForfeit?: boolean }) {
  // Include all matches now (we'll handle current week specially if forfeited)
  const allMatches = currentWeekForfeit 
    ? fullSchedule 
    : fullSchedule.filter(match => match.week !== leagueInfo.currentWeek);

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-900/30 text-green-400";
      case "pending":
        return "bg-yellow-900/30 text-yellow-400";
      case "unpaid":
        return "bg-red-900/30 text-red-400";
      default:
        return "bg-neutral-800 text-neutral-400";
    }
  };

  const getResultColor = (result: string | null) => {
    if (result === "win") return "bg-green-900/30 text-green-400";
    if (result === "loss") return "bg-red-900/30 text-red-400";
    return "";
  };

  const handleMessage = (opponentName: string) => {
    console.log(`Opening message to ${opponentName}`);
  };

  const handleSchedule = (matchId: number) => {
    console.log(`Opening scheduler for match ${matchId}`);
  };

  return (
    <div
      className="bg-[#000000] rounded-2xl border border-neutral-800 overflow-hidden h-full flex flex-col flex-1"
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="font-['Lexend:SemiBold',_sans-serif] text-[16px] text-neutral-50">
            SCHEDULE
          </div>
        </div>
      </div>

      {/* Widget Content */}
      <div className="divide-y divide-neutral-800 overflow-y-auto flex-1">
        {allMatches.map((match) => {
            const isCurrentWeekForfeit = currentWeekForfeit && match.week === leagueInfo.currentWeek;
            const canMessage = !match.result && match.paymentStatus === "paid" && !isCurrentWeekForfeit;
            
            return (
              <div
                key={match.id}
                className={`p-4 transition-colors ${canMessage ? 'hover:bg-neutral-900/50 cursor-pointer' : 'cursor-default'}`}
                onClick={() => canMessage && onOpenMessages(match.opponent)}
              >
                {/* Forfeited Match Display */}
                {isCurrentWeekForfeit ? (
                  <div>
                    {/* Matchup Display: User vs Opponent with Forfeit Score */}
                    <div className="bg-neutral-900 rounded-lg p-3">
                      {/* Header with Date and Week - Centered */}
                      <div className="flex flex-col items-center mb-3 gap-1">
                        <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-500">
                          {match.scheduledDate}
                        </div>
                        <div className="font-['Lexend:Bold',_sans-serif] text-[13px] text-neutral-400">
                          Week {match.week}
                        </div>
                      </div>

                      <div className="flex items-start justify-center gap-6">
                        {/* User Side */}
                        <div className="flex flex-col items-center gap-1.5 min-w-0 w-[90px]">
                          <div className="relative size-12 rounded-full overflow-hidden bg-neutral-800 shrink-0">
                            <img
                              src={currentUser.avatar}
                              alt={currentUser.name}
                              className="size-full object-cover"
                            />
                          </div>
                          <div className="font-['Lexend:SemiBold',_sans-serif] text-[12px] text-neutral-50 h-[18px] flex items-center w-full px-1 justify-center overflow-hidden text-ellipsis whitespace-nowrap">
                            {currentUser.name}
                          </div>
                          <div className="font-['Lexend:Bold',_sans-serif] text-[20px] h-[28px] flex items-center text-red-400">
                            0
                          </div>
                        </div>

                        {/* VS Divider */}
                        <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-500 flex items-center h-12 shrink-0">
                          vs.
                        </div>

                        {/* Opponent Side */}
                        <div className="flex flex-col items-center gap-1.5 min-w-0 w-[90px]">
                          <div className="relative size-12 rounded-full overflow-hidden bg-neutral-800 shrink-0">
                            <img
                              src={match.opponent.avatar}
                              alt={match.opponent.name}
                              className="size-full object-cover"
                            />
                          </div>
                          <div className="font-['Lexend:SemiBold',_sans-serif] text-[12px] text-neutral-50 h-[18px] flex items-center w-full px-1 justify-center overflow-hidden text-ellipsis whitespace-nowrap">
                            {match.opponent.name}
                          </div>
                          <div className="font-['Lexend:Bold',_sans-serif] text-[20px] h-[28px] flex items-center text-green-400">
                            3
                          </div>
                        </div>
                      </div>

                      {/* Forfeit Tag */}
                      <div className="flex items-center justify-center mt-3 pt-2 border-t border-neutral-800">
                        <div className="font-['Lexend:SemiBold',_sans-serif] text-[11px] px-2 py-0.5 rounded uppercase bg-red-900/30 text-red-400">
                          forfeited
                        </div>
                      </div>
                    </div>
                  </div>
                ) : match.result && match.finalScore ? (
                  <div>
                    {/* Completed Match Display - Matchup Display: User vs Opponent with Score */}
                    <div className="bg-neutral-900 rounded-lg p-3">
                      {/* Header with Date and Week - Centered */}
                      <div className="flex flex-col items-center mb-3 gap-1">
                        <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-500">
                          {match.scheduledDate}
                        </div>
                        <div className="font-['Lexend:Bold',_sans-serif] text-[13px] text-neutral-400">
                          Week {match.week}
                        </div>
                      </div>

                      <div className="flex items-start justify-center gap-6">
                        {/* User Side */}
                        <div className="flex flex-col items-center gap-1.5 min-w-0 w-[90px]">
                          <div className="relative size-12 rounded-full overflow-hidden bg-neutral-800 shrink-0">
                            <img
                              src={currentUser.avatar}
                              alt={currentUser.name}
                              className="size-full object-cover"
                            />
                          </div>
                          <div className="font-['Lexend:SemiBold',_sans-serif] text-[12px] text-neutral-50 h-[18px] flex items-center w-full px-1 justify-center overflow-hidden text-ellipsis whitespace-nowrap">
                            {currentUser.name}
                          </div>
                          <div
                            className={`font-['Lexend:Bold',_sans-serif] text-[20px] h-[28px] flex items-center ${
                              match.result === "win" ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {match.finalScore.user}
                          </div>
                        </div>

                        {/* VS Divider */}
                        <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-500 flex items-center h-12 shrink-0">
                          vs.
                        </div>

                        {/* Opponent Side */}
                        <div className="flex flex-col items-center gap-1.5 min-w-0 w-[90px]">
                          <div className="relative size-12 rounded-full overflow-hidden bg-neutral-800 shrink-0">
                            <img
                              src={match.opponent.avatar}
                              alt={match.opponent.name}
                              className="size-full object-cover"
                            />
                          </div>
                          <div className="font-['Lexend:SemiBold',_sans-serif] text-[12px] text-neutral-50 h-[18px] flex items-center w-full px-1 justify-center overflow-hidden text-ellipsis whitespace-nowrap">
                            {match.opponent.name}
                          </div>
                          <div
                            className={`font-['Lexend:Bold',_sans-serif] text-[20px] h-[28px] flex items-center ${
                              match.result === "loss" ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {match.finalScore.opponent}
                          </div>
                        </div>
                      </div>

                      {/* Result Tag */}
                      <div className="flex items-center justify-center mt-3 pt-2 border-t border-neutral-800">
                        <div className="flex items-center gap-2">
                          {match.disputed && (
                            <WarningAlt size={16} className="text-yellow-400" title="Score disputed - flagged for review" />
                          )}
                          <div
                            className={`font-['Lexend:SemiBold',_sans-serif] text-[11px] px-2 py-0.5 rounded uppercase ${getResultColor(
                              match.result
                            )}`}
                          >
                            {match.result}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Upcoming Match Display
                  <div>
                    {/* Matchup Display: User vs Opponent */}
                    <div className="bg-neutral-900 rounded-lg p-3">
                      {/* Header with Week and Status */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-['Lexend:SemiBold',_sans-serif] text-[13px] text-neutral-400">
                          Week {match.week}
                        </div>
                        <div
                          className={`font-['Lexend:SemiBold',_sans-serif] text-[11px] px-2 py-0.5 rounded uppercase ${getPaymentStatusColor(
                            match.paymentStatus
                          )}`}
                        >
                          {match.paymentStatus}
                        </div>
                      </div>

                      <div className="flex items-center justify-center mb-3">
                        {/* Opponent Info */}
                        <div className="flex flex-col items-center gap-2">
                          <div className="relative size-12 rounded-full overflow-hidden bg-neutral-800 shrink-0">
                            <img
                              src={match.opponent.avatar}
                              alt={match.opponent.name}
                              className="size-full object-cover"
                            />
                          </div>
                          <div className="font-['Lexend:SemiBold',_sans-serif] text-[13px] text-neutral-50 text-center">
                            {match.opponent.name}
                          </div>
                        </div>
                      </div>

                      {/* Schedule Info */}
                      {match.scheduledDate ? (
                        <div className="text-center pt-2 border-t border-neutral-800">
                          <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-400 mb-1">
                            Scheduled
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <div>
                              <div className="font-['Lexend:SemiBold',_sans-serif] text-[13px] text-neutral-50">
                                {match.scheduledDate}
                              </div>
                              <div className="font-['Lexend:SemiBold',_sans-serif] text-[13px] text-blue-400">
                                {match.scheduledTime}
                              </div>
                            </div>
                            <button
                              onClick={() => handleSchedule(match.id)}
                              className="font-['Lexend:Regular',_sans-serif] text-[11px] text-blue-400 hover:text-blue-300 transition-colors underline ml-2"
                            >
                              Reschedule
                            </button>
                          </div>
                        </div>
                      ) : match.paymentStatus === "paid" ? (
                        <div className="pt-2 border-t border-neutral-800">
                          <button
                            onClick={() => handleSchedule(match.id)}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-['Lexend:SemiBold',_sans-serif] text-[12px] px-3 py-1.5 rounded-lg transition-colors w-full"
                          >
                            Schedule Match
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

function LeagueInfoWidget({ 
  onOpenMessages,
  currentMatchSchedule,
  hasUnreadMessages,
  isAdminView = false
}: { 
  onOpenMessages: (opponent: { name: string; avatar: string; rating: number }) => void;
  currentMatchSchedule: { date: string | null; time: string | null; isPending?: boolean; isForfeit?: boolean };
  hasUnreadMessages?: boolean;
  isAdminView?: boolean;
}) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showFormatTooltip, setShowFormatTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);

  const handlePaymentClick = (paymentApp: typeof paymentOptions[0]) => {
    // Open the payment app URL in a new window
    window.open(paymentApp.url, '_blank');
    setShowPaymentModal(false);
  };

  const getPlaceSuffix = (place: number) => {
    if (place === 0) return "";
    if (place === 1) return "st";
    if (place === 2) return "nd";
    if (place === 3) return "rd";
    return "th";
  };

  const handleFormatClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      top: rect.top,
      left: rect.right + 8
    });
    setShowFormatTooltip(!showFormatTooltip);
  };

  return (
    <>
      <div className="bg-[#000000] rounded-2xl border border-neutral-800 overflow-hidden w-auto">
        {/* Widget Header */}
        <div className="flex items-center justify-center px-4 py-3 border-b border-neutral-800">
          <div className="font-['Lexend:SemiBold',_sans-serif] text-[13px] text-neutral-50">
            OVERVIEW
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {isAdminView ? (
            <>
              {/* League Stats for Admin View */}
              {/* Total Players */}
              <div className="bg-neutral-900 rounded-lg p-3">
                <div className="font-['Lexend:Regular',_sans-serif] text-[9px] text-neutral-400 mb-1">
                  Total Players
                </div>
                <div className="font-['Lexend:Bold',_sans-serif] text-[18px] text-neutral-50">
                  {leagueStats.totalPlayers}
                </div>
              </div>

              {/* Pending Approvals - Only show during registration */}
              {!leagueStatus.hasStarted && (
                <>
                  <div className="bg-neutral-900 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-['Lexend:Regular',_sans-serif] text-[9px] text-neutral-400 mb-1">
                          Pending Approvals
                        </div>
                        <div className="font-['Lexend:Bold',_sans-serif] text-[18px] text-neutral-50">
                          {leagueStats.pendingApprovalsCount}
                        </div>
                      </div>
                      {leagueStats.pendingApprovalsCount > 0 && (
                        <div className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                          <div className="font-['Lexend:SemiBold',_sans-serif] text-[10px]">
                            {leagueStats.pendingApprovalsCount}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-neutral-800"></div>
                </>
              )}

              {/* Payment Status */}
              <div className="bg-neutral-900 rounded-lg p-3">
                <div className="font-['Lexend:Regular',_sans-serif] text-[9px] text-neutral-400 mb-2">
                  Payment Status
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-300">
                      Paid
                    </div>
                    <div className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-green-400">
                      {leagueStats.paidCount}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-300">
                      Due
                    </div>
                    <div className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-yellow-400">
                      {leagueStats.dueCount}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-300">
                      Late
                    </div>
                    <div className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-red-400">
                      {leagueStats.lateCount}
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Week Progress */}
              <div className="bg-neutral-900 rounded-lg p-3">
                <div className="font-['Lexend:Regular',_sans-serif] text-[9px] text-neutral-400 mb-2">
                  Week {leagueInfo.currentWeek} Matches
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-['Lexend:Bold',_sans-serif] text-[16px] text-neutral-50">
                    {leagueStats.completedMatches} / {leagueStats.totalMatches}
                  </div>
                  <div className="font-['Lexend:Regular',_sans-serif] text-[10px] text-neutral-400">
                    Completed
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* User Profile Pic */}
              <div className="flex justify-center">
                <div className="relative size-14 rounded-full overflow-hidden bg-neutral-800">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="size-full object-cover"
                  />
                </div>
              </div>

              {/* Username */}
              <div className="text-center">
                <div className="font-['Lexend:SemiBold',_sans-serif] text-[13px] text-neutral-50">
                  {currentUser.name}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-neutral-800"></div>

              {/* Week */}
              <div className="bg-neutral-900 rounded-lg p-2 text-center">
                <div className="font-['Lexend:Regular',_sans-serif] text-[9px] text-neutral-400 mb-1">
                  Week
                </div>
                <div className="font-['Lexend:Bold',_sans-serif] text-[16px] text-neutral-50">
                  {leagueInfo.currentWeek}
                </div>
              </div>

              {/* Place */}
              <div className="bg-neutral-900 rounded-lg p-2 text-center">
                <div className="font-['Lexend:Regular',_sans-serif] text-[9px] text-neutral-400 mb-1">
                  Place
                </div>
                <div className="font-['Lexend:Bold',_sans-serif] text-[16px] text-blue-400">
                  {userStatus.standingsPlace === 0 ? "-" : `${userStatus.standingsPlace}${getPlaceSuffix(userStatus.standingsPlace)}`}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-neutral-800"></div>

              {/* Match */}
              <button
            onClick={() => onOpenMessages(currentMatchup.opponent)}
            className="bg-neutral-900 rounded-lg p-2 w-full relative hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            {/* Unread indicator dot */}
            {hasUnreadMessages && (
              <div className="absolute top-2 right-2 size-2.5 bg-blue-500 rounded-full animate-pulse" />
            )}
            
            <div className="font-['Lexend:Regular',_sans-serif] text-[9px] text-neutral-400 mb-2 text-center">
              Match
            </div>
            
            {/* Opponent Name */}
            <div className="text-center mb-2">
              <div className="font-['Lexend:SemiBold',_sans-serif] text-[12px] text-neutral-50">
                {currentMatchup.opponent.name}
              </div>
            </div>

            {/* Match Status - Message icon, Pending*, Date/Time, or Forfeited */}
            {currentMatchSchedule.isForfeit ? (
              <div className="text-center space-y-1">
                <div className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-neutral-300">
                  {currentUser.name}
                </div>
                <div className="font-['Lexend:Bold',_sans-serif] text-[13px] text-red-500">
                  FORFEITED
                </div>
              </div>
            ) : currentMatchSchedule.date && currentMatchSchedule.time ? (
              <div className="text-center space-y-1">
                <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-300">
                  {currentMatchSchedule.date}
                </div>
                <div className={`font-['Lexend:SemiBold',_sans-serif] text-[11px] ${currentMatchSchedule.isPending ? 'text-yellow-400' : 'text-blue-400'}`}>
                  {currentMatchSchedule.time}{currentMatchSchedule.isPending ? '*' : ''}
                </div>
                {currentMatchSchedule.isPending && (
                  <div className="font-['Lexend:Regular',_sans-serif] text-[8px] text-yellow-400/70 mt-1">
                    Awaiting confirmation
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="text-neutral-400 p-2">
                  <Send size={20} />
                </div>
              </div>
            )}
          </button>

          {/* Format */}
          <div 
            className="bg-neutral-900 rounded-lg p-2 text-center relative cursor-pointer hover:bg-neutral-800 transition-colors"
            onClick={handleFormatClick}
          >
            <div className="font-['Lexend:Regular',_sans-serif] text-[9px] text-neutral-400 mb-1 underline">
              Format
            </div>
            <div className="flex flex-col gap-1">
              <div className="bg-neutral-800 font-['Lexend:Regular',_sans-serif] text-[9px] text-neutral-300 px-1.5 py-0.5 rounded">
                501
              </div>
              <div className="bg-neutral-800 font-['Lexend:Regular',_sans-serif] text-[9px] text-neutral-300 px-1.5 py-0.5 rounded">
                CR
              </div>
              <div className="bg-neutral-800 font-['Lexend:Regular',_sans-serif] text-[9px] text-neutral-300 px-1.5 py-0.5 rounded">
                CH
              </div>
            </div>
          </div>

          {/* Dues */}
          <button
            onClick={() => {
              if (userStatus.paymentStatus !== "paid") {
                setShowPaymentModal(true);
              }
            }}
            disabled={userStatus.paymentStatus === "paid"}
            className={`bg-neutral-900 rounded-lg p-2 flex items-center justify-center w-full ${
              userStatus.paymentStatus !== "paid"
                ? "cursor-pointer hover:bg-neutral-800 active:scale-95 transition-all"
                : "cursor-default"
            }`}
          >
            <div className="flex flex-col items-center gap-0.5 w-full">
              <div className="font-['Lexend:Regular',_sans-serif] text-[9px] text-neutral-400 mb-0.5">
                Dues
              </div>
              {userStatus.paymentStatus === "paid" ? (
                <div className="flex flex-col items-center gap-1">
                  <CheckmarkOutline size={24} className="text-green-400" />
                  <div className="font-['Lexend:Regular',_sans-serif] text-[9px] text-green-400">
                    Paid
                  </div>
                </div>
              ) : userStatus.paymentStatus === "late" ? (
                <div className="flex flex-col items-center gap-1">
                  <WarningAlt size={24} className="text-red-400" />
                  <div className="font-['Lexend:SemiBold',_sans-serif] text-[10px] text-red-400">
                    PAY NOW
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Time size={24} className="text-yellow-400" />
                  <div className="font-['Lexend:SemiBold',_sans-serif] text-[10px] text-yellow-400">
                    PAY NOW
                  </div>
                </div>
              )}
            </div>
          </button>
            </>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPaymentModal(false)}
        >
          <div
            className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="font-['Lexend:Bold',_sans-serif] text-[18px] text-neutral-50 mb-1">
                  Submit Payment
                </div>
                <div className="font-['Lexend:Regular',_sans-serif] text-[13px] text-neutral-400">
                  Week {leagueInfo.currentWeek} • ${leagueInfo.prizePerWin}
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-neutral-400 hover:text-neutral-200 transition-colors p-2"
              >
                <Close size={24} />
              </button>
            </div>

            {/* Payment Options */}
            <div className="space-y-3">
              <div className="font-['Lexend:SemiBold',_sans-serif] text-[13px] text-neutral-300 mb-3">
                Select Payment Method
              </div>
              {paymentOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={() => handlePaymentClick(option)}
                  className="w-full bg-neutral-800 hover:bg-neutral-700 active:scale-98 rounded-lg p-4 flex items-center gap-4 transition-all group"
                >
                  <img src={option.icon} alt={option.name} className="size-12 rounded-lg" />
                  <div className="flex-1 text-left">
                    <div className="font-['Lexend:SemiBold',_sans-serif] text-[15px] text-neutral-50 group-hover:text-blue-400 transition-colors">
                      {option.name}
                    </div>
                    <div className="font-['Lexend:Regular',_sans-serif] text-[12px] text-neutral-400">
                      {option.username}
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-neutral-500 group-hover:text-neutral-300 transition-colors" />
                </button>
              ))}
            </div>

            {/* Note */}
            <div className="mt-6 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
              <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-yellow-400">
                Please, only send friends and family. If you select another option you will be refunded and not credit for that week. If you do not resubmit payment before the deadline the late fee will apply.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Format Tooltip Portal */}
      {showFormatTooltip && tooltipPosition && createPortal(
        <>
          {/* Backdrop to close tooltip */}
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setShowFormatTooltip(false)}
          />
          {/* Tooltip */}
          <div 
            className="fixed bg-neutral-800 border border-neutral-700 rounded-lg p-3 shadow-xl z-[9999] w-64"
            style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
          >
            <div className="space-y-2">
              <div>
                <div className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-blue-400">
                  Game 1: 501
                </div>
              </div>
              <div>
                <div className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-blue-400">
                  Game 2: CR
                </div>
              </div>
              <div>
                <div className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-blue-400">
                  Game 3: CH
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
        </>,
        document.body
      )}
    </>
  );
}

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
        
        <div className="font-['Lexend:Regular',_sans-serif] text-[12px] text-neutral-400">
          Division: Name Rank: 5.99
        </div>
        <div className="font-['Lexend:Regular',_sans-serif] text-[12px] text-neutral-400">
          Payment Due: Every Sunday at 12AM CST
        </div>
      </div>

      {isAdminView ? (
        <div className="space-y-4 w-full">
          {/* Division Selector - Scrollable */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {divisions.map((division) => {
              const currentColor = divisionColors[division.id] || division.color;
              
              // Check if it's a hue value or named color
              const isHueColor = currentColor.startsWith('hue-');
              const hueValue = isHueColor ? parseInt(currentColor.replace('hue-', '')) : null;
              
              const colorDotMap: Record<string, string> = {
                blue: "bg-blue-500",
                purple: "bg-purple-500",
                green: "bg-green-500",
                orange: "bg-orange-500",
                red: "bg-red-500",
                yellow: "bg-yellow-500",
                pink: "bg-pink-500",
                cyan: "bg-cyan-500",
                indigo: "bg-indigo-500",
                lime: "bg-lime-500",
                teal: "bg-teal-500",
                fuchsia: "bg-fuchsia-500",
              };
              
              const handleMouseDown = () => {
                const timer = setTimeout(() => {
                  // Initialize hue based on current color
                  if (isHueColor && hueValue !== null) {
                    setSelectedHue(hueValue);
                  } else {
                    // Default hues for named colors
                    const namedColorHues: Record<string, number> = {
                      red: 0, orange: 30, yellow: 60, lime: 90,
                      green: 120, teal: 150, cyan: 180, blue: 210,
                      indigo: 240, purple: 270, fuchsia: 300, pink: 330
                    };
                    setSelectedHue(namedColorHues[currentColor] || 210);
                  }
                  setColorPickerDivision(division);
                }, 500); // 500ms long press
                setPressTimer(timer);
              };
              
              const handleMouseUp = () => {
                if (pressTimer) {
                  clearTimeout(pressTimer);
                  setPressTimer(null);
                }
              };
              
              const handleClick = () => {
                if (!pressTimer) return; // Don't select if long-pressed
                setSelectedDivision(division.id);
              };
              
              return (
                <button
                  key={division.id}
                  onClick={handleClick}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleMouseDown}
                  onTouchEnd={handleMouseUp}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl border transition-all ${
                    selectedDivision === division.id
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-neutral-800/50 border-neutral-700/50 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600'
                  }`}
                >
                  <div className="flex items-center gap-2 justify-center mb-1">
                    {isHueColor ? (
                      <div 
                        className="size-2 rounded-full" 
                        style={{ backgroundColor: `hsl(${hueValue}, 70%, 55%)` }}
                      />
                    ) : (
                      <div className={`size-2 rounded-full ${colorDotMap[currentColor]}`} />
                    )}
                    <div className="font-['Lexend:SemiBold',_sans-serif] text-[11px] whitespace-nowrap">
                      {division.name}
                    </div>
                  </div>
                  <div className="font-['Lexend:Regular',_sans-serif] text-[9px] opacity-80">
                    {division.playerCount} players
                  </div>
                </button>
              );
            })}
          </div>

          {/* Admin Content and Standings */}
          <div className="flex gap-4 w-full">
            {/* Admin View Layout */}
            <div className="flex-1 space-y-4">
              {/* Stats Cards Grid - 2x2 */}
              <div className="grid grid-cols-2 gap-4">
              {/* Total Players */}
              <div className="bg-[#000000] rounded-2xl border border-neutral-800 p-4">
                <div className="font-['Lexend:Regular',_sans-serif] text-[9px] text-neutral-400 mb-1">
                  Total Players ({divisions.find(d => d.id === selectedDivision)?.name})
                </div>
                <div className="font-['Lexend:Bold',_sans-serif] text-[24px] text-neutral-50">
                  {divisions.find(d => d.id === selectedDivision)?.playerCount || 0}
                </div>
              </div>

              {/* Pending Approvals - Only show during registration */}
              {!leagueStatus.hasStarted ? (
                <div className="bg-[#000000] rounded-2xl border border-neutral-800 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-['Lexend:Regular',_sans-serif] text-[9px] text-neutral-400 mb-1">
                        Pending Approvals
                      </div>
                      <div className="font-['Lexend:Bold',_sans-serif] text-[24px] text-neutral-50">
                        {leagueStats.pendingApprovalsCount}
                      </div>
                    </div>
                    {leagueStats.pendingApprovalsCount > 0 && (
                      <div className="bg-yellow-500/20 text-yellow-400 px-3 py-1.5 rounded-full">
                        <div className="font-['Lexend:SemiBold',_sans-serif] text-[12px]">
                          {leagueStats.pendingApprovalsCount}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-[#000000] rounded-2xl border border-neutral-800 p-4">
                  <div className="font-['Lexend:Regular',_sans-serif] text-[9px] text-neutral-400 mb-2">
                    Payment Status
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-300">
                        Paid
                      </div>
                      <div className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-green-400">
                        {leagueStats.paidCount}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-300">
                        Due
                      </div>
                      <div className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-yellow-400">
                        {leagueStats.dueCount}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-300">
                        Late
                      </div>
                      <div className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-red-400">
                        {leagueStats.lateCount}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Status (when league hasn't started) or Prize Pool */}
              {!leagueStatus.hasStarted ? (
                <div className="bg-[#000000] rounded-2xl border border-neutral-800 p-4">
                  <div className="font-['Lexend:Regular',_sans-serif] text-[9px] text-neutral-400 mb-2">
                    Payment Status
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-300">
                        Paid
                      </div>
                      <div className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-green-400">
                        {leagueStats.paidCount}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-300">
                        Due
                      </div>
                      <div className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-yellow-400">
                        {leagueStats.dueCount}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-300">
                        Late
                      </div>
                      <div className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-red-400">
                        {leagueStats.lateCount}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#000000] rounded-2xl border border-neutral-800 p-4">
                  <div className="font-['Lexend:Regular',_sans-serif] text-[9px] text-neutral-400 mb-1">
                    Total Prize Pool
                  </div>
                  <div className="font-['Lexend:Bold',_sans-serif] text-[24px] text-green-400">
                    ${leagueInfo.potTotal}
                  </div>
                </div>
              )}

              {/* Current Week Progress */}
              <div className="bg-[#000000] rounded-2xl border border-neutral-800 p-4">
                <div className="font-['Lexend:Regular',_sans-serif] text-[9px] text-neutral-400 mb-1">
                  Week {leagueInfo.currentWeek} Matches
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-['Lexend:Bold',_sans-serif] text-[24px] text-neutral-50">
                    {leagueStats.completedMatches} / {leagueStats.totalMatches}
                  </div>
                  <div className="font-['Lexend:Regular',_sans-serif] text-[10px] text-neutral-400">
                    Completed
                  </div>
                </div>
              </div>
            </div>

            {/* Management Widget */}
            <div className="h-[400px]">
              <ManagementWidget divisionColors={divisionColors} />
            </div>
          </div>

          {/* Standings Widget */}
          <StandingsWidget 
            isExpanded={standingsExpanded} 
            setIsExpanded={setStandingsExpanded} 
          />
        </div>
      </div>
      ) : (
        <div className="flex gap-4 w-full h-[600px]">
          <LeagueInfoWidget 
            onOpenMessages={(opponent) => {
              setMessagingOpponent(opponent);
              setHasUnreadMessages(false); // Clear unread when opening
            }} 
            currentMatchSchedule={currentMatchSchedule}
            hasUnreadMessages={hasUnreadMessages}
            isAdminView={isAdminView}
          />
          <ScheduleWidget 
            onOpenMessages={(opponent) => setMessagingOpponent(opponent)}
            currentWeekForfeit={currentWeekForfeit}
          />
          <StandingsWidget 
            isExpanded={standingsExpanded} 
            setIsExpanded={setStandingsExpanded} 
          />
        </div>
      )}

      {/* Match Lobby Widget */}
      {showMatchLobby && matchLobbyTime && (
        <div className="mt-4">
          <MatchLobbyWidget
            opponent={{
              name: "Sarah Johnson",
              avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
            }}
            matchTime={matchLobbyTime}
            onMatchComplete={(confirmed) => {
              if (confirmed) {
                setShowMatchLobby(false);
                // Match completed successfully
              }
              // If not confirmed, the widget shows dispute message
            }}
          />
        </div>
      )}

      {/* Messaging Modal */}
      {messagingOpponent && (
        <MessagingModal 
          opponent={messagingOpponent}
          onClose={() => setMessagingOpponent(null)}
          onScheduleConfirmed={handleScheduleConfirmed}
          onNewMessage={() => setHasUnreadMessages(true)}
        />
      )}

      {/* Announcement Modal */}
      {showAnnouncementModal && createPortal(
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAnnouncementModal(false)}
        >
          <div
            className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="font-['Lexend:Bold',_sans-serif] text-[18px] text-neutral-50 mb-1">
                  Send Announcement
                </div>
                <div className="font-['Lexend:Regular',_sans-serif] text-[12px] text-neutral-400">
                  Message will be sent to all league participants
                </div>
              </div>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="text-neutral-400 hover:text-neutral-200 transition-colors p-2"
              >
                <Close size={20} />
              </button>
            </div>
            <textarea
              placeholder="Type your announcement here..."
              className="w-full bg-neutral-800 text-neutral-200 rounded-lg px-3 py-2 font-['Lexend:Regular',_sans-serif] text-[13px] border border-neutral-700 mb-4 min-h-[120px] resize-none focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => {
                // TODO: API call to send announcement
                setShowAnnouncementModal(false);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-['Lexend:SemiBold',_sans-serif] text-[13px] transition-colors flex items-center justify-center gap-2"
            >
              <Megaphone size={16} />
              Send to All Players
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Color Picker Modal */}
      {colorPickerDivision && createPortal(
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setColorPickerDivision(null)}
        >
          <div
            className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="font-['Lexend:Bold',_sans-serif] text-[18px] text-neutral-50 mb-1">
                  Division Color
                </div>
                <div className="font-['Lexend:Regular',_sans-serif] text-[12px] text-neutral-400">
                  Choose a color for {colorPickerDivision.name}
                </div>
              </div>
              <button
                onClick={() => setColorPickerDivision(null)}
                className="text-neutral-400 hover:text-neutral-200 transition-colors p-2"
              >
                <Close size={20} />
              </button>
            </div>
            
            {/* Hue Slider */}
            <div className="space-y-4">
              {/* Preview Circle */}
              <div className="flex flex-col items-center gap-3">
                <div 
                  className="size-24 rounded-full shadow-xl ring-4 ring-neutral-800"
                  style={{ backgroundColor: `hsl(${selectedHue}, 70%, 55%)` }}
                />
                <div className="text-center">
                  <div className="font-['Lexend:SemiBold',_sans-serif] text-[13px] text-neutral-200">
                    Preview
                  </div>
                  <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-500">
                    HSL({Math.round(selectedHue)}, 70%, 55%)
                  </div>
                </div>
              </div>
              
              {/* Hue Slider */}
              <div className="space-y-2">
                <label className="font-['Lexend:SemiBold',_sans-serif] text-[11px] text-neutral-300">
                  Hue: {Math.round(selectedHue)}°
                </label>
                <div className="relative h-10 rounded-xl overflow-hidden border-2 border-neutral-700" style={{
                  background: 'linear-gradient(to right, hsl(0, 70%, 55%), hsl(30, 70%, 55%), hsl(60, 70%, 55%), hsl(90, 70%, 55%), hsl(120, 70%, 55%), hsl(150, 70%, 55%), hsl(180, 70%, 55%), hsl(210, 70%, 55%), hsl(240, 70%, 55%), hsl(270, 70%, 55%), hsl(300, 70%, 55%), hsl(330, 70%, 55%), hsl(360, 70%, 55%))'
                }}>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={selectedHue}
                    onChange={(e) => setSelectedHue(parseInt(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-1 h-full bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)] pointer-events-none transition-all"
                    style={{ left: `${(selectedHue / 360) * 100}%`, transform: 'translate(-50%, -50%)' }}
                  />
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 size-6 rounded-full bg-white shadow-lg pointer-events-none border-2 border-neutral-900"
                    style={{ 
                      left: `${(selectedHue / 360) * 100}%`, 
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: `hsl(${selectedHue}, 70%, 55%)`
                    }}
                  />
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={() => {
                  const hueToColorName = (hue: number) => {
                    if (hue >= 0 && hue < 15) return 'red';
                    if (hue >= 15 && hue < 45) return 'orange';
                    if (hue >= 45 && hue < 75) return 'yellow';
                    if (hue >= 75 && hue < 105) return 'lime';
                    if (hue >= 105 && hue < 135) return 'green';
                    if (hue >= 135 && hue < 165) return 'teal';
                    if (hue >= 165 && hue < 195) return 'cyan';
                    if (hue >= 195 && hue < 225) return 'blue';
                    if (hue >= 225 && hue < 255) return 'indigo';
                    if (hue >= 255 && hue < 285) return 'purple';
                    if (hue >= 285 && hue < 315) return 'fuchsia';
                    if (hue >= 315 && hue < 345) return 'pink';
                    return 'red';
                  };
                  
                  setDivisionColors({
                    ...divisionColors,
                    [colorPickerDivision.id]: `hue-${selectedHue}`
                  });
                  setColorPickerDivision(null);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-['Lexend:SemiBold',_sans-serif] text-[13px] transition-colors"
              >
                Save Color
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Info Modal */}
      {showInfoModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowInfoModal(false)}
        >
          <div
            className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="font-['Lexend:Bold',_sans-serif] text-[20px] text-neutral-50">
                Dashboard Guide
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-neutral-400 hover:text-neutral-200 transition-colors p-2"
              >
                <Close size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-5">
              {/* Overview Section */}
              <div>
                <div className="font-['Lexend:SemiBold',_sans-serif] text-[15px] text-blue-400 mb-2">
                  📊 Overview Widget
                </div>
                <div className="font-['Lexend:Regular',_sans-serif] text-[13px] text-neutral-300 leading-relaxed">
                  Shows your profile, current week, standings position, and match details. Click the payment icon to submit dues when they're pending. Tap format section headers to view detailed rules.
                </div>
              </div>

              {/* Schedule Section */}
              <div>
                <div className="font-['Lexend:SemiBold',_sans-serif] text-[15px] text-purple-400 mb-2">
                  📅 Schedule Widget
                </div>
                <div className="font-['Lexend:Regular',_sans-serif] text-[13px] text-neutral-300 leading-relaxed">
                  View and manage upcoming matches. Click the message icon to chat with opponents and schedule games. Use chat commands to set times or forfeit matches.
                </div>
              </div>

              {/* Standings Section */}
              <div>
                <div className="font-['Lexend:SemiBold',_sans-serif] text-[15px] text-green-400 mb-2">
                  🏆 Standings Drawer
                </div>
                <div className="font-['Lexend:Regular',_sans-serif] text-[13px] text-neutral-300 leading-relaxed">
                  Click the standings tab to slide out the full leaderboard. View rankings, ratings (CR, O1, Overall), and wins for all players. Click outside or on the backdrop to close.
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
                  Appears 5 minutes before scheduled match time. Shows countdown, both players, and ready status. At 2 minutes, click "Ready in Lobby" to begin. Report each game result, then submit final score. Both players must confirm same score or it's flagged for admin review.
                </div>
              </div>

              {/* Tips Section */}
              <div className="pt-4 border-t border-neutral-800">
                <div className="font-['Lexend:SemiBold',_sans-serif] text-[14px] text-neutral-200 mb-2">
                  💡 Quick Tips
                </div>
                <ul className="space-y-2 font-['Lexend:Regular',_sans-serif] text-[13px] text-neutral-400">
                  <li>• Red notification badges indicate unread messages</li>
                  <li>• Pending matches show as "TBD" until scheduled</li>
                  <li>• Forfeited matches appear with "FORFEITED" status</li>
                  <li>• All dates are calculated from current week</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
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