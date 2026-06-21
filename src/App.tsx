import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from './components/ui/button';
import closedChest from './assets/treasure_closed.png';
import treasureChest from './assets/treasure_opened.png';
import skeletonChest from './assets/treasure_opened_skeleton.png';
import chestOpenSound from './audios/chest_open.mp3';
import evilLaughSound from './audios/chest_open_with_evil_laugh.mp3';
import keyIcon from './assets/key.png';
import AuthModal from './components/AuthModal';
import { initDb, saveScore, getUserScores, User, ScoreRow } from './lib/db';

interface Box {
  id: number;
  isOpen: boolean;
  hasTreasure: boolean;
}

export default function App() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [score, setScore] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [historyScores, setHistoryScores] = useState<ScoreRow[]>([]);
  const [scoreSaved, setScoreSaved] = useState(false);

  const initializeGame = () => {
    // Randomly assign treasure to one box
    const treasureBoxIndex = Math.floor(Math.random() * 3);
    const newBoxes: Box[] = Array.from({ length: 3 }, (_, index) => ({
      id: index,
      isOpen: false,
      hasTreasure: index === treasureBoxIndex,
    }));
    
    setBoxes(newBoxes);
    setScore(0);
    setGameEnded(false);
    setHistoryScores([]);
    setScoreSaved(false);
  };

  useEffect(() => {
    initDb().then(() => setDbReady(true));
    initializeGame();
  }, []);

  useEffect(() => {
    if (!gameEnded || !currentUser || !dbReady || scoreSaved) return;
    saveScore(currentUser.id, score);
    setHistoryScores(getUserScores(currentUser.id));
    setScoreSaved(true);
  }, [gameEnded, currentUser, dbReady, score, scoreSaved]);

  const openBox = (boxId: number) => {
    if (gameEnded) return;
    
    setBoxes(prevBoxes => {
      const updatedBoxes = prevBoxes.map(box => {
        if (box.id === boxId && !box.isOpen) {
          new Audio(box.hasTreasure ? chestOpenSound : evilLaughSound).play();
          const newScore = box.hasTreasure ? score + 100 : score - 50;
          setScore(newScore);
          return { ...box, isOpen: true };
        }
        return box;
      });
      
      // Check if treasure is found or all boxes are opened
      const treasureFound = updatedBoxes.some(box => box.isOpen && box.hasTreasure);
      const allOpened = updatedBoxes.every(box => box.isOpen);
      if (treasureFound || allOpened) {
        setGameEnded(true);
      }
      
      return updatedBoxes;
    });
  };

  const resetGame = () => {
    initializeGame();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center p-8">
      {/* Auth header */}
      <div className="w-full max-w-2xl flex justify-end mb-4">
        {currentUser ? (
          <div className="flex items-center gap-3">
            <span className="text-amber-800 font-medium">👤 {currentUser.username}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setCurrentUser(null); setHistoryScores([]); initializeGame(); }}
              className="border-amber-400 text-amber-800 hover:bg-amber-100"
            >
              登出
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-amber-600 text-sm">遊客模式</span>
            <Button
              size="sm"
              onClick={() => setAuthOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white"
              disabled={!dbReady}
            >
              登入 / 註冊
            </Button>
          </div>
        )}
      </div>

      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        onSuccess={user => {
          setCurrentUser(user);
          setHistoryScores(getUserScores(user.id));
        }}
      />

      <div className="text-center mb-8">
        <h1 className="text-4xl mb-4 text-amber-900">🏴‍☠️ Treasure Hunt Game 🏴‍☠️</h1>
        <p className="text-amber-800 mb-4">
          Click on the treasure chests to discover what's inside!
        </p>
        <p className="text-amber-700 text-sm">
          💰 Treasure: +$100 | 💀 Skeleton: -$50
        </p>
      </div>

      <div className="mb-8 flex items-center gap-6">
        <div className="text-2xl text-center p-4 bg-amber-200/80 backdrop-blur-sm rounded-lg shadow-lg border-2 border-amber-400">
          <span className="text-amber-900">Current Score: </span>
          <span className={`${score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${score}
          </span>
        </div>
        {gameEnded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className={`text-2xl font-bold p-4 rounded-lg shadow-lg border-2 ${
              score > 0
                ? 'bg-green-100 text-green-700 border-green-400'
                : score === 0
                ? 'bg-yellow-100 text-yellow-700 border-yellow-400'
                : 'bg-red-100 text-red-700 border-red-400'
            }`}
          >
            {score > 0 ? 'Win' : score === 0 ? 'Tie' : 'Loss'}
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {boxes.map((box) => (
              <motion.div
                key={box.id}
                className="flex flex-col items-center"
                style={{ cursor: box.isOpen ? 'default' : `url(${keyIcon}) 16 16, pointer` }}
                whileHover={{ scale: box.isOpen ? 1 : 1.05 }}
                whileTap={{ scale: box.isOpen ? 1 : 0.95 }}
                onClick={() => openBox(box.id)}
              >
                <motion.div
                  initial={{ rotateY: 0 }}
                  animate={{ 
                    rotateY: box.isOpen ? 180 : 0,
                    scale: box.isOpen ? 1.1 : 1
                  }}
                  transition={{ 
                    duration: 0.6,
                    ease: "easeInOut"
                  }}
                  className="relative"
                >
                  <img
                    src={box.isOpen 
                      ? (box.hasTreasure ? treasureChest : skeletonChest)
                      : closedChest
                    }
                    alt={box.isOpen 
                      ? (box.hasTreasure ? "Treasure!" : "Skeleton!")
                      : "Treasure Chest"
                    }
                    className="w-48 h-48 object-contain drop-shadow-lg"
                  />
                  
                  {box.isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="absolute -top-8 left-1/2 transform -translate-x-1/2"
                    >
                      {box.hasTreasure ? (
                        <div className="text-2xl animate-bounce">✨💰✨</div>
                      ) : (
                        <div className="text-2xl animate-pulse">💀👻💀</div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
                
                <div className="mt-4 text-center">
                  {box.isOpen ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, duration: 0.3 }}
                      className={`text-lg p-2 rounded-lg ${
                        box.hasTreasure 
                          ? 'bg-green-100 text-green-800 border border-green-300' 
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}
                    >
                      {box.hasTreasure ? '+$100' : '-$50'}
                    </motion.div>
                  ) : (
                    <div className="text-amber-700 p-2">
                      Click to open!
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
      </div>

      {gameEnded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="mb-4 p-6 bg-amber-200/80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-amber-400">
                <h2 className="text-2xl mb-2 text-amber-900">Game Over!</h2>
                <p className="text-lg text-amber-800">
                  Final Score: <span className={`${score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${score}
                  </span>
                </p>
                <p className="text-sm text-amber-600 mt-2">
                  {boxes.some(box => box.isOpen && box.hasTreasure) 
                    ? 'Treasure found! Well done, treasure hunter! 🎉' 
                    : 'No treasure found this time! Better luck next time! 💀'}
                </p>
              </div>
              
              <Button
                onClick={resetGame}
                className="text-lg px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white"
              >
                Play Again
              </Button>

              {currentUser && historyScores.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="mt-6 p-4 bg-amber-100/80 backdrop-blur-sm rounded-xl border-2 border-amber-300 text-left"
                >
                  <h3 className="text-amber-900 font-semibold mb-2 text-center">📊 歷史分數（最近 5 筆）</h3>
                  <table className="w-full text-sm text-amber-800">
                    <thead>
                      <tr className="border-b border-amber-300">
                        <th className="py-1 text-left">#</th>
                        <th className="py-1 text-right">分數</th>
                        <th className="py-1 text-right">時間</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyScores.map((row, i) => (
                        <tr key={row.id} className="border-b border-amber-200">
                          <td className="py-1">{i + 1}</td>
                          <td className={`py-1 text-right font-medium ${row.score > 0 ? 'text-green-600' : row.score < 0 ? 'text-red-600' : 'text-amber-700'}`}>
                            ${row.score}
                          </td>
                          <td className="py-1 text-right text-amber-600">
                            {new Date(row.played_at * 1000).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              )}
            </motion.div>
          )}
    </div>
  );
}
