import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

export function FacebookIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.887v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

export function MessengerIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.112.308 2.289.475 3.51.475 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.293 14.394l-3.047-3.253-5.942 3.253 6.538-6.938 3.116 3.253 5.873-3.253-6.538 6.938z" />
    </svg>
  );
}

export function ZaloIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="currentColor"
      {...props}
    >
      <path d="M25 2C12.318 2 2 12.318 2 25c0 3.96 1.023 7.854 2.963 11.29L2.037 46.73a1 1 0 0 0 1.232 1.232l10.44-2.926A22.94 22.94 0 0 0 25 48c12.682 0 23-10.318 23-23S37.682 2 25 2zm-7.189 14h10.02c.65 0 1.169.52 1.169 1.17v.66c0 .43-.234.828-.608 1.043l-7.24 4.127H28.5a.5.5 0 0 1 0 1h-10.7a1.17 1.17 0 0 1-1.17-1.17v-.66c0-.43.234-.828.608-1.043l7.24-4.127H17.81a.5.5 0 0 1 0-1zm-1.561 9.6c.38-1.01 1.23-1.6 2.25-1.6s1.87.59 2.25 1.6L23.5 34h-1.08l-.72-1.96h-3.4L17.58 34h-1.08l2.75-8.4zm10.77-.15c2.29 0 3.98 1.77 3.98 4.07S29.31 33.6 27.02 33.6s-3.98-1.77-3.98-4.07 1.69-4.07 3.98-4.07zm7.23.15V34h-1v-8.4h1zm-17.25 1.3l-1.32 3.6h2.64l-1.32-3.6zm10.02-.37c-1.68 0-2.98 1.24-2.98 3.07s1.3 3.07 2.98 3.07 2.98-1.24 2.98-3.07-1.3-3.07-2.98-3.07z" />
    </svg>
  );
}

export function TiktokIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
    </svg>
  );
}

export function YoutubeIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}
