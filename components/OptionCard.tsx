import React, { useState } from 'react';
import { Choice } from '../src/types';

export interface OptionCardProps {
    choice: Choice;
    index: number;
    onSelect: (optionId: string) => void;
}

/** Rotating clay backgrounds for text-only cards, picked by index % 4. */
const FALLBACK_BG = ['bg-orange-200', 'bg-amber-200', 'bg-yellow-200', 'bg-rose-200'];

const OptionCard: React.FC<OptionCardProps> = ({ choice, index, onSelect }) => {
    const [imgFailed, setImgFailed] = useState(false);
    const showImage = Boolean(choice.imageUrl) && !imgFailed;

    return (
        <button
            type="button"
            onClick={() => onSelect(choice.id)}
            className="clay-press-fx w-full aspect-[4/3] rounded-clay shadow-clay bg-clay-surface overflow-hidden flex flex-col text-left motion-safe:hover:scale-[1.03] motion-safe:active:scale-[0.97] motion-safe:transition-transform"
        >
            {showImage ? (
                <>
                    <img
                        src={choice.imageUrl}
                        alt={choice.text}
                        loading="eager"
                        onError={() => setImgFailed(true)}
                        className="w-full flex-1 min-h-0 object-cover"
                    />
                    <span className="block w-full px-3 py-2 bg-clay-bg text-clay-ink font-heading font-bold text-base md:text-lg text-center leading-tight">
                        {choice.text}
                    </span>
                </>
            ) : (
                <span
                    data-testid="option-text-fallback"
                    className={`flex-1 w-full flex items-center justify-center px-4 text-center font-heading font-bold text-clay-ink text-xl md:text-2xl leading-snug ${FALLBACK_BG[index % FALLBACK_BG.length]}`}
                >
                    {choice.text}
                </span>
            )}
        </button>
    );
};

export default OptionCard;
