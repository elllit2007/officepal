"use client";

import { useState, useTransition } from "react";
import type { TrustLevel, TrustSetting } from "@/lib/types";
import { Alert, Badge, SegmentedControl } from "@/components/ui";
import { setTrustLevel } from "../actions";
import { TRUST_TASK_TYPES, type TrustTaskType } from "../trust";

const TASKS: Record<TrustTaskType, { label: string; description: string }> = {
  invoice_draft: {
    label: "Fakturautkast",
    description: "När en fältrapport blir ett fakturautkast till kund.",
  },
  quote_draft: {
    label: "Offertutkast",
    description: "När Kollegan tar fram en offert åt en kund.",
  },
  field_report_extraction: {
    label: "Tolkning av fältrapporter",
    description: "När Kollegan läser ut kund, adress och utfört arbete ur en rapport.",
  },
};

const LEVELS: { value: TrustLevel; label: string }[] = [
  { value: "ask_always", label: "Frågar alltid" },
  { value: "ask_if_unsure", label: "Frågar vid osäkerhet" },
  { value: "autonomous", label: "Sköter själv" },
];

const LEVEL_TONE: Record<TrustLevel, "info" | "warning" | "success"> = {
  ask_always: "info",
  ask_if_unsure: "warning",
  autonomous: "success",
};

/**
 * Förtroendereglaget: en rad per uppgiftstyp. Saknas en rad i databasen
 * visas schemats standard (ask_always). Ändringar sparas direkt.
 */
export default function TrustDial({ settings }: { settings: TrustSetting[] }) {
  const initial = Object.fromEntries(
    TRUST_TASK_TYPES.map((task) => [
      task,
      settings.find((s) => s.task_type === task)?.level ?? "ask_always",
    ]),
  ) as Record<TrustTaskType, TrustLevel>;

  const [levels, setLevels] = useState(initial);
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const change = (task: TrustTaskType, level: TrustLevel) => {
    const previous = levels[task];
    setLevels((prev) => ({ ...prev, [task]: level }));
    setMessage(null);
    startTransition(async () => {
      const result = await setTrustLevel(task, level);
      if (result.error) {
        setLevels((prev) => ({ ...prev, [task]: previous }));
        setMessage({ tone: "danger", text: result.error });
      } else {
        setMessage({ tone: "success", text: `${TASKS[task].label}: ${LEVELS.find((l) => l.value === level)?.label}.` });
      }
    });
  };

  return (
    <div className="flex flex-col gap-5" aria-busy={pending || undefined}>
      <ul className="flex flex-col divide-y divide-line">
        {TRUST_TASK_TYPES.map((task) => (
          <li
            key={task}
            className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 lg:flex-row lg:items-center lg:justify-between lg:gap-6"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-h4">{TASKS[task].label}</p>
                <Badge tone={LEVEL_TONE[levels[task]]} size="sm" dot>
                  {LEVELS.find((l) => l.value === levels[task])?.label}
                </Badge>
              </div>
              <p className="mt-0.5 text-body-sm text-muted">{TASKS[task].description}</p>
            </div>
            <SegmentedControl
              label={`Förtroendenivå för ${TASKS[task].label}`}
              size="sm"
              value={levels[task]}
              onChange={(level) => change(task, level)}
              options={LEVELS}
              className="max-w-full overflow-x-auto"
            />
          </li>
        ))}
      </ul>
      {message && (
        <Alert tone={message.tone} plain>
          {message.text}
        </Alert>
      )}
      <p className="text-body-sm text-muted">
        Alla företag börjar på <span className="font-medium text-ink">Frågar alltid</span>. Höj
        nivån i din egen takt — Kollegan frågar tills du säger att hon får sköta det själv.
      </p>
    </div>
  );
}
