import React from 'react';

function Rock({ x, topHeight, bottomHeight, centerRock }) {
  return (
    <>
      {/* Top Rock */}
      <div className="rock top" style={{ height: topHeight, left: x }} />
      {/* Bottom Rock */}
      <div className="rock bottom" style={{ height: bottomHeight, left: x }} />
      {/* Center Rock */}
      {centerRock && <div className="rock center" style={{ left: x }} />}
    </>
  );
}

export default Rock;
