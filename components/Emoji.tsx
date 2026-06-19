function toEmojiUrl(emoji: string): string {
    const codepoints = [...emoji]
        .map(c => c.codePointAt(0)!.toString(16).toUpperCase())
        .join('-');
    return `https://cdn.jsdelivr.net/npm/openmoji@14.0.0/black/svg/${codepoints}.svg`;
}

interface EmojiProps {
    char: string;
    size?: number;
    className?: string;
    style?: React.CSSProperties;
}

export function Emoji({ char, size = 20, className, style }: EmojiProps) {
    return (
        <img
            src={toEmojiUrl(char)}
            alt={char}
            width={size}
            height={size}
            className={className}
            style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
            draggable={false}
        />
    );
}
