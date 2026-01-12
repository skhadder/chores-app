export function AlphaPhiLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Alpha symbol */}
      <text x="5" y="70" fontSize="55" fontFamily="serif" fontWeight="bold" fill="currentColor">
        Α
      </text>

      {/* Phi symbol */}
      <text x="38" y="70" fontSize="55" fontFamily="serif" fontWeight="bold" fill="currentColor">
        Φ
      </text>
    </svg>
  )
}
