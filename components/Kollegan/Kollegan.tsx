"use client";

import { useEffect, useId, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { primary, semantic, motion as motionTokens } from "@/design/tokens";
import styles from "./Kollegan.module.css";
import SpeechBubble from "./SpeechBubble";
import type { KollegProps } from "./types";

/**
 * Kollegan — OfficePals figur.
 *
 * Kontrakt (BUILD-CONTRACT.md, Track 5): props `state`, `size`, `message`,
 * `onApprove`, `onEdit`, `onReject`, `className`. Fyra lägen:
 *   idle       — lugn, andas, blinkar.
 *   listening  — mikrofonen lyser, ljudringar, ljudstaplar på bröstet.
 *   asking     — lutar sig fram med höjt ögonbryn, bröstlampan blir bärnsten
 *                och pratbubblan visar ÅTGÄRDEN som väntar.
 *   done       — ett litet hopp, glada ögon, grön bock på bröstet, återgår
 *                till idle efter DONE_VISIBLE_MS.
 *
 * Färger kommer från design/tokens.ts (animerade fyllningar behöver riktiga
 * värden, inte var()). Formspråket delas med LogoMark i components/ui.
 */

const DONE_VISIBLE_MS = parseInt(motionTokens.duration.linger, 10);

const COLOR = {
  body: primary[500],
  bodyLight: primary[400],
  bodyDark: primary[700],
  trim: primary[800],
  face: primary[100],
  eye: primary[900],
  mic: primary[300],
  micLit: primary[50],
  chestIdle: primary[700],
  chestAsking: semantic.warning.solid,
  chestDone: semantic.success.solid,
  white: "#FFFFFF",
} as const;

const MOUTH = {
  idle: "M88 104 Q100 113 112 104",
  listening: "M90 103 Q100 116 110 103",
  asking: "M91 106 Q100 109 109 106",
  done: "M85 101 Q100 119 115 101",
} as const;

const SPRING = motionTokens.easing.spring;
const SPRING_SOFT = motionTokens.easing.springSoft;

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
  const gradientId = useId();

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

  const chestColor = isDone
    ? COLOR.chestDone
    : isAsking
      ? COLOR.chestAsking
      : COLOR.chestIdle;

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={`${styles.wrapper} ${styles[size]} ${className ?? ""}`}
        data-state={visualState}
      >
        <motion.svg
          className={styles.figure}
          viewBox="0 0 200 200"
          role="img"
          aria-label={`Kollegan, status: ${visualState}`}
          initial={false}
          animate={
            isAsking
              ? { rotate: -5, y: 3, scale: 1.02 }
              : isDone
                ? { rotate: 0, y: [0, -12, 0], scale: [1, 1.04, 1] }
                : isListening
                  ? { rotate: 2, y: -2, scale: 1 }
                  : { rotate: 0, y: [0, -4, 0], scale: 1 }
          }
          transition={
            isAsking || isListening
              ? SPRING
              : isDone
                ? { duration: 0.6, ease: [...motionTokens.easing.inOutCurve] }
                : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
          }
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={COLOR.bodyLight} />
              <stop offset="1" stopColor={COLOR.body} />
            </linearGradient>
          </defs>

          {/* Markskugga */}
          <motion.ellipse
            cx={100}
            cy={181}
            rx={46}
            ry={6}
            fill={COLOR.trim}
            initial={false}
            animate={{ opacity: isDone ? [0.12, 0.05, 0.12] : 0.12 }}
            transition={{ duration: 0.6 }}
          />

          {/* Fötter */}
          <rect x={66} y={160} width={26} height={16} rx={8} fill={COLOR.bodyDark} />
          <rect x={108} y={160} width={26} height={16} rx={8} fill={COLOR.bodyDark} />

          {/* Ljudringar från mikrofonen (listening) */}
          {[0, 1].map((ring) => (
            <motion.circle
              key={ring}
              cx={42}
              cy={118}
              r={6}
              fill="none"
              stroke={COLOR.mic}
              strokeWidth={2}
              initial={false}
              animate={
                isListening
                  ? { opacity: [0.7, 0], scale: [1, 4] }
                  : { opacity: 0, scale: 1 }
              }
              transition={
                isListening
                  ? { duration: 1.6, repeat: Infinity, delay: ring * 0.8, ease: "easeOut" }
                  : { duration: 0.2 }
              }
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            />
          ))}

          {/* Kropp */}
          <rect
            x={40}
            y={36}
            width={120}
            height={132}
            rx={44}
            fill={`url(#${gradientId})`}
          />

          {/* Headset: båge, kuddar, mikrofonarm */}
          <path
            d="M46 76 A54 54 0 0 1 154 76"
            fill="none"
            stroke={COLOR.trim}
            strokeWidth={6}
            strokeLinecap="round"
          />
          <rect x={33} y={66} width={13} height={24} rx={6.5} fill={COLOR.trim} />
          <rect x={154} y={66} width={13} height={24} rx={6.5} fill={COLOR.trim} />
          <path
            d="M40 90 C28 98 28 112 40 117"
            fill="none"
            stroke={COLOR.trim}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <motion.circle
            cx={42}
            cy={118}
            r={5.5}
            initial={false}
            animate={{
              fill: isListening ? [COLOR.mic, COLOR.micLit, COLOR.mic] : COLOR.mic,
              scale: isListening ? [1, 1.25, 1] : 1,
            }}
            transition={
              isListening
                ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.3 }
            }
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />

          {/* Ansiktsskärm */}
          <rect x={58} y={58} width={84} height={62} rx={20} fill={COLOR.face} />

          {/* Ögonbryn (asking) */}
          <motion.path
            d="M104 71 L119 67"
            stroke={COLOR.eye}
            strokeWidth={3}
            strokeLinecap="round"
            initial={false}
            animate={{ opacity: isAsking ? 1 : 0, y: isAsking ? 0 : 4 }}
            transition={{ duration: 0.25 }}
          />

          {/* Ögon */}
          {[78, 110].map((x) => (
            <motion.rect
              key={x}
              x={x}
              y={76}
              width={11}
              height={17}
              rx={5.5}
              fill={COLOR.eye}
              initial={false}
              animate={{
                scaleY: isIdle
                  ? [1, 1, 1, 0.1, 1]
                  : isDone
                    ? 0.55
                    : isListening
                      ? 1.1
                      : 1,
                y: isDone ? 3 : 0,
              }}
              transition={
                isIdle
                  ? {
                      duration: 4.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      times: [0, 0.86, 0.9, 0.94, 1],
                    }
                  : { duration: 0.25 }
              }
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            />
          ))}

          {/* Mun */}
          <motion.path
            fill="none"
            stroke={COLOR.eye}
            strokeWidth={3.5}
            strokeLinecap="round"
            initial={false}
            animate={{ d: MOUTH[visualState] }}
            transition={SPRING_SOFT}
          />

          {/* Bröstlampa */}
          <motion.rect
            x={87}
            y={131}
            width={26}
            height={26}
            rx={9}
            initial={false}
            animate={{
              fill: chestColor,
              scale: isAsking ? [1, 1.08, 1] : 1,
            }}
            transition={
              isAsking
                ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.3 }
            }
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
          <motion.rect
            x={87}
            y={131}
            width={26}
            height={26}
            rx={9}
            fill={COLOR.chestAsking}
            initial={false}
            animate={isAsking ? { opacity: [0.5, 0], scale: [1, 2.2] } : { opacity: 0, scale: 1 }}
            transition={
              isAsking
                ? { duration: 1.4, repeat: Infinity, ease: "easeOut" }
                : { duration: 0.2 }
            }
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />

          {/* Bröstlampa: innehåll per läge (alla ritas, synlighet animeras) */}
          <motion.g
            initial={false}
            animate={{ opacity: isListening ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {[93, 99, 105].map((x, i) => (
              <motion.rect
                key={x}
                x={x - 1.5}
                y={138}
                width={3}
                height={12}
                rx={1.5}
                fill={COLOR.white}
                initial={false}
                animate={{ scaleY: isListening ? [0.35, 1, 0.35] : 0.35 }}
                transition={
                  isListening
                    ? { duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }
                    : { duration: 0.2 }
                }
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              />
            ))}
          </motion.g>
          <motion.path
            d="M92 144 L98 150 L109 138"
            fill="none"
            stroke={COLOR.white}
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: isDone ? 1 : 0, opacity: isDone ? 1 : 0 }}
            transition={
              isDone
                ? { duration: 0.45, ease: "easeOut", delay: 0.15 }
                : { duration: 0.15 }
            }
          />
          <motion.circle
            cx={100}
            cy={144}
            r={4}
            fill={COLOR.white}
            initial={false}
            animate={{ opacity: isListening || isDone ? 0 : isAsking ? 0.95 : 0.55 }}
            transition={{ duration: 0.2 }}
          />
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
    </MotionConfig>
  );
}
