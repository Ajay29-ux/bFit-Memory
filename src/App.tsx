import React, { useState, useEffect } from 'react';
import { Brain, Timer, Trophy, RotateCcw, Star, ChevronRight, Home, LogIn, UserPlus, LogOut } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from './lib/supabase';

type Card = {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
};

type Difficulty = 'easy' | 'medium' | 'hard';
type Page = 'menu' | 'game' | 'difficulty' | 'leaderboard' | 'login' | 'signup';

function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [currentPage, setCurrentPage] = useState<Page>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emojiSets = {
    easy: ['🎨', '🎮', '🎲', '🎭', '🎪', '🎯', '🎱', '🎳'],
    medium: ['🎨', '🎮', '🎲', '🎭', '🎪', '🎯', '🎱', '🎳', '🎸', '🎺'],
    hard: ['🎨', '🎮', '🎲', '🎭', '🎪', '🎯', '🎱', '🎳', '🎸', '🎺', '🎭', '🎪']
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {
      toast.error('Please wait before trying again');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
          },
        },
      });

      if (error) {
        if (error.message.includes('over_email_send_rate_limit')) {
          toast.error('Please wait a minute before trying again');
        } else if (error.message.includes('Database error')) {
          toast.error('Unable to create account. Please try again later');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Please check your email for the confirmation link!');
      setCurrentPage('login');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
      }, 60000);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        if (error.message.includes('email_not_confirmed')) {
          toast.error('Please confirm your email address before signing in. Check your inbox for the confirmation link.');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Successfully logged in!');
      setCurrentPage('menu');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setCurrentPage('menu');
      toast.success('Successfully logged out!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const initializeGame = () => {
    const currentEmojis = emojiSets[difficulty];
    const shuffledCards = [...currentEmojis, ...currentEmojis]
      .sort(() => Math.random() - 0.5)
      .map((value, index) => ({
        id: index,
        value,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(shuffledCards);
    setFlippedCards([]);
    setScore(0);
    setMoves(0);
    setTimer(0);
    setGameStarted(true);
    setCurrentPage('game');
  };

  useEffect(() => {
    let interval: number;
    if (gameStarted && currentPage === 'game') {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, currentPage]);

  const handleCardClick = (id: number) => {
    if (flippedCards.length === 2 || cards[id].isMatched || flippedCards.includes(id)) return;

    const newCards = [...cards];
    newCards[id].isFlipped = true;
    setCards(newCards);

    const newFlippedCards = [...flippedCards, id];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setMoves((prev) => prev + 1);
      const [firstCard, secondCard] = newFlippedCards;
      
      if (cards[firstCard].value === cards[secondCard].value) {
        newCards[firstCard].isMatched = true;
        newCards[secondCard].isMatched = true;
        setCards(newCards);
        setScore((prev) => prev + 1);
        setFlippedCards([]);
      } else {
        setTimeout(() => {
          newCards[firstCard].isFlipped = false;
          newCards[secondCard].isFlipped = false;
          setCards(newCards);
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderLogin = () => (
    <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <LogIn className="w-12 h-12 text-purple-600" />
        <h1 className="text-4xl font-bold text-purple-600">Login</h1>
      </div>
      <form onSubmit={handleSignIn} className="w-full space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Login
        </button>
      </form>
      <p className="text-gray-600">
        Don't have an account?{' '}
        <button
          onClick={() => setCurrentPage('signup')}
          className="text-purple-600 hover:text-purple-700"
        >
          Sign up
        </button>
      </p>
      <button
        onClick={() => setCurrentPage('menu')}
        className="text-gray-600 hover:text-purple-600 flex items-center gap-2"
      >
        <Home className="w-5 h-5" />
        Back to Menu
      </button>
    </div>
  );

  const renderSignup = () => (
    <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <UserPlus className="w-12 h-12 text-purple-600" />
        <h1 className="text-4xl font-bold text-purple-600">Sign Up</h1>
      </div>
      <form onSubmit={handleSignUp} className="w-full space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Please wait...' : 'Sign Up'}
        </button>
      </form>
      <p className="text-gray-600">
        Already have an account?{' '}
        <button
          onClick={() => setCurrentPage('login')}
          className="text-purple-600 hover:text-purple-700"
        >
          Login
        </button>
      </p>
      <button
        onClick={() => setCurrentPage('menu')}
        className="text-gray-600 hover:text-purple-600 flex items-center gap-2"
      >
        <Home className="w-5 h-5" />
        Back to Menu
      </button>
    </div>
  );

  const renderMenu = () => (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-3 mb-4">
        <Brain className="w-12 h-12 text-purple-600" />
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">
          bFit Memory
        </h1>
      </div>
      <p className="text-xl text-gray-600 mb-8">Train your brain with our memory challenge!</p>
      {session ? (
        <>
          <button
            onClick={() => setCurrentPage('difficulty')}
            className="w-64 bg-gradient-to-r from-purple-600 to-blue-500 text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-all duration-300 flex items-center justify-between"
          >
            Play Game
            <ChevronRight className="w-6 h-6" />
          </button>
          <button
            onClick={() => setCurrentPage('leaderboard')}
            className="w-64 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-all duration-300 flex items-center justify-between"
          >
            Leaderboard
            <Trophy className="w-6 h-6" />
          </button>
          <button
            onClick={handleSignOut}
            className="w-64 bg-gray-600 text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-all duration-300 flex items-center justify-between mt-4"
          >
            Sign Out
            <LogOut className="w-6 h-6" />
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => setCurrentPage('login')}
            className="w-64 bg-gradient-to-r from-purple-600 to-blue-500 text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-all duration-300 flex items-center justify-between"
          >
            Login
            <LogIn className="w-6 h-6" />
          </button>
          <button
            onClick={() => setCurrentPage('signup')}
            className="w-64 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-all duration-300 flex items-center justify-between"
          >
            Sign Up
            <UserPlus className="w-6 h-6" />
          </button>
        </>
      )}
    </div>
  );

  const renderDifficultySelect = () => (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-3xl font-bold text-purple-600 mb-8">Select Difficulty</h2>
      <div className="flex flex-col gap-4 w-80">
        {(['easy', 'medium', 'hard'] as const).map((level) => (
          <button
            key={level}
            onClick={() => {
              setDifficulty(level);
              initializeGame();
            }}
            className={`w-full px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-between
              ${level === 'easy' ? 'bg-green-500 hover:bg-green-600' : ''}
              ${level === 'medium' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
              ${level === 'hard' ? 'bg-red-500 hover:bg-red-600' : ''}
              text-white
            `}
          >
            {level.charAt(0).toUpperCase() + level.slice(1)}
            <div className="flex">
              {[...Array(level === 'easy' ? 1 : level === 'medium' ? 2 : 3)].map((_, i) => (
                <Star key={i} className="w-5 h-5" />
              ))}
            </div>
          </button>
        ))}
      </div>
      <button
        onClick={() => setCurrentPage('menu')}
        className="mt-4 flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
      >
        <Home className="w-5 h-5" />
        Back to Menu
      </button>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-3xl font-bold text-purple-600 mb-8">Leaderboard</h2>
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        <div className="space-y-4">
          {['easy', 'medium', 'hard'].map((level) => (
            <div key={level} className="border-b pb-4 last:border-b-0 last:pb-0">
              <h3 className="text-xl font-semibold mb-3 capitalize">{level}</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Best Time:</span>
                  <span className="font-semibold">--:--</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Best Moves:</span>
                  <span className="font-semibold">--</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={() => setCurrentPage('menu')}
        className="mt-4 flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
      >
        <Home className="w-5 h-5" />
        Back to Menu
      </button>
    </div>
  );

  const renderGame = () => (
    <>
      <div className="text-center mb-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              setGameStarted(false);
              setCurrentPage('menu');
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
          >
            <Home className="w-5 h-5" />
            Menu
          </button>
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-purple-600">bFit Memory</h1>
          </div>
          <button
            onClick={initializeGame}
            className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Restart
          </button>
        </div>
        
        <div className="flex justify-center gap-8 mb-6">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-blue-600" />
            <span className="text-lg font-semibold">{formatTime(timer)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <span className="text-lg font-semibold">Score: {score}</span>
          </div>
          <div className="text-lg font-semibold">Moves: {moves}</div>
        </div>
      </div>

      <div className={`grid gap-4 ${
        difficulty === 'easy' ? 'grid-cols-4' : 
        difficulty === 'medium' ? 'grid-cols-5' : 
        'grid-cols-6'
      }`}>
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className={`aspect-square bg-white rounded-xl shadow-lg cursor-pointer transform transition-all duration-300 ${
              card.isFlipped ? 'rotate-y-180' : ''
            } ${card.isMatched ? 'opacity-50' : ''}`}
          >
            <div className="w-full h-full flex items-center justify-center text-4xl">
              {card.isFlipped ? card.value : '?'}
            </div>
          </div>
        ))}
      </div>

      {score === emojiSets[difficulty].length && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-xl text-center">
            <h2 className="text-2xl font-bold mb-4">Congratulations! 🎉</h2>
            <p className="mb-4">You completed the {difficulty} level in:</p>
            <p className="text-xl font-bold mb-2">{formatTime(timer)}</p>
            <p className="text-lg mb-4">Total Moves: {moves}</p>
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentPage('menu')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                Menu
              </button>
              <button
                onClick={initializeGame}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        {currentPage === 'menu' && renderMenu()}
        {currentPage === 'difficulty' && renderDifficultySelect()}
        {currentPage === 'leaderboard' && renderLeaderboard()}
        {currentPage === 'game' && renderGame()}
        {currentPage === 'login' && renderLogin()}
        {currentPage === 'signup' && renderSignup()}
      </div>
      <Toaster position="top-center" />
    </div>
  );
}

export default App;