import { useState } from "react";
import { Send, WarningAlt, CheckmarkOutline, Time, Close, Information } from "@carbon/icons-react";

// Messages data - Replace with your API data
const mockMessages: any[] = [];

export function MessagingModal({ 
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
