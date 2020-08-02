import React from "react";
export const Panel = ({ stats }) => {
  return (
    <div className="panels">
      <div className="panel">
        <strong>θ</strong> {stats.angle}{" "}
      </div>
      <div className="panel">
        <strong>φ</strong> {stats.azimuth}
      </div>
      <div className="panel">
        {stats.velocity} <strong>m/s</strong>
      </div>
    </div>
  );
};
