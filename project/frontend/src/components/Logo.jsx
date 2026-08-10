import React from 'react';

/**
 * Logo Component — Modern 3D Isometric Green Cube Logo
 * Ported from Apex-Nexus with custom Green agricultural styling.
 */
export default function Logo({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
    >
      {/* Top Face - Bright Leaf Green */}
      <path d="M16 2L2 9L16 16L30 9L16 2Z" fill="#22C55E" />
      {/* Left Face - Emerald / Mint Green */}
      <path d="M2 9V23L16 30V16L2 9Z" fill="#4ADE80" />
      {/* Right Face - Deep Forest Green */}
      <path d="M30 9V23L16 30V16L30 9Z" fill="#15803D" />
    </svg>
  );
}
