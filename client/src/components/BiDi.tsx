import React from "react";
import { cn } from "@/lib/utils";

interface BdiProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * Standard Unicode Bidirectional Isolation container.
 * Enforces LTR directionality for numbers, phone numbers, codes, currency, and Latin text inside RTL contexts.
 */
export function Bdi({ children, className, ...props }: BdiProps) {
  return (
    <bdi dir="ltr" className={cn("inline-block unicode-isolate", className)} {...props}>
      {children}
    </bdi>
  );
}

/**
 * Explicit LTR inline block for brand names, acronyms, and alphanumeric identifiers.
 */
export function Ltr({ children, className, ...props }: BdiProps) {
  return (
    <span dir="ltr" className={cn("inline-block bidi-ltr", className)} {...props}>
      {children}
    </span>
  );
}

/**
 * Isolated Brand Name component ensuring "Bilingual Idol", "WhatsApp", "Touch 'n Go"
 * never flip in RTL sentences.
 */
export function BidiBrand({ name = "Bilingual Idol", className }: { name?: string; className?: string }) {
  return (
    <bdi dir="ltr" className={cn("inline-block font-semibold", className)}>
      {name}
    </bdi>
  );
}

/**
 * Isolated Phone Number component with LTR direction and monospace legibility.
 */
export function BidiPhone({ phone, className }: { phone: string; className?: string }) {
  return (
    <bdi dir="ltr" className={cn("inline-block font-mono tracking-tight", className)}>
      {phone}
    </bdi>
  );
}

/**
 * Isolated Currency component ensuring MYR / RM and price numbers preserve visual order.
 */
export function BidiCurrency({
  amount,
  currency = "RM",
  className,
}: {
  amount: string | number;
  currency?: string;
  className?: string;
}) {
  return (
    <bdi dir="ltr" className={cn("inline-block font-semibold", className)}>
      {currency} {typeof amount === "number" ? amount.toLocaleString("en-US") : amount}
    </bdi>
  );
}
