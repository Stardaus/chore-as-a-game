import { cn } from '../../../lib/utils';

const AVATAR_STYLES = [
  'fun-emoji',
  'adventurer',
  'bottts',
  'avataaars',
  'lorelei',
  'notionists',
  'pixel-art',
  'big-smile',
];

const SEEDS = [
  'Buddy',
  'Lucky',
  'Cookie',
  'Daisy',
  'Buster',
  'Princess',
  'Rocky',
  'Shadow',
  'Zoe',
  'Max',
  'Luna',
  'Charlie',
];

interface AvatarSelectorProps {
  selectedUrl?: string;
  onSelect: (url: string) => void;
}

/**
 * Grid of avatar options for parents to choose from.
 *
 * @description
 * Uses DiceBear styles to provide a variety of free, high-quality avatars.
 *
 * @param selectedUrl - The currently selected avatar URL (for highlighting).
 * @param onSelect - Callback when an avatar is clicked.
 */
export function AvatarSelector({ selectedUrl, onSelect }: AvatarSelectorProps) {
  // Generate a set of avatars to choose from
  // For simplicity, we combine styles and seeds
  const options = AVATAR_STYLES.flatMap((style, index) => {
    const seed = SEEDS[index % SEEDS.length];
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
  });

  // Add some extra variety by using more seeds for the first few styles
  const extraOptions = [
    `https://api.dicebear.com/7.x/fun-emoji/svg?seed=Felix`,
    `https://api.dicebear.com/7.x/adventurer/svg?seed=Aria`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=Robo`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=Lily`,
  ];

  const allOptions = [...options, ...extraOptions];

  return (
    <div className="grid grid-cols-4 gap-3 max-h-[400px] overflow-y-auto p-2 hidden-scrollbar">
      {allOptions.map((url) => {
        const isSelected = selectedUrl === url;
        return (
          <button
            key={url}
            onClick={() => onSelect(url)}
            className={cn(
              'aspect-square rounded-2xl border-4 transition-all overflow-hidden bg-slate-50 hover:scale-105 active:scale-95',
              isSelected
                ? 'border-indigo-500 ring-2 ring-indigo-200'
                : 'border-transparent hover:border-slate-200'
            )}
          >
            <img
              src={url}
              alt="Avatar Option"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        );
      })}
    </div>
  );
}
