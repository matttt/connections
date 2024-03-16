"use client";
export enum SetType {
    GREEN = 'green',
    PURPLE = 'purple',
    YELLOW = 'yellow',
    BLUE = 'blue'
}
export interface WordSet {
    words: string[];
    solution: string;
    type: SetType;
}
export interface Puzzle {
    id: string;
    sets: WordSet[];
}
