import React from "react";

export interface LiftLabBrandProps {
  variant?: "lockup" | "mark" | "text";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  badge?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Pure Vector Emblem Mark for LiftLab (2026 Tactile Olympic Plate)
 * Features an Olympic competition bumper plate fused with a sculpted Emerald 'L'.
 * Zero crosshairs, zero weapon reticles, pure athletic engineering.
 */
export const LiftLabMark: React.FC<{ sizeClass?: string; className?: string; withBackground?: boolean }> = ({
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
        <linearGradient id="llb-bgPlate" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#16181F" />
          <stop offset="50%" stopColor="#0E1014" />
          <stop offset="100%" stopColor="#060709" />
        </linearGradient>

        <linearGradient id="llb-bezelGleam" x1="100" y1="60" x2="412" y2="452" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3A3F4D" />
          <stop offset="35%" stopColor="#1A1C24" />
          <stop offset="70%" stopColor="#0F1116" />
          <stop offset="100%" stopColor="#282C38" />
        </linearGradient>

        <radialGradient id="llb-bumperUrethane" cx="256" cy="256" r="230" gradientUnits="userSpaceOnUse">
          <stop offset="70%" stopColor="#181B24" />
          <stop offset="88%" stopColor="#12141B" />
          <stop offset="100%" stopColor="#0A0B0F" />
        </radialGradient>

        <radialGradient id="llb-innerHub" cx="256" cy="250" r="160" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#141720" />
          <stop offset="75%" stopColor="#0A0B0E" />
          <stop offset="100%" stopColor="#050608" />
        </radialGradient>

        <radialGradient id="llb-emeraldAura" cx="256" cy="256" r="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(48,209,88,0.22)" />
          <stop offset="60%" stopColor="rgba(48,209,88,0.06)" />
          <stop offset="100%" stopColor="rgba(48,209,88,0)" />
        </radialGradient>

        <linearGradient id="llb-lFaceLight" x1="170" y1="130" x2="350" y2="380" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3DF574" />
          <stop offset="45%" stopColor="#30D158" />
          <stop offset="100%" stopColor="#22B847" />
        </linearGradient>

        <linearGradient id="llb-lBevelShadow" x1="180" y1="140" x2="330" y2="390" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#209E40" />
          <stop offset="100%" stopColor="#126B29" />
        </linearGradient>

        <linearGradient id="llb-specularTop" x1="170" y1="130" x2="250" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A6FFBE" />
          <stop offset="100%" stopColor="#30D158" />
        </linearGradient>
      </defs>

      {/* Optional Continuous Curvature Container */}
      {withBackground && (
        <>
          <rect width="512" height="512" rx="116" fill="url(#llb-bgPlate)" />
          <rect x="2" y="2" width="508" height="508" rx="114" fill="none" stroke="url(#llb-bezelGleam)" strokeWidth="3" />
        </>
      )}

      {/* Olympic Calibrated Plate */}
      <circle cx="256" cy="256" r="198" fill="none" stroke="#252A36" strokeWidth="2" />
      <circle cx="256" cy="256" r="194" fill="url(#llb-bumperUrethane)" />
      <circle cx="256" cy="256" r="176" fill="none" stroke="#2D3342" strokeWidth="3" />
      <circle cx="256" cy="256" r="173" fill="none" stroke="#0D0E13" strokeWidth="2" />

      {/* Recessed Inner Steel Hub */}
      <circle cx="256" cy="256" r="170" fill="url(#llb-innerHub)" />
      <circle cx="256" cy="256" r="168" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />

      {/* Ambient Emerald Energy Aura */}
      <circle cx="256" cy="256" r="150" fill="url(#llb-emeraldAura)" />

      {/* Olympic Calibrated Grip Arcs */}
      <path d="M 120 220 A 150 150 0 0 1 120 180" fill="none" stroke="#20242F" strokeWidth="6" strokeLinecap="round" />
      <path d="M 392 220 A 150 150 0 0 0 392 180" fill="none" stroke="#20242F" strokeWidth="6" strokeLinecap="round" />
      <path d="M 120 292 A 150 150 0 0 0 120 332" fill="none" stroke="#20242F" strokeWidth="6" strokeLinecap="round" />
      <path d="M 392 292 A 150 150 0 0 1 392 332" fill="none" stroke="#20242F" strokeWidth="6" strokeLinecap="round" />

      {/* Sculpted Olympic 'L' with 3D Bevels */}
      <g>
        {/* Base 3D Extrusion Shadow Bevel */}
        <path
          d="M 172 144 C 172 136 178 130 186 130 L 242 130 C 250 130 256 136 256 144 L 256 308 C 256 314 261 319 267 319 L 348 319 C 356 319 362 325 362 333 L 362 366 C 362 374 356 380 348 380 L 186 380 C 178 380 172 374 172 366 Z"
          fill="url(#llb-lBevelShadow)"
        />

        {/* Main Chiseled Face */}
        <path
          d="M 168 138 C 168 130 174 124 182 124 L 238 124 C 246 124 252 130 252 138 L 252 304 C 252 310 257 315 263 315 L 344 315 C 352 315 358 321 358 329 L 358 360 C 358 368 352 374 344 374 L 182 374 C 174 374 168 368 168 360 Z"
          fill="url(#llb-lFaceLight)"
        />

        {/* Specular Titanium Highlight on Top Crest */}
        <path
          d="M 182 124 L 238 124 C 246 124 252 130 252 138 L 252 144 L 178 144 L 168 138 C 168 130 174 124 182 124 Z"
          fill="url(#llb-specularTop)"
        />

        {/* Kinetic Inset Energy Channel */}
        <path
          d="M 194 156 L 218 156 L 218 326 C 218 333 223 338 230 338 L 332 338 L 332 352 L 220 352 C 206 352 194 340 194 326 Z"
          fill="#FFFFFF"
          opacity="0.38"
        />
      </g>
    </svg>
  );
};

export const LiftLabBrand: React.FC<LiftLabBrandProps> = ({
  variant = "lockup",
  size = "md",
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
        <LiftLabMark sizeClass={currentSize.mark} />
      </div>
    );
  }

  const wordmarkContent = (
    <div className={`flex items-baseline select-none font-sans font-black ${currentSize.text}`}>
      <span className="text-white">LIFT</span>
      <span className="text-[#30D158] ml-1">LAB</span>
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
      <LiftLabMark sizeClass={currentSize.mark} />
      {wordmarkContent}
    </div>
  );
};
