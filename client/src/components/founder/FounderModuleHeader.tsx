import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LucideIcon } from "lucide-react";

export interface FounderModuleHeaderProps {
  badgeIcon?: LucideIcon;
  badgeLabel: string;
  badgeTone?: string;
  subtitle?: string;
  title: string;
  description: string;
  decorativeIcon?: LucideIcon;
  statusText?: string;
  actions?: React.ReactNode;
}

export function FounderModuleHeader({
  badgeIcon: BadgeIcon,
  badgeLabel,
  badgeTone = "bg-[#f4eddd] text-[#705a30] border-[#e4d3b1]",
  subtitle,
  title,
  description,
  decorativeIcon: DecorativeIcon,
  statusText = "Live System",
  actions,
}: FounderModuleHeaderProps) {
  const { td, isRTL } = useLanguage();

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[#dce4e7] bg-white p-5 sm:p-7 shadow-xs transition-all ${
        isRTL ? "dir-rtl text-right" : "text-left"
      }`}
    >
      {/* Subtle decorative watermark icon */}
      {DecorativeIcon && (
        <div
          className={`pointer-events-none absolute -bottom-5 ${
            isRTL ? "-left-5" : "-right-5"
          } text-[#f1f5f9] select-none`}
          aria-hidden="true"
        >
          <DecorativeIcon size={120} strokeWidth={1} />
        </div>
      )}

      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl space-y-2.5">
          {/* Badge and Status Row */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-2xs ${badgeTone}`}
            >
              {BadgeIcon && <BadgeIcon size={13} className="shrink-0" />}
              <span>{td(badgeLabel)}</span>
            </span>

            {subtitle && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f0f4f8] text-[#53657a] border border-[#e2e8f0]">
                {td(subtitle)}
              </span>
            )}

            {statusText && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>{td(statusText)}</span>
              </span>
            )}
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#10253e] leading-tight font-display">
            {td(title)}
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base text-[#53657a] leading-relaxed max-w-2xl">
            {td(description)}
          </p>
        </div>

        {/* Action Toolbar */}
        {actions && (
          <div className="relative z-10 flex flex-wrap items-center gap-2.5 pt-1 lg:pt-0 shrink-0 w-full sm:w-auto">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
