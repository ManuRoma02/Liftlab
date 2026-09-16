import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

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
      className={`bg-surface-container border border-surface-variant rounded-xl overflow-hidden ${className}`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-stack-lg transition-colors hover:bg-surface-variant/30 text-left focus:outline-none"
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-bold text-[14px] text-primary-fixed uppercase tracking-widest">
            {title}
          </h3>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-primary-fixed transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="p-stack-lg pt-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
