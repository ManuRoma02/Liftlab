import React from "react";

export interface LiftLabBrandProps {
  variant?: "lockup" | "mark" | "text";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  badge?: boolean;
  withBackground?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Pure Vector Emblem Mark for LiftLab (2026 Apple HIG Minimal Geometric Dual-L)
 * Features an interlocking architectural Emerald 'L' (Lift) paired with a Titanium White 'L' (Lab),
 * set within an obsidian satin squircle with titanium specular bezel and emerald radiance aura.
 */
export const LiftLabMark: React.FC<{
  sizeClass?: string;
  className?: string;
  withBackground?: boolean;
}> = ({
  sizeClass = "w-8 h-8",
  className = "",
  withBackground = true,
}) => {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClass} shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Deep Obsidian Ceramic Gradient */}
        <linearGradient id="llb-bgObsidian" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#151722" />
          <stop offset="45%" stopColor="#090A0E" />
          <stop offset="100%" stopColor="#030406" />
        </linearGradient>

        {/* Bezel Titanium Specular Sheen */}
        <linearGradient id="llb-bezelGleam" x1="40" y1="20" x2="472" y2="492" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
          <stop offset="25%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="70%" stopColor="rgba(255,255,255,0.02)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.16)" />
        </linearGradient>

        {/* Core Emerald Radiance Aura */}
        <radialGradient id="llb-emeraldAura" cx="256" cy="256" r="210" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(48,209,88,0.30)" />
          <stop offset="50%" stopColor="rgba(48,209,88,0.07)" />
          <stop offset="100%" stopColor="rgba(48,209,88,0)" />
        </radialGradient>

        {/* Emerald L Primary Vector */}
        <linearGradient id="llb-emGrad" x1="136" y1="136" x2="376" y2="376" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#47F880" />
          <stop offset="35%" stopColor="#30D158" />
          <stop offset="85%" stopColor="#1EAA44" />
          <stop offset="100%" stopColor="#158232" />
        </linearGradient>

        {/* Top Crest Specular Highlight for Emerald L */}
        <linearGradient id="llb-emCrest" x1="136" y1="136" x2="224" y2="160" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#B2FFCB" />
          <stop offset="100%" stopColor="#30D158" />
        </linearGradient>

        {/* Titanium White L Accent Vector (Lab) */}
        <linearGradient id="llb-whiteGrad" x1="264" y1="136" x2="376" y2="248" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#F2F5F9" />
          <stop offset="100%" stopColor="#D2D8E4" />
        </linearGradient>

        {/* Drop Shadow for Dimensional Separation */}
        <filter id="llb-markElevation" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="16" stdDeviation="18" floodColor="rgba(0,0,0,0.65)" />
        </filter>
      </defs>

      {/* Optional Continuous Curvature Container */}
      {withBackground && (
        <>
          <rect width="512" height="512" rx="116" fill="url(#llb-bgObsidian)" />
          <rect
            x="2"
            y="2"
            width="508"
            height="508"
            rx="114"
            fill="none"
            stroke="url(#llb-bezelGleam)"
            strokeWidth="2.5"
          />
          <circle cx="256" cy="256" r="180" fill="url(#llb-emeraldAura)" />
        </>
      )}

      {/* Master Mark Group */}
      <g filter={withBackground ? "url(#llb-markElevation)" : undefined}>
        {/* Primary Emerald 'L' (Lift) */}
        <path
          d="M 154 136 C 144 136 136 144 136 154 L 136 348 C 136 363 148 376 164 376 L 358 376 C 368 376 376 368 376 358 L 376 306 C 376 296 368 288 358 288 L 236 288 C 229 288 224 283 224 276 L 224 154 C 224 144 216 136 206 136 Z"
          fill="url(#llb-emGrad)"
        />

        {/* Specular Titanium Glint on Top Crest of Emerald L */}
        <path
          d="M 154 136 C 144 136 136 144 136 154 L 136 164 L 224 164 L 224 154 C 224 144 216 136 206 136 Z"
          fill="url(#llb-emCrest)"
          opacity="0.4"
        />

        {/* Interlocking Titanium White 'L' (Lab / Overload Accent) */}
        <path
          d="M 276 136 C 269 136 264 141 264 148 L 264 232 C 264 241 271 248 280 248 L 364 248 C 371 248 376 243 376 236 L 376 216 C 376 209 371 204 364 204 L 316 204 C 312 204 308 200 308 196 L 308 148 C 308 141 303 136 296 136 Z"
          fill="url(#llb-whiteGrad)"
        />
      </g>
    </svg>
  );
};

export const LiftLabBrand: React.FC<LiftLabBrandProps> = ({
  variant = "lockup",
  size = "md",
  withBackground = false,
  className = "",
  onClick,
}) => {
  // Dimension tokens
  const sizeMap = {
    xs: {
      mark: "w-5 h-5",
      text: "text-xs tracking-tight",
      gap: "gap-1.5",
    },
    sm: {
      mark: "w-7 h-7",
      text: "text-sm tracking-tight",
      gap: "gap-2",
    },
    md: {
      mark: "w-9 h-9",
      text: "text-base tracking-tight",
      gap: "gap-2.5",
    },
    lg: {
      mark: "w-11 h-11",
      text: "text-xl tracking-tight",
      gap: "gap-3",
    },
    xl: {
      mark: "w-14 h-14",
      text: "text-2xl tracking-tight",
      gap: "gap-3.5",
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  if (variant === "mark") {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center ${onClick ? "cursor-pointer active:scale-95 transition-transform" : ""} ${className}`}
      >
        <LiftLabMark sizeClass={currentSize.mark} withBackground={withBackground} />
      </div>
    );
  }

  const wordmarkContent = (
    <div className={`flex items-baseline select-none font-sans font-black ${currentSize.text}`}>
      <span className="text-white tracking-[0.04em]">LIFT</span>
      <span className="text-[#30D158] ml-1 tracking-[0.04em]">LAB</span>
    </div>
  );

  if (variant === "text") {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center ${onClick ? "cursor-pointer active:scale-95 transition-transform" : ""} ${className}`}
      >
        {wordmarkContent}
      </div>
    );
  }

  // Full lockup
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center ${currentSize.gap} ${onClick ? "cursor-pointer active:scale-95 transition-transform" : ""} ${className}`}
    >
      <LiftLabMark sizeClass={currentSize.mark} withBackground={withBackground} />
      {wordmarkContent}
    </div>
  );
};
