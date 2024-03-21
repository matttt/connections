"use client"

import { set } from 'lodash';
import shuffle from 'lodash/shuffle'
import { useState, useEffect, CSSProperties } from 'react'
import { Puzzle, WordSet, SetType } from './types';
import { useSprings, animated, a, easings, useSpring } from '@react-spring/web'
import { isMobile } from 'react-device-detect';

interface PillButtonProps {
    onClick: () => void
    content?: any
    disabled?: boolean
    style?: CSSProperties
}

function PillButton({ onClick, content = '', style = {}, disabled = false }: PillButtonProps) {
    const disabledStyle = disabled ? { color: '#AAAAAA', borderColor: '#AAAAAA', backgroundColor: 'unset', cursor: 'default' } : {}
    const classes = "text-s rounded-full border py-2 px-3 font-medium text-[#363636] border-[#363636] pillButton"
    return <button onClick={onClick} style={{ ...style, ...disabledStyle }} className={classes}>{content}</button>
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
    const startingSelection = ['OLYMPUS', 'POLAROID', 'HASSELBLAD', 'FUJIFILM']
    const [selected, setSelected] = useState<string[]>(startingSelection)
    const [wordList, setWordList] = useState<string[]>(shuffle(getWordList(puzzle)))
    const [isClient, setIsClient] = useState<boolean>(false)
    const [lockIns, setLockIns] = useState<WordSet[]>([])
    const [mistakeCount, setMistakeCount] = useState<number>(4)
    const [attempts, setAttempts] = useState<string[][]>([])

    const lockedInWords = lockIns.flatMap((set) => set.words)
    const margin = sideLength / 200;

    const gridWidth = sideLength / 4
    const gridHeight = sideLength / (isMobile ? 4 : 8)

    const idxToXY = (idx: number) => {
        const row = Math.floor(idx / 4)
        const col = idx % 4
        const x = col * gridWidth + margin
        const y = row * gridHeight + margin
        return { x, y }
    }

    const colRowToIdx = (col: number, row: number) => {
        return row * 4 + col
    }

    const [wordSprings, wordsApi] = useSprings(
        16,
        (idx) => {
            const { x, y } = idxToXY(idx)
            // console.log(x,y)
            return {
                from: { x, y },
                to: { x, y, immediate: true } // for rerender
            }
        },
        [sideLength]
    )

    const [wordTextSprings, wordTextsApi] = useSprings(
        16,
        (idx) => {
            return {
                from: { opacity: 1 },
            }
        },
        [sideLength]
    )

    const [lockinSprings, lockinApi] = useSprings(
        4,
        (idx) => {
            return {
                from: { scale: 1 }
            }
        },
        [sideLength]
    )

    const [lockinTextSprings, lockinTextApi] = useSprings(
        4,
        (idx) => {
            return {
                from: { opacity: 0 }
            }
        },
        [sideLength]
    )

    const [oneAwaySprings, oneAwayApi] = useSpring(() => ({
        from: { y: 0, opacity: 0 },
    }))

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

        const wordStyle = { width: gridWidth - margin * 2, height: gridHeight - margin * 2, }

        let classes = "absolute text-center rounded-md flex flex-col h-full w-full transition transform"
        if (lockedInWords.includes(word)) { classes += " hidden" }

        if (selected.length < 4) {
            // classes += " cursor-pointer" + (isMobile ? "" : " active:scale-90 active:bg-[#5a594e] active:text-pink-50")
            classes += " cursor-pointer" + (isMobile ? "" : " active:scale-90 active:bg-[#5a594e] active:text-pink-50")
        } else if (selected.length === 4 && selected.includes(word)) {
            classes += " cursor-pointer"
        }

        if (selected.includes(word)) {
            classes += " scale-90 bg-[#5a594e] text-pink-50"
        } else {
            classes += " bg-[#EFEFE7]"
        }

        const fontSizeMap = {
            6: 'text-[16px] md:text-[20px]',
            7: 'text-[14px] md:text-[19px]',
            8: 'text-[12px] md:text-[18px]',
            9: 'text-[11px] md:text-[17px]',
            10: 'text-[10px] md:text-[16px]',
            11: 'text-[9px] md:text-[15px]',
            12: 'text-[8px] md:text-[14px]',
            13: 'text-[7px] md:text-[13px]',
            14: 'text-[6px] md:text-[12px]',
        }

        // @ts-ignore
        const fontSize = fontSizeMap[Math.max(Math.min(14, word.length), 6)]

        const component = <animated.div style={{ ...wordStyle, ...wordSprings[i] }} key={i} className='absolute' >
            <div className={classes} onClick={() => handleSelect(word)}>
                <div className='grow'></div>
                <animated.div className={'select-none font-bold ' + fontSize} style={wordTextSprings[i]}>{word}</animated.div>
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
        const y = i * gridHeight + margin

        const colors = {
            [SetType.GREEN]: "#A7C268",
            [SetType.PURPLE]: "#B283C1",
            [SetType.YELLOW]: "#F5E07E",
            [SetType.BLUE]: "#B4C3EB"
        }

        const color = colors[set.type]
        const wordStyle = { width: sideLength - margin * 2, height: gridHeight - margin * 2, top: y, left: x, backgroundColor: color }

        const component = <animated.div style={{ ...wordStyle, ...lockinSprings[i] }} key={i} className="absolute text-center rounded-md">
            <div className='flex flex-col h-full'>
                <div className='grow'></div>
                <animated.div className='select-none font-bold text-sm md:text-md' style={lockinTextSprings[i]}>{set.solution}</animated.div>
                <animated.div className='text-sm md:text-md' style={lockinTextSprings[i]}>{set.words.join(', ')}</animated.div>
                <div className='grow'></div>
            </div>
        </animated.div>

        lockInComponents.push(component)
    }

    const shuffleButtons = () => {
        const lockInWords = wordList.slice(0, lockIns.length * 4)
        const remainingWords = wordList.slice(lockIns.length * 4, 16)

        const shuffledRemainingWords = shuffle(remainingWords)

        wordTextsApi.start({
            // from: { opacity: 1 },
            to: { opacity: 0 },
            config: {
                duration: 300,
                easing: easings.easeOutCirc
            },
            onRest: () => {
                setWordList([...lockInWords, ...shuffledRemainingWords])
                wordTextsApi.start({
                    to: { opacity: 1 },
                    config: {
                        duration: 300,
                        easing: easings.easeInCubic
                    },
                })
            }
        })

    }

    const deselectAll = () => {
        setSelected([])
    }

    const submit = () => {

        if (selected.length !== 4) {
            return
        }

        const matchingSet = puzzle.sets.find((set) => {
            const selectedWords = set.words.filter((word) => selected.includes(word));
            return selectedWords.length === 4;
        });

        const correctAnimationSet = () => {
            if (!matchingSet) return;

            const animations = getAnimationsGivenNewAnswer(matchingSet)
            let completeCount = 0

            const onComplete = () => {
                completeCount++

                if (completeCount === animations.length * 2) {
                    onAllComplete()
                }
            }

            const onAllComplete = () => {
                wordsApi.start((idx) => {
                    const { x, y } = idxToXY(idx);
                    return { x, y, immediate: true }
                })

                setWordList(applyAnimationsToWordList(animations))

                // reset word box positions to their original spots instantly after animation

                setTimeout(() => {
                    setSelected([])
                    setLockIns([...lockIns, matchingSet])

                    lockinApi.start((idx) => {
                        if (lockIns.length === idx) {
                            return { to: [{ scale: 1.1 }, { scale: 1 }] }
                        }
                    })

                    lockinTextApi.start((idx) => {
                        if (lockIns.length === idx) {
                            return { to: [{ opacity: 1 }] }
                        }
                    })
                }, 100)
            }



            const swapAnim = () => {
                wordsApi.start((idx) => {
                    const toAnimation = animations.find(a => a.to === idx)
                    const fromAnimation = animations.find(a => a.from === idx)

                    if (fromAnimation) {
                        const { x, y } = idxToXY(fromAnimation.to)

                        return { to: { x: x + 0.00001, y: y + 0.00001 }, config: { duration: undefined }, onRest: onComplete }
                    } else if (toAnimation) {
                        const { x, y } = idxToXY(toAnimation.from)

                        return { to: { x: x + 0.00001, y: y + 0.00001 }, config: { duration: undefined }, onRest: onComplete }
                    } else {
                        return { onRest: onComplete, config: { duration: undefined }, }
                    }
                })
            }

            if (animations.length > 0) {

                swapAnim()
            } else {
                onAllComplete()
            }

        }

        const incorrectAnimationSet = () => {

            let incorrectAnimCompleteCount = 0;
            const onIncorrectAnimComplete = () => {
                incorrectAnimCompleteCount++
                if (incorrectAnimCompleteCount === selected.length) {
                    onAllIncorrectAnimComplete()
                }
            }

            // if the selected words match 3 of four words in a set, flash "one away" snackbar
            const isOneAway = puzzle.sets.find((set) => {
                const selectedWords = set.words.filter((word) => selected.includes(word));
                return selectedWords.length === 3;
            });

            if (isOneAway) {
                // flash "one away" snackbar
                oneAwayApi.start({
                    to: [{ opacity: 1, y: -10 }, { opacity: 0, delay: 500 }],
                    from: { y: 0, opacity: 0 },
        
                })
            }

            const onAllIncorrectAnimComplete = () => {
                setTimeout(() => {
                    setMistakeCount(mistakeCount - 1)
                    setAttempts([...attempts, selected])
                    setSelected([])
                }, 500)
            }

            wordsApi.start((idx) => {
                const isOfSelection = selected.includes(wordList[idx])

                if (isOfSelection) {
                    const { x, y } = idxToXY(idx)

                    const offset = sideLength / 60

                    return {
                        to: [
                            {
                                x: x - offset,

                            }, {
                                x: x + offset,

                            }, {
                                x: x - offset,

                            }, {
                                x: x + offset,

                            }, {
                                x: x,
                            }], config: {
                                duration: 75
                            }, onRest: onIncorrectAnimComplete
                    }
                } else {
                    return {}
                }
            })

        }

        let bounceCompleteCount = 0
        const onBounceComplete = () => {
            bounceCompleteCount++
            if (bounceCompleteCount === selected.length) {
                onAllBounceComplete()
            }
        }
        const onAllBounceComplete = () => {
            setTimeout(() => {
                if (matchingSet) {
                    correctAnimationSet()
                } else {
                    incorrectAnimationSet()
                }
            }, 250)
        }

        wordsApi.start((idx) => {
            const isOfSelection = selected.includes(wordList[idx])
            const curPos = idxToXY(idx)

            const sortedSelections = [...selected].sort((a, b) => wordList.indexOf(a) - wordList.indexOf(b))

            if (isOfSelection) {
                return {
                    to: [
                        {
                            y: curPos.y - sideLength / 40,
                            delay: sortedSelections.indexOf(wordList[idx]) * 100,
                            config: {
                                duration: 200
                            }
                        }, {
                            y: curPos.y,
                            config: {
                                duration: 200
                            }
                        }], onRest: onBounceComplete
                }
            } else {
                return {}
            }
        })


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

    interface MistakeCounterProps {
        mistakes: number
    }
    const MistakeCounter = ({ mistakes }: MistakeCounterProps) => {
        return <div className="flex align-center justify-center">
            <span className='text-lg md:text-md mt-5'>Mistakes remaining:</span>
            <div className='ml-3 mt-[1.6rem] flex gap-2.5 min-w-24'>
                {Array.from({ length: mistakes }).map((_, i) => <span key={i} className="w-4 h-4 bg-[#5a594e] rounded-full align-baseline" />)}
            </div>
        </div>
    }

    const hasBeenSubmitted = attempts.some((a) => a.join('') === selected.join(''))

    const submitButtonDisabled = selected.length !== 4 || hasBeenSubmitted

    const outerStyle = { width: sideLength, height: sideLength / (isMobile ? 1 : 2) }
    return isClient && <div>
        <div className="flex justify-center mb-5">
            <animated.div className={`px-3 py-2 border border-gray-300 rounded`} style={oneAwaySprings}>One away...</animated.div>
        </div>
        <div className="flex justify-center mb-5">

            <span className="text-md">Create four groups of four!</span>
        </div>
        <div style={outerStyle} className="relative">
            {wordComponents}
            {lockInComponents}
        </div>
        <MistakeCounter mistakes={mistakeCount} />
        <div className="flex mt-10">
            <div className="grow"></div>
            <PillButton content="Shuffle" onClick={shuffleButtons} />
            <div className="w-2"></div>
            <PillButton content="Deselect all" onClick={deselectAll} />
            <div className="w-2"></div>
            <PillButton content="Submit" disabled={submitButtonDisabled} onClick={submitButtonDisabled ? () => { } : submit} style={{ backgroundColor: '#5a594e', color: 'white' }} />
            <div className="grow"></div>
        </div>

        <div className="h-20"></div>
    </div>
}