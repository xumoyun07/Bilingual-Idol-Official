import * as React from "react";
import { Filter, SlidersHorizontal, RotateCcw, Check, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface FilterDrawerProps {
  /** Controls drawer open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Title rendered in the sheet header */
  title?: string;
  /** Description or subtitle rendered below title */
  description?: string;
  /** Count of currently active (non-default) filters */
  activeCount?: number;
  /** Custom trigger button label */
  triggerLabel?: string;
  /** Custom trigger button class */
  triggerClassName?: string;
  /** Whether to hide the built-in trigger button (when using custom trigger) */
  hideTrigger?: boolean;
  /** Drawer placement side: bottom sheet or side panel */
  side?: "bottom" | "right" | "left";
  /** Callback when user clicks "Reset all" */
  onReset: () => void;
  /** Optional callback when user clicks "Apply" */
  onApply?: () => void;
  /** Label for reset button */
  resetLabel?: string;
  /** Label for apply button */
  applyLabel?: string;
  /** Stacked filter controls rendered inside */
  children: React.ReactNode;
  /** Container class for filter items */
  contentClassName?: string;
}

export function FilterDrawer({
  open,
  onOpenChange,
  title = "Filters",
  description,
  activeCount = 0,
  triggerLabel = "Filters",
  triggerClassName,
  hideTrigger = false,
  side = "bottom",
  onReset,
  onApply,
  resetLabel = "Reset all",
  applyLabel = "Apply filters",
  children,
  contentClassName,
}: FilterDrawerProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

  const handleApply = () => {
    onApply?.();
    setIsOpen?.(false);
  };

  const handleReset = () => {
    onReset();
  };

  const isBottom = side === "bottom";

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {!hideTrigger && (
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "relative min-h-10 sm:min-h-11 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border transition-all duration-200 gap-2 flex items-center justify-center shrink-0",
              activeCount > 0
                ? "border-[#173fad] bg-[#eef4ff] text-[#173fad] hover:bg-[#e4edff] shadow-xs"
                : "border-[#dce4e7] bg-white text-[#29415b] hover:bg-[#f8fafb] hover:border-[#cfd9de]",
              triggerClassName
            )}
            aria-label={`${triggerLabel}${activeCount > 0 ? ` (${activeCount} active)` : ""}`}
          >
            <SlidersHorizontal size={15} className="shrink-0" />
            <span className="truncate">{triggerLabel}</span>
            {activeCount > 0 && (
              <span className="flex items-center justify-center h-5 min-w-5 px-1.5 text-[11px] font-bold rounded-full bg-[#173fad] text-white shrink-0 animate-in fade-in zoom-in-75">
                {activeCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
      )}

      <SheetContent
        side={side}
        className={cn(
          "bg-white border-[#dce4e7] p-0 flex flex-col z-50",
          isBottom
            ? "inset-x-0 bottom-0 rounded-t-2xl max-h-[88vh] border-t shadow-2xl"
            : "w-full sm:max-w-md h-full border-s shadow-2xl"
        )}
      >
        {/* Mobile Pull Handle (for bottom sheet) */}
        {isBottom && (
          <div className="pt-2.5 pb-1 flex justify-center shrink-0" aria-hidden="true">
            <span className="h-1.5 w-12 rounded-full bg-[#d0d9dc]" />
          </div>
        )}

        {/* Sheet Header */}
        <SheetHeader className="px-5 sm:px-6 pt-3 pb-3 border-b border-[#edf2f5] shrink-0 text-start">
          <div className="flex items-center justify-between gap-3 pe-8">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef4ff] text-[#173fad] shrink-0">
                <Filter size={16} />
              </div>
              <div>
                <SheetTitle className="text-base sm:text-lg font-bold text-[#10253e] tracking-tight">
                  {title}
                </SheetTitle>
                {description && (
                  <SheetDescription className="text-xs text-[#53657a] mt-0.5">
                    {description}
                  </SheetDescription>
                )}
              </div>
            </div>

            {activeCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-[#eef4ff] text-[#173fad] border-[#c0d4ff] text-xs font-semibold px-2 py-0.5"
              >
                {activeCount} active
              </Badge>
            )}
          </div>
        </SheetHeader>

        {/* Sheet Body: Scrollable vertically stacked filter controls */}
        <div
          className={cn(
            "flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4 sm:space-y-5 text-start overscroll-contain",
            contentClassName
          )}
        >
          {children}
        </div>

        {/* Sheet Footer: Reset and Apply buttons */}
        <SheetFooter className="p-4 sm:p-5 border-t border-[#edf2f5] bg-[#fbfcfe] shrink-0 mt-auto">
          <div className="flex items-center gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="flex-1 min-h-11 sm:min-h-12 border-[#dce4e7] text-[#53657a] hover:bg-[#f3f6f8] hover:text-[#10253e] font-semibold text-xs sm:text-sm rounded-xl gap-1.5"
            >
              <RotateCcw size={14} className="shrink-0" />
              <span>{resetLabel}</span>
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              className="flex-1 min-h-11 sm:min-h-12 bg-[#173fad] hover:bg-[#10253e] text-white font-semibold text-xs sm:text-sm rounded-xl gap-1.5 shadow-sm transition-all hover:translate-y-[-1px]"
            >
              <Check size={15} className="shrink-0" />
              <span>{applyLabel}</span>
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
