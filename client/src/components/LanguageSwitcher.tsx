import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/lib/translations";

interface LanguageOption {
  code: Language;
  label: string;
  nativeName: string;
  flag: string;
}

const languages: LanguageOption[] = [
  { code: "en", label: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "ms", label: "Malay", nativeName: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "ar", label: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
];

export function LanguageSwitcher({
  variant = "dropdown",
  className = "",
}: {
  variant?: "dropdown" | "compact" | "inline";
  className?: string;
}) {
  const { language, setLanguage, isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
  };

  if (variant === "inline") {
    return (
      <div className={`flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#eef3ff] border border-[#d9e2f1] ${className}`} role="group" aria-label="Language selection">
        {languages.map((item) => {
          const isSelected = item.code === language;
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => handleSelect(item.code)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                isSelected
                  ? "bg-[#173fad] text-white shadow-sm"
                  : "text-[#445d80] hover:bg-white hover:text-[#173fad]"
              }`}
              aria-pressed={isSelected}
            >
              <span className="text-sm leading-none">{item.flag}</span>
              <span>{item.nativeName}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center justify-center gap-1.5 min-h-[38px] px-3 py-1.5 text-xs font-bold text-[#354c6d] bg-white hover:bg-[#eef3ff] hover:text-[#173fad] border border-[#d9e2f1] hover:border-[#b8cce9] rounded-xl shadow-xs transition-all duration-160 focus:outline-none focus:ring-2 focus:ring-[#173fad]/20"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Current language: ${currentLang.nativeName}. Click to change language`}
      >
        <Globe size={15} className="text-[#173fad]" aria-hidden="true" />
        <span className="text-sm leading-none" aria-hidden="true">{currentLang.flag}</span>
        <span className="font-semibold tracking-tight">{variant === "compact" ? currentLang.code.toUpperCase() : currentLang.nativeName}</span>
        <ChevronDown
          size={13}
          className={`text-[#61727c] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          className={`absolute mt-1.5 w-48 rounded-xl bg-white border border-[#d9e2f1] shadow-xl py-1.5 z-100 animate-in fade-in zoom-in-95 duration-100 ${
            isRTL ? "left-0 origin-top-left" : "right-0 origin-top-right"
          }`}
          role="listbox"
          aria-label="Select language"
        >
          {languages.map((item) => {
            const isSelected = item.code === language;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => handleSelect(item.code)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left transition-colors min-h-[40px] ${
                  isSelected
                    ? "bg-[#eef3ff] text-[#173fad] font-bold"
                    : "text-[#2e4259] hover:bg-slate-50 hover:text-[#10253e] font-medium"
                }`}
                role="option"
                aria-selected={isSelected}
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-base leading-none" aria-hidden="true">{item.flag}</span>
                  <span className="flex flex-col">
                    <span className="font-bold">{item.nativeName}</span>
                    <span className="text-[10px] text-[#71808a] font-normal">{item.label}</span>
                  </span>
                </span>
                {isSelected && <Check size={14} className="text-[#173fad] flex-none" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
