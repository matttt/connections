"use client"

import { set } from 'lodash';
import shuffle from 'lodash/shuffle'
import { useState, useEffect, CSSProperties } from 'react'
import { Puzzle, WordSet, SetType } from './types';
import { useSprings, animated } from '@react-spring/web'


interface PillButtonProps {
    onClick: () => void
    content?: any
    style?: CSSProperties
}

function PillButton({ onClick, content = '', style = {} }: PillButtonProps) {
    return <button onClick={onClick} style={style} className="text-s rounded-full border py-4 px-6 text-[#363636] border-[#363636] pillButton">{content}</button>
}

function getWordList(puzzle: Puzzle): string[] {
    // return a list of all words in the puzzle
    return puzzle.sets.flatMap((set) => set.words)
}

interface GameProps {
    sideLength: number;
    puzzle: Puzzle;
}

export function Game({ sideLength, puzzle }: GameProps) {
    // const startingSelection: string[] = []
    const startingSelection = ['DRAGON', 'HORSE', 'RABBIT', 'TIGER']
    const [selected, setSelected] = useState<string[]>(startingSelection)
    const [wordList, setWordList] = useState<string[]>(shuffle(getWordList(puzzle)))
    const [isClient, setIsClient] = useState<boolean>(false)
    const [lockIns, setLockIns] = useState<WordSet[]>([])

    const lockedInWords = lockIns.flatMap((set) => set.words)
    const margin = 10;

    const idxToXY = (idx: number) => {
        const row = Math.floor(idx / 4)
        const col = idx % 4
        const x = col * sideLength / 4 + margin
        const y = row * sideLength / 4 + margin
        return { x, y }
    }

    const colRowToIdx = (col: number, row: number) => {
        return row * 4 + col
    }

    const [springs, api] = useSprings(
        16,
        (idx) => {
            const { x, y } = idxToXY(idx)
            console.log(x,y)
            return {
                from: { x, y },
                to: { x, y, immediate: true } // for rerender
            }
        },
        [sideLength]
    )

    useEffect(() => {
        setIsClient(true)
    }, [])

    const handleSelect = (word: string) => {
        if (!selected.includes(word) && selected.length < 4) {
            setSelected([...selected, word])
        } else {
            setSelected(selected.filter((w) => w !== word))
        }
    }

    const wordComponents = []
    for (let i = 0; i < wordList.length; i++) {
        const word = wordList[i]

        const wordStyle = { width: sideLength / 4 - margin * 2, height: sideLength / 4 - margin * 2, }

        let classes = "bg-[#EFEFE7] absolute text-center rounded-xl shadow-lg flex flex-col h-full w-full"
        if (lockedInWords.includes(word)) { classes += " hidden" }

        if (selected.length < 4) {
            classes += " transform active:scale-90 active:brightness-90 transition cursor-pointer"
        } else if (selected.length === 4 && selected.includes(word)) {
            classes += " cursor-pointer"
        }

        if (selected.includes(word)) {
            classes += " scale-90 brightness-90"
        }

        const component = <animated.div style={{ ...wordStyle, ...springs[i] }} key={i} className='absolute' >
            <div className={classes} onClick={() => handleSelect(word)}>
                <div className='grow'></div>
                <div className='select-none font-bold'>{word}</div>
                <div className='grow'></div>
            </div>
        </animated.div>

        wordComponents.push(component)
    }

    const lockInComponents = []
    for (let i = 0; i < lockIns.length; i++) {
        const set = lockIns[i]
        const row = Math.floor(i / 4)
        const col = i % 4
        const x = margin;
        const y = i * sideLength / 4 + margin

        const colors = {
            [SetType.GREEN]: "#A7C268",
            [SetType.PURPLE]: "#B283C1",
            [SetType.YELLOW]: "#F5E07E",
            [SetType.BLUE]: "#B4C3EB"
        }

        const color = colors[set.type]
        const wordStyle = { width: sideLength - margin * 2, height: sideLength / 4 - margin * 2, top: y, left: x, backgroundColor: color }

        const component = <div style={wordStyle} key={i} className="absolute text-center rounded-xl shadow-lg">
            <div className='flex flex-col h-full'>
                <div className='grow'></div>
                <div className='select-none font-bold'>{set.solution}</div>
                <div>{set.words.join(', ')}</div>
                <div className='grow'></div>
            </div>
        </div>

        lockInComponents.push(component)
    }

    const shuffleButtons = () => {
        setWordList(shuffle(wordList))
    }

    const deselectAll = () => {
        setSelected([])
    }

    const submit = () => {
        if (selected.length === 4) {
            const matchingSet = puzzle.sets.find((set) => {
                const selectedWords = set.words.filter((word) => selected.includes(word));
                return selectedWords.length === 4;
            });
            if (matchingSet) {
                const animations = getAnimationsGivenNewAnswer(matchingSet)
                console.log(animations);
                let completeCount = 0

                const onComplete = () => {
                    completeCount++

                    if (completeCount === animations.length * 2) {
                        console.log(wordList)
                        const newWordList = applyAnimationsToWordList(animations)
                        setWordList(applyAnimationsToWordList(animations))
                        // reset word box positions to their original spots instantly after animation
                        api.start((idx) => {
                            const { x, y } = idxToXY(idx);
                            return { to: { x, y }, immediate:true}
                        })
                    }
                }

                api.start((idx) => {
                    const toAnimation = animations.find(a => a.to === idx)
                    const fromAnimation = animations.find(a => a.from === idx)

                    if (fromAnimation) {
                        const { x, y } = idxToXY(fromAnimation.to)

                        return { to: { x: x + 0.00001, y: y + 0.00001 }, onRest: onComplete  }
                    } else if (toAnimation) {
                        const { x, y } = idxToXY(toAnimation.from)

                        return { to: { x: x + 0.00001, y: y + 0.00001 }, onRest: onComplete }
                    } else {
                        return { onRest: onComplete }
                    }
                })

                setTimeout(() => {
                    setLockIns([...lockIns, matchingSet])
                    setSelected([])
                }, 1000)
            } else {
                alert('Incorrect!');
            }
        }
    }

    interface Animation {
        from: number;
        to: number;
    }
    // take word list and new answer set and return new word list
    const getAnimationsGivenNewAnswer = (answerSet: WordSet) => {
        const targetRow = lockIns.length;

        const animations: Animation[] = []
        for (let i = 0; i < wordList.length; i++) {
            const word = wordList[i]

            if (!answerSet.words.includes(word)) {
                continue;
            }
            const row = Math.floor(i / 4)
            const col = i % 4

            if (row === targetRow) {
                continue
            } else {
                // find target spot in target row. 

                // make sure each index along x is neither occupied by a word already in the correct place or is already the destination of an animation
                for (let x = 0; x < 4; x++) {
                    const idxToCheck = colRowToIdx(x, targetRow)

                    const alreadyHasAnAnswerWord = answerSet.words.includes(wordList[idxToCheck]) // this destination already has an answer word
                    const alreadyHasAnimation = animations.find((animation) => animation.to === idxToCheck) // this destination already has an animation

                    if (!alreadyHasAnAnswerWord && !alreadyHasAnimation) {
                        animations.push({ from: i, to: idxToCheck })
                        // animations.push({ from: idxToCheck, to: i })
                        break
                    }
                }
            }
        }

        return animations

    }

    const applyAnimationsToWordList = (animations: Animation[]) => {
        const newWordList = [...wordList]
        for (let i = 0; i < animations.length; i++) {
            const animation = animations[i]
            const temp = newWordList[animation.to]
            newWordList[animation.to] = wordList[animation.from]
            newWordList[animation.from] = temp
        }
        return newWordList
    }

    const outerStyle = { width: sideLength, height: sideLength }
    return isClient && <div>
        <div style={outerStyle} className="relative">
            {wordComponents}
            {lockInComponents}
        </div>
        <div className="flex mt-10">
            <div className="grow"></div>
            <PillButton content="Shuffle" onClick={shuffleButtons} />
            <div className="w-2"></div>
            <PillButton content="Deselect all" onClick={deselectAll} />
            <div className="w-2"></div>
            <PillButton content="Submit" onClick={submit} />
            <div className="grow"></div>
        </div>
    </div>
}