/* Lightweight inline icon set — 1.6px rounded strokes, Apple-clean. */
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const Arrow = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><path d="M5 12h14M13 6l6 6-6 6" /></g></svg>)
export const ArrowUpRight = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><path d="M7 17 17 7M8 7h9v9" /></g></svg>)
export const Check = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><path d="M20 6 9 17l-5-5" /></g></svg>)
export const Plus = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><path d="M12 5v14M5 12h14" /></g></svg>)
export const Phone = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L7.8 9.8a16 16 0 0 0 6 6l1.4-1.3a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z" /></g></svg>)
export const Mail = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></g></svg>)
export const Pin = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></g></svg>)
export const Cube = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><path d="M21 7.5 12 2 3 7.5v9L12 22l9-5.5v-9Z" /><path d="M3 7.5 12 13l9-5.5M12 13v9" /></g></svg>)
export const Layers = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 17l9 5 9-5" /></g></svg>)
export const Clock = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></g></svg>)
export const Truck = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><path d="M1 4h13v12H1zM14 8h4l3 3v5h-7" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></g></svg>)
export const Bolt = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></g></svg>)
export const Leaf = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><path d="M11 20A7 7 0 0 1 4 13c0-6 7-11 16-11 0 9-5 16-9 18Z" /><path d="M4 21c2-5 6-8 11-9" /></g></svg>)
export const Ruler = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><rect x="2" y="7" width="20" height="10" rx="2" /><path d="M6 7v3M10 7v4M14 7v3M18 7v4" /></g></svg>)

/* strength / feature icons keyed by name */
const ICONS = {
  frame: (<g {...S}><rect x="3" y="3" width="18" height="18" rx="1.5" /><path d="M3 8h18M8 3v18" /></g>),
  chat: (<g {...S}><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 20l1.1-4.1A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z" /></g>),
  factory: (<g {...S}><path d="M3 21V9l6 4V9l6 4V3h3v18Z" /><path d="M7 21v-4M12 21v-4M17 21v-4" /></g>),
  team: (<g {...S}><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 6a3 3 0 0 1 0 6M22 20a6 6 0 0 0-4-5.6" /></g>),
  shield: (<g {...S}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></g>),
  smart: (<g {...S}><rect x="4" y="4" width="16" height="16" rx="3" /><rect x="9" y="9" width="6" height="6" rx="1" /><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" /></g>),
}
export const FeatureIcon = ({ name, ...p }) => (<svg viewBox="0 0 24 24" {...p}>{ICONS[name] || ICONS.frame}</svg>)

/* socials */
export const IgIcon = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" /></g></svg>)
export const InIcon = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M7 10v7M7 7v0M11 17v-4a2 2 0 0 1 4 0v4M11 17v-7" /></g></svg>)
export const YtIcon = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 5 3-5 3V9Z" fill="currentColor" /></g></svg>)
export const Play = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><circle cx="12" cy="12" r="10" /><path d="m10 8 6 4-6 4V8Z" fill="currentColor" /></g></svg>)
export const Download = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" /></g></svg>)
export const Trash = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" /></g></svg>)
export const Reset = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></g></svg>)
export const Close = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><path d="M6 6l12 12M18 6 6 18" /></g></svg>)

/* configurator / builder icons */
export const Rotate = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 3v5h-5" /></g></svg>)
export const Undo = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-4" /></g></svg>)
export const Redo = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><path d="m15 14 5-5-5-5" /><path d="M20 9H9a5 5 0 0 0 0 10h4" /></g></svg>)
export const Cursor = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><path d="m4 3 7 17 2.5-6.5L20 11 4 3Z" /></g></svg>)
export const Eraser = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><path d="M5 14 11 8l5 5-6 6H7l-4-4 2-1Z" /><path d="m11 8 4-4 5 5-4 4M10 19h10" /></g></svg>)
export const Fit = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4" /></g></svg>)
export const TopDown = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 3v18" /></g></svg>)
export const Wand = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><path d="m5 19 9-9M14 7l3 3" /><path d="M16 3v3M21 8h-3M18 13v2M21 14h-2M7 4v2M9 5H7" /></g></svg>)
export const ChevronUp = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><path d="m6 15 6-6 6 6" /></g></svg>)
export const ChevronDown = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><path d="m6 9 6 6 6-6" /></g></svg>)
export const DoorIcon = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M4 21h16M14 12.5v1" /></g></svg>)
export const WindowIcon = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><rect x="4" y="4" width="16" height="16" rx="1" /><path d="M12 4v16M4 12h16" /></g></svg>)
export const SolarIcon = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><rect x="3" y="5" width="18" height="10.5" rx="1" /><path d="M3 8.7h18M3 12.2h18M9 5v10.5M15 5v10.5M12 15.5V21M8 21h8" /></g></svg>)
export const DeckIcon = (p) => (<svg viewBox="0 0 24 24" {...p}><g {...S}><rect x="3" y="7" width="18" height="10" rx="1" /><path d="M7 7v10M11 7v10M15 7v10" /></g></svg>)
