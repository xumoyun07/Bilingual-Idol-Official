import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { RegistrationForm } from "./RegistrationForm";
import { cn } from "@/lib/utils";

interface OfficialRegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OfficialRegistryModal({ isOpen, onClose }: OfficialRegistryModalProps) {
  const { isRTL } = useLanguage();

  if (!isOpen) return null;

  return createPortal(
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs", isRTL ? "is-rtl" : "")}>
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10 scrollbar-thin">
        <button
          onClick={onClose}
          className={cn(
            "absolute top-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors z-20",
            isRTL ? "left-5" : "right-5"
          )}
          aria-label="Close modal"
          id="close-registry-modal-btn"
        >
          <X size={20} />
        </button>
        <div className="pt-2">
          <RegistrationForm />
        </div>
      </div>
    </div>,
    document.body
  );
}
