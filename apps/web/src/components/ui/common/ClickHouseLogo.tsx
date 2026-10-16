type ClickHouseLogoProps = {
  className?: string;
};

/**
 * Official ClickHouse logomark, as published in the ClickHouse repository
 * (docs/images/logo.svg). Bars are brand yellow with the red accent square.
 */
export function ClickHouseLogo({ className }: ClickHouseLogoProps) {
  return (
    <svg
      viewBox="0 0 9 8"
      role="img"
      aria-label="ClickHouse"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0,7 h1 v1 h-1 z" fill="red" />
      <path d="M0,0 h1 v7 h-1 z" fill="#fc0" />
      <path d="M2,0 h1 v8 h-1 z" fill="#fc0" />
      <path d="M4,0 h1 v8 h-1 z" fill="#fc0" />
      <path d="M6,0 h1 v8 h-1 z" fill="#fc0" />
      <path d="M8,3.25 h1 v1.5 h-1 z" fill="#fc0" />
    </svg>
  );
}
