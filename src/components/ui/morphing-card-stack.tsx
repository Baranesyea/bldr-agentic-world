"use client"

import { useState, type ReactNode } from "react"
import { motion, AnimatePresence, type PanInfo } from "framer-motion"
import { ExternalLink } from "lucide-react"

export interface CardData {
  id: string
  title: string
  description: string
  icon?: ReactNode
  color?: string
  url?: string
}

export interface MorphingCardStackProps {
  cards?: CardData[]
  className?: string
  onCardClick?: (card: CardData) => void
}

const SWIPE_THRESHOLD = 50

export function MorphingCardStack({
  cards = [],
  className,
  onCardClick,
}: MorphingCardStackProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  if (!cards || cards.length === 0) return null

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info
    const swipe = Math.abs(offset.x) * velocity.x

    if (offset.x < -SWIPE_THRESHOLD || swipe < -1000) {
      setActiveIndex((prev) => (prev + 1) % cards.length)
    } else if (offset.x > SWIPE_THRESHOLD || swipe > 1000) {
      setActiveIndex((prev) => (prev - 1 + cards.length) % cards.length)
    }
    setIsDragging(false)
  }

  const getStackOrder = () => {
    const reordered = []
    for (let i = 0; i < cards.length; i++) {
      const index = (activeIndex + i) % cards.length
      reordered.push({ ...cards[index], stackPosition: i })
    }
    return reordered.reverse()
  }

  const stackCards = getStackOrder()

  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
      {/* Stack */}
      <div style={{ position: "relative", width: "100%", maxWidth: "420px", height: "280px" }}>
        <AnimatePresence mode="popLayout">
          {stackCards.map((card) => {
            const isTop = card.stackPosition === 0
            const offset = card.stackPosition

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{
                  opacity: offset > 2 ? 0 : 1 - offset * 0.15,
                  scale: 1 - offset * 0.04,
                  y: offset * 12,
                  x: 0,
                  zIndex: cards.length - offset,
                  rotate: (offset - 0.5) * 1.5,
                }}
                exit={{ opacity: 0, scale: 0.8, x: -300 }}
                transition={{ type: "spring", stiffness: 280, damping: 26 }}
                drag={isTop ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleDragEnd}
                whileDrag={{ scale: 1.03, cursor: "grabbing", rotate: 0 }}
                onClick={() => {
                  if (isDragging) return
                  if (card.url) {
                    window.open(card.url, "_blank", "noopener,noreferrer")
                  }
                  onCardClick?.(card)
                }}
                style={{
                  position: "absolute",
                  width: "100%",
                  minHeight: "220px",
                  borderRadius: "6px",
                  padding: "28px",
                  background: card.color || "rgba(18,18,42,0.97)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: isTop ? "0 12px 40px rgba(0,0,0,0.4)" : "0 4px 12px rgba(0,0,0,0.2)",
                  cursor: isTop ? (card.url ? "pointer" : "grab") : "default",
                  overflow: "hidden",
                }}
              >
                {/* Content */}
                <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  {card.icon && (
                    <div style={{
                      width: "44px", height: "44px", borderRadius: "4px",
                      background: "rgba(0,0,255,0.12)", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      color: "rgba(140,140,255,0.9)", flexShrink: 0,
                    }}>
                      {card.icon}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#f0f0f5", marginBottom: "8px", lineHeight: 1.3 }}>
                      {card.title}
                    </h3>
                    <p style={{ fontSize: "14px", color: "rgba(240,240,245,0.5)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
                      {card.description}
                    </p>
                  </div>
                </div>

                {/* URL button */}
                {card.url && isTop && (
                  <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-start" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      fontSize: "12px", color: "#3333FF", fontWeight: 600,
                      padding: "6px 14px", borderRadius: "4px",
                      background: "rgba(0,0,255,0.08)", border: "1px solid rgba(0,0,255,0.15)",
                    }}>
                      <ExternalLink size={12} />
                      קרא עוד
                    </span>
                  </div>
                )}

                {/* Swipe hint */}
                {isTop && cards.length > 1 && (
                  <div style={{ position: "absolute", bottom: "10px", left: 0, right: 0, textAlign: "center" }}>
                    <span style={{ fontSize: "11px", color: "rgba(240,240,245,0.2)" }}>החלק לניווט</span>
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      {cards.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              style={{
                height: "6px", borderRadius: "3px", border: "none", cursor: "pointer",
                width: index === activeIndex ? "20px" : "6px",
                background: index === activeIndex ? "#0000FF" : "rgba(240,240,245,0.2)",
                transition: "all 0.3s",
              }}
              aria-label={`כרטיס ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
