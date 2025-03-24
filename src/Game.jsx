import React, { useState, useEffect, useRef } from 'react';

function Game({ onGameOver }) {
  // Rocket dimensions
  const ROCKET_WIDTH = 50;
  const ROCKET_HEIGHT = 80;

  // State for game area dimensions (full screen)
  const [gameWidth, setGameWidth] = useState(window.innerWidth);
  const [gameHeight, setGameHeight] = useState(window.innerHeight);

  // Rocket's fixed vertical position (near bottom)
  const rocketY = gameHeight - ROCKET_HEIGHT - 20;

  // State variables
  const [rocketX, setRocketX] = useState(gameWidth / 2 - ROCKET_WIDTH / 2);
  const [asteroids, setAsteroids] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [explosion, setExplosion] = useState(null);

  // Refs for continuous movement and game state
  const keysPressed = useRef({ left: false, right: false });
  const rocketXRef = useRef(rocketX);
  const gameOverRef = useRef(gameOver);
  const animationFrameId = useRef(null);
  const lastTimestampRef = useRef(0);
  const gameLoopRef = useRef(null);

  // Update refs when state changes
  useEffect(() => {
    rocketXRef.current = rocketX;
  }, [rocketX]);

  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  // Update game dimensions on window resize
  useEffect(() => {
    const handleResize = () => {
      setGameWidth(window.innerWidth);
      setGameHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Define game loop function
  gameLoopRef.current = (timestamp) => {
    if (gameOverRef.current) {
      cancelAnimationFrame(animationFrameId.current);
      return;
    }

    // Limit updates to ~60 FPS
    if (timestamp - lastTimestampRef.current >= 16) {
      lastTimestampRef.current = timestamp;

      // 1) Update rocket position based on keys pressed
      setRocketX((prev) => {
        let newX = prev;
        const movementSpeed = 10;
        if (keysPressed.current.left) {
          newX = Math.max(prev - movementSpeed, 0);
        }
        if (keysPressed.current.right) {
          newX = Math.min(prev + movementSpeed, gameWidth - ROCKET_WIDTH);
        }
        return newX;
      });

      // 2) Move asteroids downward
      setAsteroids((prev) => {
        const updatedAsteroids = prev
          .map((ast) => ({ ...ast, y: ast.y + ast.speed }))
          .filter((ast) => ast.y < gameHeight + ast.size);

        // Check collisions for each asteroid
        for (let ast of updatedAsteroids) {
          if (checkCollision(ast)) {
            createExplosion(ast);
            endGame();
            return prev; // Keep asteroids in their current position if game over
          }
        }
        return updatedAsteroids;
      });

      // 3) Spawn new asteroid with dynamic properties
      if (Math.random() < 0.03) { // Reduced spawn rate for better gameplay
        const size = 30 + Math.random() * 40; // Size between 30 and 70
        const x = Math.random() * (gameWidth - size);
        const speed = 4 + Math.random() * 3; // Speed between 4 and 7
        const rotation = Math.random() * 360; // Random initial rotation
        setAsteroids((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            x,
            y: -size,
            size,
            speed,
            rotation,
          },
        ]);
      }

      // 4) Increase score over time
      setScore((prev) => prev + 1);
    }

    animationFrameId.current = requestAnimationFrame(gameLoopRef.current);
  };

  // Start game loop
  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(gameLoopRef.current);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameWidth, gameHeight]);

  // Listen for keydown/up events for continuous movement
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOverRef.current) return;
      if (e.key === 'ArrowLeft') {
        keysPressed.current.left = true;
      } else if (e.key === 'ArrowRight') {
        keysPressed.current.right = true;
      }
    };

    const handleKeyUp = (e) => {
      if (gameOverRef.current) return;
      if (e.key === 'ArrowLeft') {
        keysPressed.current.left = false;
      } else if (e.key === 'ArrowRight') {
        keysPressed.current.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Create explosion effect
  const createExplosion = (asteroid) => {
    const rocketCenter = {
      x: rocketXRef.current + ROCKET_WIDTH / 2,
      y: rocketY + ROCKET_HEIGHT / 2
    };
    
    setExplosion({
      x: rocketCenter.x - 50, // Center explosion around collision point
      y: rocketCenter.y - 50,
      size: 100,
      startTime: Date.now()
    });

    // Remove explosion after animation
    setTimeout(() => setExplosion(null), 1000);
  };

  // Improved collision detection with rectangle-circle intersection
  const checkCollision = (ast) => {
    const currentRocketX = rocketXRef.current;
    
    // Rectangle (rocket) center point
    const rocketCenterX = currentRocketX + ROCKET_WIDTH / 2;
    const rocketCenterY = rocketY + ROCKET_HEIGHT / 2;
    
    // Circle (asteroid) center point
    const astCenterX = ast.x + ast.size / 2;
    const astCenterY = ast.y + ast.size / 2;
    
    // Calculate the closest point on the rectangle to the circle
    const closestX = Math.max(currentRocketX, Math.min(astCenterX, currentRocketX + ROCKET_WIDTH));
    const closestY = Math.max(rocketY, Math.min(astCenterY, rocketY + ROCKET_HEIGHT));
    
    // Calculate the distance between the closest point and the circle center
    const distanceX = astCenterX - closestX;
    const distanceY = astCenterY - closestY;
    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
    
    // Check if the distance is less than the asteroid's radius
    return distanceSquared < (ast.size / 2) * (ast.size / 2);
  };

  // End the game
  const endGame = () => {
    setGameOver(true);
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
  };

  // Retry game: reset state
  const retryGame = () => {
    // Reset all state
    setAsteroids([]);
    setScore(0);
    setRocketX(gameWidth / 2 - ROCKET_WIDTH / 2);
    setExplosion(null);
    
    // Reset refs
    keysPressed.current = { left: false, right: false };
    rocketXRef.current = gameWidth / 2 - ROCKET_WIDTH / 2;
    lastTimestampRef.current = 0;
    
    // Reset game over state last to restart game loop
    setGameOver(false);
    gameOverRef.current = false;
    
    // Restart game loop
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    animationFrameId.current = requestAnimationFrame(gameLoopRef.current);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        background: '#000',
        overflow: 'hidden',
      }}
    >
      {/* Score Display */}
      <div style={{ position: 'absolute', top: 10, left: 10, color: '#fff', fontSize: '20px' }}>
        Score: {score}
      </div>

      {/* Rocket (hidden if game over) */}
      {!gameOver && (
        <div
          style={{
            position: 'absolute',
            width: `${ROCKET_WIDTH}px`,
            height: `${ROCKET_HEIGHT}px`,
            left: `${rocketX}px`,
            top: `${rocketY}px`,
            background: 'url("/rocket.png") center/cover no-repeat',
          }}
        />
      )}

      {/* Asteroids */}
      {asteroids.map((ast) => (
        <div
          key={ast.id}
          style={{
            position: 'absolute',
            width: `${ast.size}px`,
            height: `${ast.size}px`,
            left: `${ast.x}px`,
            top: `${ast.y}px`,
            background: 'radial-gradient(circle at 30% 30%, #666, #444)',
            borderRadius: '50%',
            transform: `rotate(${ast.rotation}deg)`,
            boxShadow: 'inset -10px -10px 20px rgba(0,0,0,0.6), inset 5px 5px 15px rgba(255,255,255,0.2)',
          }}
        />
      ))}

      {/* Explosion Effect */}
      {explosion && (
        <div
          style={{
            position: 'absolute',
            left: `${explosion.x}px`,
            top: `${explosion.y}px`,
            width: `${explosion.size}px`,
            height: `${explosion.size}px`,
            background: 'radial-gradient(circle, rgba(255,200,0,0.8) 0%, rgba(255,120,0,0.6) 40%, rgba(255,0,0,0.4) 60%, transparent 80%)',
            borderRadius: '50%',
            animation: 'explode 0.5s ease-out forwards',
          }}
        />
      )}

      {/* Game Over Screen */}
      {gameOver && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#fff',
            textAlign: 'center',
            background: 'rgba(0, 0, 0, 0.8)',
            padding: '20px',
            borderRadius: '10px',
          }}
        >
          <h2>Game Over</h2>
          <p>Your Score: {score}</p>
          <button 
            onClick={retryGame} 
            style={{ 
              marginRight: '10px',
              padding: '10px 20px',
              fontSize: '16px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
          <button 
            onClick={onGameOver}
            style={{ 
              padding: '10px 20px',
              fontSize: '16px',
              background: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Quit
          </button>
        </div>
      )}

      <style>
        {`
          @keyframes explode {
            0% {
              transform: scale(0.5);
              opacity: 1;
            }
            100% {
              transform: scale(2);
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
}

export default Game;