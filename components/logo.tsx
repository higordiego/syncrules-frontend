export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Círculo externo representando sincronização */}
      <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.3" />

      {/* Setas circulares de sincronização */}
      <path d="M 50 10 A 40 40 0 1 1 49.9 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M 50 10 L 45 18 L 55 18 Z" fill="currentColor" />

      {/* Grid central representando regras/estrutura */}
      <g opacity="0.9">
        <line x1="35" y1="35" x2="65" y2="35" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <line x1="35" y1="50" x2="65" y2="50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <line x1="35" y1="65" x2="65" y2="65" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />

        <circle cx="42" cy="35" r="2.5" fill="currentColor" />
        <circle cx="42" cy="50" r="2.5" fill="currentColor" />
        <circle cx="42" cy="65" r="2.5" fill="currentColor" />
      </g>
    </svg>
  )
}
