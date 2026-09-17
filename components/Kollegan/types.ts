export type KollegState = "idle" | "listening" | "asking" | "done";

export type KollegSize = "large" | "small" | "tiny";

export interface KollegProps {
  /** Styr figurens beteende och animation. */
  state: KollegState;
  /** "large" för dashboard, "small" för kompakt vy, "tiny" för en ~48px persistent hörnbadge. */
  size?: KollegSize;
  /** Beskriver ÅTGÄRDEN som väntar på godkännande. Visas i pratbubblan när state="asking". */
  message?: string;
  onApprove?: () => void;
  onEdit?: () => void;
  onReject?: () => void;
  className?: string;
}
