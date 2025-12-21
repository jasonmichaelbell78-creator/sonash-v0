'use client'

import { motion } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'

interface Spark {
    id: number
    angle: number
    color: string
    distance: number
}

interface Firework {
    id: number
    x: number
    y: number
    color: string
    sparks: Spark[]
}

interface FireworkBurstProps {
    count?: number
    colors?: string[]
}

export function FireworkBurst({
    count = 5,
    colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6']
}: FireworkBurstProps) {
    const [fireworks, setFireworks] = useState<Firework[]>([])
    const isInitialized = useRef(false)

    useEffect(() => {
        // Only initialize once to prevent infinite loop
        if (isInitialized.current || typeof window === 'undefined') return
        isInitialized.current = true

        const createFirework = (id: number, delay: number): Firework => {
            const sparkCount = 24 // Number of sparks per firework
            const sparks = Array.from({ length: sparkCount }, (_, i) => ({
                id: i,
                angle: (360 / sparkCount) * i,
                color: colors[Math.floor(Math.random() * colors.length)],
                distance: 100 + Math.random() * 100, // 100-200px radius
            }))

            return {
                id,
                x: Math.random() * window.innerWidth,
                y: Math.random() * (window.innerHeight * 0.6) + window.innerHeight * 0.2, // Middle 60% of screen
                color: colors[Math.floor(Math.random() * colors.length)],
                sparks,
            }
        }

        const newFireworks = Array.from({ length: count }, (_, i) =>
            createFirework(i, i * 0.3)
        )

        setFireworks(newFireworks)
    }, []) // Empty dependency array - only run once

    if (typeof window === 'undefined') return null

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {fireworks.map((firework, fwIndex) => (
                <div key={firework.id} className="absolute" style={{ left: firework.x, top: firework.y }}>
                    {/* Center flash */}
                    <motion.div
                        className="absolute w-4 h-4 rounded-full -translate-x-1/2 -translate-y-1/2"
                        style={{ backgroundColor: firework.color }}
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{
                            scale: [0, 2, 0],
                            opacity: [1, 0.8, 0]
                        }}
                        transition={{
                            duration: 0.8,
                            delay: fwIndex * 0.3,
                            ease: 'easeOut'
                        }}
                    />

                    {/* Sparks */}
                    {firework.sparks.map((spark) => {
                        const radians = (spark.angle * Math.PI) / 180
                        const endX = Math.cos(radians) * spark.distance
                        const endY = Math.sin(radians) * spark.distance

                        return (
                            <motion.div
                                key={spark.id}
                                className="absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2"
                                style={{ backgroundColor: spark.color }}
                                initial={{
                                    x: 0,
                                    y: 0,
                                    scale: 1,
                                    opacity: 1
                                }}
                                animate={{
                                    x: endX,
                                    y: endY,
                                    scale: [1, 1.5, 0],
                                    opacity: [1, 0.8, 0]
                                }}
                                transition={{
                                    duration: 1.2,
                                    delay: fwIndex * 0.3,
                                    ease: [0.25, 0.1, 0.25, 1]
                                }}
                            />
                        )
                    })}
                </div>
            ))}
        </div>
    )
}
