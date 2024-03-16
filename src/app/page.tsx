"use client";
import { useEffect, useState } from "react";
import { useMeasure } from "@uidotdev/usehooks";
import { Game } from './game'
import { SetType } from './types'

export default function Home() {
  const [ref, { width, height }] = useMeasure();
  const [sideLength, setSideLength] = useState(0)

  useEffect(() => {
    const min = Math.min(width || 0, height || 0);
    setSideLength(min * 0.6)
  }, [width, height])

  const puzzo = {
    id: 'abc123',
    sets: [
      {
        words: ['DRAGON', 'HORSE', 'RABBIT', 'TIGER'],
        solution: 'CHINESE ZODIAC ANIMALS',
        type: SetType.PURPLE
      },
      {
        words: ['BUD', 'LEAF', 'PETAL', 'STALK'],
        solution: 'FLOWER PARTS',
        type: SetType.GREEN
      },
      {
        words: ['GNOME', 'GOBLIN', 'OGRE', 'TROLL'],
        solution: 'CREATURES IN FOLKLORE',
        type: SetType.YELLOW
      },
      {
        words: ['AGENT', 'MOLE', 'PLANT', 'SPY'],
        solution: 'ONE INVOLVED IN ESPIONAGE',
        type: SetType.BLUE
      }
    ]
  }

  return (
    <main ref={ref} className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="grow"></div>
      <Game sideLength={sideLength} puzzle={puzzo} />
      <div className="grow"></div>
    </main>
  );
}
