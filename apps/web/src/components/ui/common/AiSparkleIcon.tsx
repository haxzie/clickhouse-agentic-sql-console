import { useId } from 'react';

type AiSparkleIconProps = {
  size?: number;
  className?: string;
};

/** Octicon sparkle, filled with the assistant gradient. */
export function AiSparkleIcon({ size = 13, className }: AiSparkleIconProps) {
  // Colons from useId are not valid in an SVG id reference.
  const gradientId = `ai-sparkle-${useId().replaceAll(':', '')}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="2"
          y1="22"
          x2="22"
          y2="2"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#ea580c" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradientId})`}
        d="M11.296 1.924c.24-.656 1.168-.656 1.408 0l.717 1.958a11.25 11.25 0 0 0 6.697 6.697l1.958.717c.657.24.657 1.168 0 1.408l-1.958.717a11.25 11.25 0 0 0-6.697 6.697l-.717 1.958c-.24.657-1.168.657-1.408 0l-.717-1.958a11.25 11.25 0 0 0-6.697-6.697l-1.958-.717c-.656-.24-.656-1.168 0-1.408l1.958-.717a11.25 11.25 0 0 0 6.697-6.697z"
      />
    </svg>
  );
}
