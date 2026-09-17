"use client";

import { motion } from "framer-motion";
import { motion as motionTokens } from "@/design/tokens";
import { Button } from "@/components/ui/Button";
import styles from "./Kollegan.module.css";
import type { KollegSize } from "./types";

interface SpeechBubbleProps {
  message?: string;
  size: KollegSize;
  onApprove?: () => void;
  onEdit?: () => void;
  onReject?: () => void;
}

/**
 * Pratbubblan i "asking"-läget. Beskriver ÅTGÄRDEN som väntar och ger tre
 * tydliga val. Under den stora figuren ligger bubblan nedanför (fungerar
 * på mobil); vid small/tiny ligger den till höger.
 */
export default function SpeechBubble({
  message,
  size,
  onApprove,
  onEdit,
  onReject,
}: SpeechBubbleProps) {
  const below = size === "large";
  const buttonSize = size === "large" ? "md" : "sm";

  return (
    <motion.div
      className={`${styles.bubble} ${below ? styles.bubbleBelow : styles.bubbleSide} ${
        size === "tiny" ? styles.bubbleTiny : ""
      }`}
      initial={{ opacity: 0, scale: 0.92, y: below ? -6 : 0, x: below ? 0 : -6 }}
      animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: below ? -6 : 0, x: below ? 0 : -6 }}
      transition={motionTokens.easing.spring}
      role="alertdialog"
      aria-label="Väntar på godkännande"
    >
      <span className={styles.bubbleTail} aria-hidden="true" />
      <p className={styles.bubbleMessage}>
        {message ?? "Något väntar på ditt godkännande."}
      </p>
      <div className={styles.bubbleActions}>
        <Button size={buttonSize} variant="primary" onClick={onApprove}>
          Godkänn
        </Button>
        <Button size={buttonSize} variant="secondary" onClick={onEdit}>
          Redigera
        </Button>
        <Button size={buttonSize} variant="destructive" onClick={onReject}>
          Avvisa
        </Button>
      </div>
    </motion.div>
  );
}
