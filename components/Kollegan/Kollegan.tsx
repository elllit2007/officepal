"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./Kollegan.module.css";
import SpeechBubble from "./SpeechBubble";
import type { KollegProps } from "./types";

const PRIMARY = "#2563EB";
const ACCENT = "#1E3A8A";
const FACE = "#DBEAFE";
const SUCCESS = "#10B981";

const DONE_VISIBLE_MS = 2000;

export default function Kollegan({
  state,
  size = "large",
  message,
  onApprove,
  onEdit,
  onReject,
  className,
}: KollegProps) {
  const [visualState, setVisualState] = useState(state);
  const [prevState, setPrevState] = useState(state);

  if (state !== prevState) {
    setPrevState(state);
    setVisualState(state);
  }

  useEffect(() => {
    if (state !== "done") return;
    const timer = setTimeout(() => setVisualState("idle"), DONE_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [state]);

  const isIdle = visualState === "idle";
  const isListening = visualState === "listening";
  const isAsking = visualState === "asking";
  const isDone = visualState === "done";

  const chestColor = isDone ? SUCCESS : ACCENT;
  const chestHaloColor = isDone ? SUCCESS : PRIMARY;
  const showBodyGlow = isAsking;
  const showChestGlow = isListening;

  return (
    <div
      className={`${styles.wrapper} ${size === "small" ? styles.small : styles.large} ${className ?? ""}`}
    >
      <motion.svg
        className={styles.figure}
        viewBox="0 0 200 200"
        role="img"
        aria-label={`Kollegan, status: ${visualState}`}
        animate={
          isAsking
            ? { rotate: -6, y: 4, scale: 1.03 }
            : { rotate: 0, y: isIdle ? [0, -6, 0] : 0, scale: 1 }
        }
        transition={
          isAsking
            ? { type: "spring", stiffness: 260, damping: 20 }
            : isIdle
              ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.3 }
        }
      >
        {/* Whole-body glow, used for "asking" */}
        <motion.rect
          x={35}
          y={40}
          width={130}
          height={130}
          rx={48}
          fill={PRIMARY}
          style={{ filter: "blur(10px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: showBodyGlow ? [0.25, 0.55, 0.25] : 0 }}
          transition={{ duration: 1.6, repeat: showBodyGlow ? Infinity : 0, ease: "easeInOut" }}
        />

        {/* Squircle body */}
        <rect
          x={35}
          y={40}
          width={130}
          height={130}
          rx={48}
          fill={PRIMARY}
          stroke={ACCENT}
          strokeWidth={3}
        />

        {/* Headset arc */}
        <path
          d="M52,58 A48,48 0 0 1 148,58"
          fill="none"
          stroke={ACCENT}
          strokeWidth={6}
          strokeLinecap="round"
        />
        <circle cx={52} cy={60} r={8} fill={ACCENT} />
        <circle cx={148} cy={60} r={8} fill={ACCENT} />

        {/* Face panel */}
        <rect x={60} y={64} width={80} height={56} rx={22} fill={FACE} />

        {/* Eyes */}
        <motion.ellipse
          cx={85}
          cy={92}
          rx={7}
          animate={{
            ry: isIdle ? [7, 7, 7, 1, 7] : isListening ? 8 : 7,
          }}
          transition={
            isIdle
              ? {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.85, 0.9, 0.95, 1],
                }
              : { duration: 0.25 }
          }
          fill={ACCENT}
        />
        <motion.ellipse
          cx={115}
          cy={92}
          rx={7}
          animate={{
            ry: isIdle ? [7, 7, 7, 1, 7] : isListening ? 8 : 7,
          }}
          transition={
            isIdle
              ? {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.85, 0.9, 0.95, 1],
                }
              : { duration: 0.25 }
          }
          fill={ACCENT}
        />

        {/* Chest glow halo, used for "listening" and "done" */}
        <motion.circle
          cx={100}
          cy={140}
          r={16}
          fill={chestHaloColor}
          style={{ filter: "blur(6px)" }}
          initial={{ opacity: 0, scale: 1 }}
          animate={
            showChestGlow
              ? { opacity: [0.3, 0.75, 0.3], scale: [1, 1.35, 1] }
              : isDone
                ? { opacity: [0.7, 0], scale: [1, 1.9] }
                : { opacity: 0, scale: 1 }
          }
          transition={
            showChestGlow
              ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
              : isDone
                ? { duration: 1, repeat: 1, repeatType: "loop", ease: "easeOut" }
                : { duration: 0.3 }
          }
        />

        {/* Chest */}
        <motion.circle
          cx={100}
          cy={140}
          r={14}
          animate={{ fill: chestColor }}
          transition={{ duration: 0.3 }}
        />

        {/* Checkmark, shown for "done" */}
        <AnimatePresence>
          {isDone && (
            <motion.path
              d="M92,140 l6,7 l12,-16"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>
      </motion.svg>

      <AnimatePresence>
        {isAsking && (
          <SpeechBubble
            message={message}
            size={size}
            onApprove={onApprove}
            onEdit={onEdit}
            onReject={onReject}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
