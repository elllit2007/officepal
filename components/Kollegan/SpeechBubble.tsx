"use client";

import { motion } from "framer-motion";
import styles from "./Kollegan.module.css";
import type { KollegSize } from "./types";

interface SpeechBubbleProps {
  message?: string;
  size: KollegSize;
  onApprove?: () => void;
  onEdit?: () => void;
  onReject?: () => void;
}

export default function SpeechBubble({
  message,
  size,
  onApprove,
  onEdit,
  onReject,
}: SpeechBubbleProps) {
  return (
    <motion.div
      className={`${styles.speechBubble} ${size === "small" ? styles.speechBubbleSmall : ""}`}
      initial={{ opacity: 0, scale: 0.85, x: -8 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.85, x: -8 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
      role="alertdialog"
      aria-label="Väntar på godkännande"
    >
      <span className={styles.speechBubbleTail} aria-hidden="true" />
      <p className={styles.speechBubbleMessage}>
        {message ?? "Något väntar på ditt godkännande."}
      </p>
      <div className={styles.speechBubbleActions}>
        <button
          type="button"
          className={`${styles.bubbleButton} ${styles.bubbleButtonApprove}`}
          onClick={onApprove}
        >
          Godkänn
        </button>
        <button
          type="button"
          className={`${styles.bubbleButton} ${styles.bubbleButtonEdit}`}
          onClick={onEdit}
        >
          Redigera
        </button>
        <button
          type="button"
          className={`${styles.bubbleButton} ${styles.bubbleButtonReject}`}
          onClick={onReject}
        >
          Avvisa
        </button>
      </div>
    </motion.div>
  );
}
