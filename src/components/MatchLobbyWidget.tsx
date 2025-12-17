import { useState, useEffect } from "react";
import { WarningAlt } from "@carbon/icons-react";

// Current user info - Replace with your API data
const currentUser = {
  name: "",
  avatar: "",
};

export function MatchLobbyWidget({ 
  opponent, 
  matchTime,
  onMatchComplete 
}: { 
  opponent: { name: string; avatar: string; };
  matchTime: Date;
  onMatchComplete: (confirmed: boolean) => void;
}) {
  const [timeUntilMatch, setTimeUntilMatch] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [gameScores, setGameScores] = useState<{ player: number; opponent: number }[]>([]);
  const [currentGame, setCurrentGame] = useState(1);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [matchSubmitted, setMatchSubmitted] = useState(false);
  const [scoreDisputed, setScoreDisputed] = useState(false);

  // Update countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = matchTime.getTime() - now.getTime();
      setTimeUntilMatch(Math.max(0, Math.floor(diff / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [matchTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGameResult = (playerWon: boolean) => {
    const newScores = [...gameScores, { 
      player: playerWon ? 1 : 0, 
      opponent: playerWon ? 0 : 1 
    }];
    setGameScores(newScores);
    
    const playerWins = newScores.reduce((sum, game) => sum + game.player, 0);
    const opponentWins = newScores.reduce((sum, game) => sum + game.opponent, 0);
    
    setPlayerScore(playerWins);
    setOpponentScore(opponentWins);
    
    // Best of 3, so first to 2 wins
    if (playerWins === 2 || opponentWins === 2 || newScores.length === 3) {
      // Match complete, ready to submit
      setCurrentGame(newScores.length + 1);
    } else {
      setCurrentGame(newScores.length + 1);
    }
  };

  const handleSubmitScore = () => {
    setMatchSubmitted(true);
    // TODO: Send score to backend API
    // Backend should handle opponent confirmation and disputes
    // For now, just call onMatchComplete
    onMatchComplete(true);
  };

  const canShowReady = timeUntilMatch <= 120 && timeUntilMatch > 0;
  const matchStarted = timeUntilMatch === 0 || isReady;

  return (
    <div className="w-full bg-neutral-900/90 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="font-['Lexend:Bold',_sans-serif] text-[16px] text-neutral-50">
          Match Lobby
        </div>
        {!matchStarted && (
          <div className="font-['Lexend:Bold',_sans-serif] text-[20px] text-blue-400">
            {formatTime(timeUntilMatch)}
          </div>
        )}
      </div>

      {/* Players */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <img src={currentUser.avatar} alt={currentUser.name} className="size-12 rounded-full" />
          <div>
            <div className="font-['Lexend:SemiBold',_sans-serif] text-[14px] text-neutral-50">
              {currentUser.name}
            </div>
            {isReady && (
              <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-green-400">
                ✓ Ready
              </div>
            )}
          </div>
        </div>

        <div className="font-['Lexend:Bold',_sans-serif] text-[18px] text-neutral-400">
          VS
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-['Lexend:SemiBold',_sans-serif] text-[14px] text-neutral-50">
              {opponent.name}
            </div>
            {opponentReady && (
              <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-green-400">
                ✓ Ready
              </div>
            )}
          </div>
          <img src={opponent.avatar} alt={opponent.name} className="size-12 rounded-full" />
        </div>
      </div>

      {/* Ready Button */}
      {canShowReady && !isReady && (
        <button
          onClick={() => setIsReady(true)}
          className="w-full bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-['Lexend:SemiBold',_sans-serif] text-[14px] py-3 rounded-lg transition-all"
        >
          Ready in Lobby
        </button>
      )}

      {/* Game Reporting */}
      {matchStarted && !matchSubmitted && (
        <div className="space-y-4">
          {/* Current Score */}
          <div className="flex items-center justify-center gap-8 py-4 bg-neutral-800/50 rounded-lg">
            <div className="text-center">
              <div className="font-['Lexend:Bold',_sans-serif] text-[32px] text-neutral-50">
                {playerScore}
              </div>
              <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-400">
                You
              </div>
            </div>
            <div className="font-['Lexend:Regular',_sans-serif] text-[16px] text-neutral-500">
              -
            </div>
            <div className="text-center">
              <div className="font-['Lexend:Bold',_sans-serif] text-[32px] text-neutral-50">
                {opponentScore}
              </div>
              <div className="font-['Lexend:Regular',_sans-serif] text-[11px] text-neutral-400">
                {opponent.name}
              </div>
            </div>
          </div>

          {/* Game Results */}
          {gameScores.length > 0 && (
            <div className="space-y-2">
              {gameScores.map((score, idx) => (
                <div key={idx} className="flex items-center justify-between text-[12px] py-2 px-3 bg-neutral-800/30 rounded">
                  <span className="font-['Lexend:Regular',_sans-serif] text-neutral-400">
                    Game {idx + 1}
                  </span>
                  <span className={`font-['Lexend:SemiBold',_sans-serif] ${score.player === 1 ? 'text-green-400' : 'text-red-400'}`}>
                    {score.player === 1 ? 'You Won' : 'Opponent Won'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Report Game Result */}
          {(playerScore < 2 && opponentScore < 2 && gameScores.length < 3) && (
            <div>
              <div className="font-['Lexend:SemiBold',_sans-serif] text-[13px] text-neutral-300 mb-3">
                Report Game {currentGame} Result
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleGameResult(true)}
                  className="flex-1 bg-green-600 hover:bg-green-500 active:scale-98 text-white font-['Lexend:SemiBold',_sans-serif] text-[13px] py-3 rounded-lg transition-all"
                >
                  I Won
                </button>
                <button
                  onClick={() => handleGameResult(false)}
                  className="flex-1 bg-red-600 hover:bg-red-500 active:scale-98 text-white font-['Lexend:SemiBold',_sans-serif] text-[13px] py-3 rounded-lg transition-all"
                >
                  I Lost
                </button>
              </div>
            </div>
          )}

          {/* Submit Final Score */}
          {(playerScore === 2 || opponentScore === 2 || gameScores.length === 3) && (
            <button
              onClick={handleSubmitScore}
              className="w-full bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-['Lexend:SemiBold',_sans-serif] text-[14px] py-3 rounded-lg transition-all"
            >
              Submit Final Score
            </button>
          )}
        </div>
      )}

      {/* Waiting for confirmation */}
      {matchSubmitted && !scoreDisputed && (
        <div className="text-center py-6">
          <div className="animate-pulse font-['Lexend:SemiBold',_sans-serif] text-[14px] text-blue-400 mb-2">
            Waiting for opponent confirmation...
          </div>
          <div className="font-['Lexend:Regular',_sans-serif] text-[12px] text-neutral-400">
            Final Score: {playerScore} - {opponentScore}
          </div>
        </div>
      )}

      {/* Score Disputed */}
      {scoreDisputed && (
        <div className="text-center py-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <WarningAlt size={32} className="mx-auto mb-2 text-yellow-400" />
          <div className="font-['Lexend:Bold',_sans-serif] text-[14px] text-yellow-400 mb-1">
            Score Mismatch Detected
          </div>
          <div className="font-['Lexend:Regular',_sans-serif] text-[12px] text-neutral-300">
            Scores don't match. Flagged for admin review.
          </div>
        </div>
      )}
    </div>
  );
}
