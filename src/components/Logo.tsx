"use client";

/**
 * conduit-architecture brand mark.
 * A stylized "C" conduit with a gradient stroke, flowing dashes, pulsing end
 * nodes, and a glowing dot that travels along the channel.
 */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`logo-badge transition-transform duration-300 group-hover:scale-110 ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="conduitStroke" x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4a8fe8" />
          <stop offset="0.5" stopColor="#3eb89a" />
          <stop offset="1" stopColor="#7c6fcd" />
        </linearGradient>
        <linearGradient id="conduitBadge" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4a8fe8" stopOpacity="0.16" />
          <stop offset="1" stopColor="#7c6fcd" stopOpacity="0.16" />
        </linearGradient>
      </defs>

      {/* Badge backdrop */}
      <rect
        x="1"
        y="1"
        width="38"
        height="38"
        rx="11"
        fill="url(#conduitBadge)"
        stroke="url(#conduitStroke)"
        strokeOpacity="0.35"
      />

      {/* The conduit "C" channel */}
      <path
        id="conduitPath"
        d="M28 12 A11 11 0 1 0 28 28"
        stroke="url(#conduitStroke)"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      {/* Flowing dashes layered over the channel */}
      <path
        d="M28 12 A11 11 0 1 0 28 28"
        stroke="url(#conduitStroke)"
        strokeWidth="3.4"
        strokeLinecap="round"
        className="conduit-flow"
        opacity="0.9"
      />

      {/* Pulsing end nodes */}
      <circle cx="28" cy="12" r="2.6" fill="#4a8fe8" className="conduit-node" />
      <circle cx="28" cy="28" r="2.6" fill="#7c6fcd" className="conduit-node" style={{ animationDelay: "1s" }} />

      {/* Glowing dot traveling through the conduit */}
      <circle r="2" fill="#3eb89a">
        <animateMotion dur="3s" repeatCount="indefinite" path="M28 12 A11 11 0 1 0 28 28" />
        <animate attributeName="opacity" values="0;1;1;0" dur="3s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
