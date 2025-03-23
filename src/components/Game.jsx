import React, { useEffect, useRef, useState } from 'react';
import Rock from './Rock';

const GRAVITY = 0.6;
const JUMP = -10;
const ROCK_INTERVAL = 1800;

function Game({ onGameOver }) {
  const [rocketY, setRocketY] = useState(250);
  const [velocity, setVelocity] = useState(0);
  const [rocks, setRocks] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const rocketRef = useRef();
  const gameRef = useRef();

  // Jump logic
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowUp') {
        setVelocity(JUMP);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Game loop
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setRocketY(prev => Math.min(prev + velocity, 500));
      setVelocity(prev => prev + GRAVITY);
    }, 20);

    return () => clearInterval(interval);
  }, [velocity, gameOver]);

  // Rock generator
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      const gap = 150;
      const topHeight = Math.floor(Math.random() * 200 + 50);
      const bottomHeight = 600 - topHeight - gap;
      const centerRockChance = Math.random() < 0.5;

      setRocks(prev => [
        ...prev,
        { id: Date.now(), topHeight, bottomHeight, x: 800, centerRock: centerRockChance }
      ]);
    }, ROCK_INTERVAL);

    return () => clearInterval(interval);
  }, [gameOver]);

  // Rock movement and collision
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setRocks(prev =>
        prev
          .map(rock => ({ ...rock, x: rock.x - 5 }))
          .filter(rock => rock.x > -60)
      );

      setScore(prev => prev + 1);
    }, 20);

    return () => clearInterval(interval);
  }, [gameOver]);

  // Collision detection
  useEffect(() => {
    const rocketBox = {
      top: rocketY,
      bottom: rocketY + 40,
      left: 100,
      right: 140,
    };

    for (let rock of rocks) {
      const rockLeft = rock.x;
      const rockRight = rock.x + 50;

      // Top Rock
      if (
        rocketBox.right > rockLeft &&
        rocketBox.left < rockRight &&
        rocketBox.top < rock.topHeight
      ) {
        endGame();
        return;
      }

      // Bottom Rock
      if (
        rocketBox.right > rockLeft &&
        rocketBox.left < rockRight &&
        rocketBox.bottom > 600 - rock.bottomHeight
      ) {
        endGame();
        return;
      }

      // Center Rock
      if (rock.centerRock) {
        const centerTop = 250;
        const centerBottom = 300;
        if (
          rocketBox.right > rockLeft &&
          rocketBox.left < rockRight &&
          rocketBox.top < centerBottom &&
          rocketBox.bottom > centerTop
        ) {
          endGame();
          return;
        }
      }
    }

    if (rocketY > 560 || rocketY < 0) {
      endGame();
    }

  }, [rocketY, rocks]);

  function endGame() {
    setGameOver(true);
    setTimeout(() => {
      onGameOver();
    }, 1500);
  }

  return (
    <div ref={gameRef} className="game">
      <div className="score">Score: {score}</div>
      <div
        className="rocket"
        ref={rocketRef}
        style={{ top: rocketY + 'px' }}
      />
      {rocks.map(rock => (
        <Rock key={rock.id} {...rock} />
      ))}
      {gameOver && <div className="retry">Game Over<br /><button onClick={onGameOver}>Retry</button></div>}
    </div>
  );
}

export default Game;
