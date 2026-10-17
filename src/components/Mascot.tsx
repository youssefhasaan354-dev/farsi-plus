import { motion, useReducedMotion } from 'framer-motion';

export type MascotMood = 'happy' | 'encouraging' | 'thinking' | 'celebrating' | 'sad';

interface MascotProps {
  mood?: MascotMood;
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * Original Persian cat mascot — geometric and stylized.
 * Uses Persian-tile turquoise body with saffron gold accents.
 * Supports prefers-reduced-motion and accessible labels.
 */
export function Mascot({ mood = 'happy', size = 120, className = '', animate = true }: MascotProps) {
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = animate && !shouldReduceMotion;

  const eyeShape = getEyeShape(mood);
  const mouthShape = getMouthShape(mood);
  const blushOpacity = mood === 'happy' || mood === 'celebrating' || mood === 'encouraging' ? 1 : 0;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label={`Mascot - ${mood}`}
      initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : false}
      animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      {/* Tail */}
      <path
        d="M 165 130 Q 185 120 180 100 Q 175 85 165 90"
        fill="#0d7377"
        stroke="#084a4d"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Body — rounded triangular shape */}
      <ellipse cx="100" cy="135" rx="45" ry="38" fill="#0d7377" stroke="#084a4d" strokeWidth="2" />

      {/* Belly — lighter */}
      <ellipse cx="100" cy="140" rx="28" ry="25" fill="#66cccc" opacity="0.3" />

      {/* Head — geometric circle */}
      <circle cx="100" cy="80" r="42" fill="#0d7377" stroke="#084a4d" strokeWidth="2" />

      {/* Ears — triangles */}
      <path d="M 68 55 L 60 30 L 82 50 Z" fill="#0d7377" stroke="#084a4d" strokeWidth="2" strokeLinejoin="round" />
      <path d="M 132 55 L 140 30 L 118 50 Z" fill="#0d7377" stroke="#084a4d" strokeWidth="2" strokeLinejoin="round" />
      {/* Inner ears — saffron */}
      <path d="M 69 50 L 64 36 L 78 48 Z" fill="#f5a623" opacity="0.7" />
      <path d="M 131 50 L 136 36 L 122 48 Z" fill="#f5a623" opacity="0.7" />

      {/* Face mask — lighter Persian-tile pattern */}
      <ellipse cx="100" cy="85" rx="32" ry="25" fill="#66cccc" opacity="0.2" />

      {/* Eyes */}
      {eyeShape}

      {/* Blush */}
      <circle cx="75" cy="90" r="6" fill="#e63946" opacity={blushOpacity * 0.3} />
      <circle cx="125" cy="90" r="6" fill="#e63946" opacity={blushOpacity * 0.3} />

      {/* Nose — small saffron triangle */}
      <path d="M 97 82 L 103 82 L 100 87 Z" fill="#f5a623" />

      {/* Mouth */}
      {mouthShape}

      {/* Whiskers */}
      <line x1="58" y1="88" x2="72" y2="90" stroke="#084a4d" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
      <line x1="58" y1="94" x2="72" y2="93" stroke="#084a4d" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
      <line x1="142" y1="88" x2="128" y2="90" stroke="#084a4d" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
      <line x1="142" y1="94" x2="128" y2="93" stroke="#084a4d" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />

      {/* Decorative collar — saffron band with geometric charm */}
      <rect x="78" y="108" width="44" height="6" rx="3" fill="#f5a623" />
      <circle cx="100" cy="120" r="5" fill="#f5a623" stroke="#d4880e" strokeWidth="1" />

      {/* Mood-specific accessories */}
      {mood === 'celebrating' && (
        <g opacity="0.8">
          <text x="40" y="40" fontSize="14" fill="#f5a623">✦</text>
          <text x="155" y="35" fontSize="12" fill="#22a558">✦</text>
          <text x="170" y="60" fontSize="10" fill="#e63946">✦</text>
          <text x="30" y="70" fontSize="11" fill="#f5a623">✦</text>
        </g>
      )}

      {mood === 'thinking' && (
        <>
          <circle cx="140" cy="40" r="4" fill="#66cccc" opacity="0.5" />
          <circle cx="150" cy="28" r="7" fill="#66cccc" opacity="0.4" />
          <text x="147" y="32" fontSize="10" fill="#084a4d">؟</text>
        </>
      )}
    </motion.svg>
  );
}

function getEyeShape(mood: MascotMood) {
  switch (mood) {
    case 'happy':
      return (
        <g>
          <circle cx="85" cy="78" r="5" fill="#084a4d" />
          <circle cx="115" cy="78" r="5" fill="#084a4d" />
          <circle cx="87" cy="76" r="1.5" fill="#fff" />
          <circle cx="117" cy="76" r="1.5" fill="#fff" />
        </g>
      );
    case 'encouraging':
      return (
        <g>
          <ellipse cx="85" cy="78" rx="4" ry="6" fill="#084a4d" />
          <ellipse cx="115" cy="78" rx="4" ry="6" fill="#084a4d" />
          <circle cx="86" cy="75" r="1.5" fill="#fff" />
          <circle cx="116" cy="75" r="1.5" fill="#fff" />
        </g>
      );
    case 'thinking':
      return (
        <g>
          <ellipse cx="85" cy="78" rx="5" ry="3" fill="#084a4d" />
          <ellipse cx="115" cy="78" rx="5" ry="3" fill="#084a4d" />
          <circle cx="85" cy="75" r="1.5" fill="#fff" />
          <circle cx="115" cy="75" r="1.5" fill="#fff" />
        </g>
      );
    case 'celebrating':
      return (
        <g>
          <path d="M 80 78 Q 85 73 90 78" fill="none" stroke="#084a4d" strokeWidth="3" strokeLinecap="round" />
          <path d="M 110 78 Q 115 73 120 78" fill="none" stroke="#084a4d" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case 'sad':
      return (
        <g>
          <ellipse cx="85" cy="80" rx="4" ry="5" fill="#084a4d" />
          <ellipse cx="115" cy="80" rx="4" ry="5" fill="#084a4d" />
          <line x1="79" y1="70" x2="89" y2="73" stroke="#084a4d" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="121" y1="70" x2="111" y2="73" stroke="#084a4d" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
  }
}

function getMouthShape(mood: MascotMood) {
  switch (mood) {
    case 'happy':
      return <path d="M 93 92 Q 100 97 107 92" fill="none" stroke="#084a4d" strokeWidth="2" strokeLinecap="round" />;
    case 'encouraging':
      return <path d="M 93 92 Q 100 98 107 92" fill="none" stroke="#084a4d" strokeWidth="2.5" strokeLinecap="round" />;
    case 'thinking':
      return <line x1="95" y1="94" x2="105" y2="94" stroke="#084a4d" strokeWidth="2" strokeLinecap="round" />;
    case 'celebrating':
      return <path d="M 90 90 Q 100 102 110 90" fill="#084a4d" stroke="#084a4d" strokeWidth="2" strokeLinejoin="round" />;
    case 'sad':
      return <path d="M 93 96 Q 100 91 107 96" fill="none" stroke="#084a4d" strokeWidth="2" strokeLinecap="round" />;
  }
}

export default Mascot;
