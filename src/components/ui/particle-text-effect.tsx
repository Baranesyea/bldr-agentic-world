"use client"

import { useEffect, useRef } from "react"

interface Vector2D {
  x: number
  y: number
}

class Particle {
  pos: Vector2D = { x: 0, y: 0 }
  vel: Vector2D = { x: 0, y: 0 }
  acc: Vector2D = { x: 0, y: 0 }
  target: Vector2D = { x: 0, y: 0 }
  closeEnoughTarget = 100
  maxSpeed = 1.0
  maxForce = 0.1
  particleSize = 10
  isKilled = false
  startColor = { r: 0, g: 0, b: 0 }
  targetColor = { r: 0, g: 0, b: 0 }
  colorWeight = 0
  colorBlendRate = 0.01

  move() {
    let proximityMult = 1
    const distance = Math.sqrt(Math.pow(this.pos.x - this.target.x, 2) + Math.pow(this.pos.y - this.target.y, 2))
    if (distance < this.closeEnoughTarget) proximityMult = distance / this.closeEnoughTarget

    const towardsTarget = { x: this.target.x - this.pos.x, y: this.target.y - this.pos.y }
    const magnitude = Math.sqrt(towardsTarget.x ** 2 + towardsTarget.y ** 2)
    if (magnitude > 0) {
      towardsTarget.x = (towardsTarget.x / magnitude) * this.maxSpeed * proximityMult
      towardsTarget.y = (towardsTarget.y / magnitude) * this.maxSpeed * proximityMult
    }

    const steer = { x: towardsTarget.x - this.vel.x, y: towardsTarget.y - this.vel.y }
    const steerMag = Math.sqrt(steer.x ** 2 + steer.y ** 2)
    if (steerMag > 0) {
      steer.x = (steer.x / steerMag) * this.maxForce
      steer.y = (steer.y / steerMag) * this.maxForce
    }

    this.acc.x += steer.x; this.acc.y += steer.y
    this.vel.x += this.acc.x; this.vel.y += this.acc.y
    this.pos.x += this.vel.x; this.pos.y += this.vel.y
    this.acc.x = 0; this.acc.y = 0
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.colorWeight < 1.0) this.colorWeight = Math.min(this.colorWeight + this.colorBlendRate, 1.0)
    const c = {
      r: Math.round(this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight),
      g: Math.round(this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight),
      b: Math.round(this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight),
    }
    ctx.fillStyle = `rgb(${c.r}, ${c.g}, ${c.b})`
    ctx.fillRect(this.pos.x, this.pos.y, 2, 2)
  }

  kill(width: number, height: number) {
    if (!this.isKilled) {
      const angle = Math.random() * Math.PI * 2
      const mag = (width + height) / 2
      this.target.x = width / 2 + Math.cos(angle) * mag
      this.target.y = height / 2 + Math.sin(angle) * mag
      this.startColor = {
        r: this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight,
        g: this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight,
        b: this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight,
      }
      this.targetColor = { r: 0, g: 0, b: 0 }
      this.colorWeight = 0
      this.isKilled = true
    }
  }
}

interface ParticleTextEffectProps {
  words?: string[]
  style?: React.CSSProperties
}

export function ParticleTextEffect({ words = ["Agentic", "World", "BLDR"], style }: ParticleTextEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const particlesRef = useRef<Particle[]>([])
  const frameCountRef = useRef(0)
  const wordIndexRef = useRef(0)

  const pixelSteps = 6

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
      }
    }
    resize()
    window.addEventListener("resize", resize)

    const nextWord = (word: string) => {
      const offscreen = document.createElement("canvas")
      offscreen.width = canvas.width
      offscreen.height = canvas.height
      const offCtx = offscreen.getContext("2d")!
      offCtx.fillStyle = "white"
      const fontSize = Math.min(canvas.width / 6, 120)
      offCtx.font = `bold ${fontSize}px 'Merriweather', serif`
      offCtx.textAlign = "center"
      offCtx.textBaseline = "middle"
      offCtx.fillText(word, canvas.width / 2, canvas.height / 2)

      const imageData = offCtx.getImageData(0, 0, canvas.width, canvas.height)
      const pixels = imageData.data
      const newColor = {
        r: 50 + Math.random() * 100,
        g: 50 + Math.random() * 100,
        b: 150 + Math.random() * 105,
      }

      const particles = particlesRef.current
      let pi = 0
      const coords: number[] = []
      for (let i = 0; i < pixels.length; i += pixelSteps * 4) coords.push(i)
      for (let i = coords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [coords[i], coords[j]] = [coords[j], coords[i]]
      }

      for (const ci of coords) {
        if (pixels[ci + 3] > 0) {
          const x = (ci / 4) % canvas.width
          const y = Math.floor(ci / 4 / canvas.width)
          let p: Particle
          if (pi < particles.length) {
            p = particles[pi]; p.isKilled = false; pi++
          } else {
            p = new Particle()
            const angle = Math.random() * Math.PI * 2
            const mag = (canvas.width + canvas.height) / 2
            p.pos.x = canvas.width / 2 + Math.cos(angle) * mag
            p.pos.y = canvas.height / 2 + Math.sin(angle) * mag
            p.maxSpeed = Math.random() * 6 + 4
            p.maxForce = p.maxSpeed * 0.05
            p.colorBlendRate = Math.random() * 0.0275 + 0.0025
            particles.push(p)
          }
          p.startColor = {
            r: p.startColor.r + (p.targetColor.r - p.startColor.r) * p.colorWeight,
            g: p.startColor.g + (p.targetColor.g - p.startColor.g) * p.colorWeight,
            b: p.startColor.b + (p.targetColor.b - p.startColor.b) * p.colorWeight,
          }
          p.targetColor = newColor
          p.colorWeight = 0
          p.target.x = x; p.target.y = y
        }
      }
      for (let i = pi; i < particles.length; i++) particles[i].kill(canvas.width, canvas.height)
    }

    const animate = () => {
      const ctx = canvas.getContext("2d")!
      ctx.fillStyle = "rgba(5, 5, 16, 0.12)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const particles = particlesRef.current
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].move()
        particles[i].draw(ctx)
        if (particles[i].isKilled) {
          const p = particles[i]
          if (p.pos.x < -50 || p.pos.x > canvas.width + 50 || p.pos.y < -50 || p.pos.y > canvas.height + 50) {
            particles.splice(i, 1)
          }
        }
      }

      frameCountRef.current++
      if (frameCountRef.current % 300 === 0) {
        wordIndexRef.current = (wordIndexRef.current + 1) % words.length
        nextWord(words[wordIndexRef.current])
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    nextWord(words[0])
    animate()

    return () => {
      cancelAnimationFrame(animationRef.current)
      window.removeEventListener("resize", resize)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        ...style,
      }}
    />
  )
}
