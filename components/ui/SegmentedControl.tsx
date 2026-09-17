"use client";

import { cn } from "./cn";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Tillgängligt namn för gruppen. */
  label: string;
  /** "ink" = mörkt navy-piller (förtroendereglaget), "brand" = blått. */
  tone?: "ink" | "brand";
  size?: "sm" | "md";
  className?: string;
}

/**
 * Piller-flikar / segmenterat reglage. Används för vyväxling (Översikt /
 * Innehav) och för förtroendereglaget (Frågar alltid / Frågar vid
 * osäkerhet / Sköter själv).
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  tone = "ink",
  size = "md",
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full border border-line bg-surface-muted p-1",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full whitespace-nowrap transition-[background-color,color,box-shadow] duration-base ease-out focus-visible:outline-none focus-visible:shadow-focus",
              size === "sm" ? "px-3 py-1.5 text-body-sm" : "px-4 py-2 text-label",
              selected
                ? tone === "ink"
                  ? "bg-surface-ink text-on-brand shadow-sm font-semibold"
                  : "bg-primary-500 text-on-brand shadow-sm font-semibold"
                : "text-neutral-600 hover:text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
