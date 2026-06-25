export const segmentSentences = (text: string): string[] =>
    text
        .split(/[.!?\n]+/)
        .map(sentence => sentence.trim())
        .filter(Boolean);
