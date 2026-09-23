import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { triggerHaptic } from "../../lib/haptics";

export function AccordionItem({
  title,
  icon,
  children,
  defaultOpen = false,
  className = "",
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div
      className={`bg-[#1C1C1E] border border-white/8 rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)] ${className}`}
    >
      <button
        onClick={() => {
          triggerHaptic("light");
          setIsOpen(!isOpen);
        }}
        className="w-full flex items-center justify-between p-5 transition-colors hover:bg-white/5 active:bg-white/10 text-left focus:outline-none cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          {icon}
          <h3 className="font-bold text-xs text-white uppercase tracking-wider">
            {title}
          </h3>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[#8E8E93] transition-transform duration-200 ${isOpen ? "rotate-180 text-white" : ""}`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="p-5 pt-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
