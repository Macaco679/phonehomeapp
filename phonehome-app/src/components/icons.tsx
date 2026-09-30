import * as React from "react";

const PATHS: Record<string, React.ReactNode> = {
  home: (
    <>
      <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1v-8.5z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M8 3v4M16 3v4M3.5 10h17M12 13.5v4M10 15.5h4" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4.5" width="14" height="16" rx="3" />
      <path d="M9 4.5h6v2.5H9zM8.5 11.5h7M8.5 15h4.5" />
    </>
  ),
  bag: (
    <>
      <path d="M5 8h14l-1 11.2a1 1 0 0 1-1 .8H7a1 1 0 0 1-1-.8L5 8z" />
      <path d="M9 10V7a3 3 0 0 1 6 0v3" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20c.6-3.6 3.7-5.5 7.5-5.5s6.9 1.9 7.5 5.5" />
    </>
  ),
  inbox: (
    <>
      <path d="M4 13.5 6.5 6a1.5 1.5 0 0 1 1.4-1h8.2a1.5 1.5 0 0 1 1.4 1l2.5 7.5" />
      <path d="M4 13.5V18a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 18v-4.5h-5a3 3 0 0 1-6 0H4z" />
    </>
  ),
  box: (
    <>
      <path d="M12 3.5 19.5 8v8L12 20.5 4.5 16V8L12 3.5z" />
      <path d="M4.8 8.2 12 12.5l7.2-4.3M12 12.5v8" />
    </>
  ),
  cash: (
    <>
      <rect x="3" y="6.5" width="18" height="11" rx="3" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M6.5 12h.01M17.5 12h.01" />
    </>
  ),
  more: (
    <>
      <circle cx="5.5" cy="12" r="1.2" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="18.5" cy="12" r="1.2" />
    </>
  ),
  chart: (
    <>
      <path d="M4.5 19.5h15" />
      <path d="M7.5 16v-4.5M12 16V7.5M16.5 16v-7" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.3" />
      <path d="M3 19.5c.5-3.2 3-4.8 6-4.8s5.5 1.6 6 4.8" />
      <path d="M15.5 5.6a3.3 3.3 0 0 1 0 5.8M18 14.9c1.5.6 2.7 2 3 4.6" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h0a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v0a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
    </>
  ),
  logout: (
    <>
      <path d="M9.5 20H6a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 6 4h3.5" />
      <path d="M15 8l4 4-4 4M19 12H9.5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 19 6v5.5c0 4.2-2.9 7.3-7 9-4.1-1.7-7-4.8-7-9V6l7-2.5z" />
      <path d="m9 12 2.2 2.2L15.2 10" />
    </>
  ),
  phone: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.8" />
      <path d="M10.5 5.5h3M11 18.5h2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0c0 5.4 6.5 11 6.5 11z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  chevron: <path d="m9 5.5 6.5 6.5L9 18.5" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  wrench: (
    <>
      <path d="M14.5 6.5a4 4 0 0 0-5.2 5.1L4 17l3 3 5.4-5.3a4 4 0 0 0 5.1-5.2l-2.6 2.6-2.4-.5-.5-2.4 2.6-2.7z" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6.5h11v9H3zM14 10h4l3 3v2.5h-7" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </>
  ),
  store: (
    <>
      <path d="M4 9.5 5.5 4h13L20 9.5" />
      <path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M5.5 12.5V20h13v-7.5" />
    </>
  ),
  bolt: <path d="M13 3 5.5 13.5H11L10 21l7.5-10.5H12L13 3z" />,
  star: <path d="m12 4 2.4 5 5.5.7-4 3.9 1 5.4L12 16.3 7.1 19l1-5.4-4-3.9 5.5-.7L12 4z" />,
  help: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1.1.9-1.1 1.6M12 16.5v.01" />
    </>
  ),
  doc: (
    <>
      <path d="M7 3.5h7l4 4v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z" />
      <path d="M14 3.5v4h4M9 12h6M9 15.5h6" />
    </>
  ),
};

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  className = "h-5 w-5",
  strokeWidth = 1.8,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
