import React, { useState } from 'react';
import Game from './components/Game';
import './index.css';

function App() {
  const [gameStarted, setGameStarted] = useState(false);

  return (
    <div className="app">
      {!gameStarted ? (
        <div className="start-screen">
          <h1>🚀 Rocket Game</h1>
          <button onClick={() => setGameStarted(true)}>Start Game</button>
        </div>
      ) : (
        <Game onGameOver={() => setGameStarted(false)} />
      )}
    </div>
  );
}

export default App;
