import React, { useState } from 'react';
import Game from './Game';

function App() {
  const [gameStarted, setGameStarted] = useState(false);

  return (
    <div className="App">
      {/* Start Screen */}
      {!gameStarted ? (
        <div className="start-screen">
          <h1>Asteroid Dodge</h1>
          <button onClick={() => setGameStarted(true)}>Start Game</button>
        </div>
      ) : (
        /* Game Screen */
        <Game onGameOver={() => setGameStarted(false)} />
      )}
    </div>
  );
}

export default App;
