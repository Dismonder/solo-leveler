import React from 'react';

export function PixelFrame({ children, title, onBack }: { children: React.ReactNode, title: string, onBack?: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col font-mono overflow-hidden bg-black sl-grid-bg">
      <div className="shrink-0 p-3 border-b border-blue-500/35 bg-black/75 flex justify-between items-center text-xs uppercase tracking-[0.22em] text-cyan-300 relative z-20 shadow-[0_0_24px_rgba(37,99,235,0.22)]">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_14px_rgba(34,211,238,0.7)]" />
        <div>{title}</div>
        {onBack && (
          <button onClick={onBack} className="text-red-300 hover:text-white font-bold px-3 py-1 bg-red-950/40 border border-red-500/50 transition-colors">
            [Zakończ]
          </button>
        )}
      </div>
      <div className="flex-1 relative bg-black/65 m-3 sl-frame overflow-hidden" style={{ imageRendering: 'pixelated' }}>
         {/* CRT scanlines */}
         <div className="absolute inset-0 pointer-events-none sl-scanlines mix-blend-overlay z-40"></div>
         <div className="absolute inset-0 pointer-events-none sl-noise opacity-25 z-40"></div>
         {children}
      </div>
    </div>
  );
}
