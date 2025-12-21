'use client'

import { motion } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import { CELEBRATION_COLORS } from './types'

interface ConfettiPiece {
    id: number
    x: number
    y: number
    rotation: number
    color: string
    size: number
    velocityX: number
    shape: 'circle' | 'square' | 'rectangle'
    finalRotation: number
    animationDuration: number
}

interface ConfettiBurstProps {
    intensity?: number
    duration?: number
    colors?: string[]
}

export function ConfettiBurst({
    intensity = 50,
    duration = 4,
    colors = Object.values(CELEBRATION_COLORS)
}: ConfettiBurstProps) {
    const [pieces, setPieces] = useState<ConfettiPiece[]>([])
    const isInitialized = useRef(false)

    useEffect(() => {
        // Only initialize once to prevent infinite loop
        if (isInitialized.current || typeof window === 'undefined') return
        isInitialized.current = true

        const newPieces = Array.from({ length: intensity }, (_, i) => {
            const shapes: ('circle' | 'square' | 'rectangle')[] = ['circle', 'square', 'rectangle']
            return {
                id: i,
                x: Math.random() * window.innerWidth,
                y: -20 - Math.random() * 100, // Stagger starting positions
                rotation: Math.random() * 360,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 8 + 4, // 4-12px
                velocityX: (Math.random() - 0.5) * 300, // Horizontal spread
                shape: shapes[Math.floor(Math.random() * shapes.length)],
                finalRotation: Math.random() * 360 + (Math.random() * 720 + 360), // Pre-calculate final rotation
                animationDuration: duration + Math.random() * 2, // Pre-calculate animation duration
            }
        })
        setPieces(newPieces)
    }, []) // Empty dependency array - only run once


    if (typeof window === 'undefined') return null

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {pieces.map((piece) => (
                <motion.div
                    key={piece.id}
                    className="absolute"
                    style={{
                        left: piece.x,
                        backgroundColor: piece.color,
                        width: piece.shape === 'rectangle' ? piece.size * 1.5 : piece.size,
                        height: piece.size,
                        borderRadius: piece.shape === 'circle' ? '50%' : piece.shape === 'square' ? '2px' : '1px',
                    }}
                    initial={{
                        y: piece.y,
                        rotate: 0,
                        opacity: 1,
                    }}
                    animate={{
                        y: window.innerHeight + 100,
                        rotate: piece.finalRotation, // Use pre-calculated value
                        opacity: [1, 1, 0.8, 0],
                        x: piece.x + piece.velocityX,
                    }}
                    transition={{
                        duration: piece.animationDuration, // Use pre-calculated value
                        ease: [0.25, 0.1, 0.25, 1], // Custom easing for natural fall
                        opacity: {
                            times: [0, 0.7, 0.9, 1],
                            duration: duration,
                        },
                    }}
                />
            ))}
        </div>
    )
}
