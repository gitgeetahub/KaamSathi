export default function WorkerBackdrop() {
  return (
    <div className="worker-scene-backdrop" aria-hidden="true">
      {/* LEFT: Tower Crane */}
      <svg
        className="backdrop-crane"
        viewBox="0 0 320 540"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Foundation & Tracks */}
        <rect x="25" y="500" width="110" height="24" rx="4" fill="#334155" />
        <rect x="15" y="524" width="130" height="8" rx="2" fill="#1e293b" />
        <circle cx="45" cy="512" r="6" fill="#64748b" />
        <circle cx="75" cy="512" r="6" fill="#64748b" />
        <circle cx="105" cy="512" r="6" fill="#64748b" />

        {/* Counterweight Block on base */}
        <rect x="35" y="475" width="45" height="25" fill="#e28743" />
        <rect x="40" y="455" width="35" height="20" fill="#c97132" />

        {/* Main Lattice Mast */}
        <rect x="68" y="110" width="24" height="390" fill="#f59e0b" />
        <path
          d="M68 110 L92 150 M92 110 L68 150
             M68 150 L92 190 M92 150 L68 190
             M68 190 L92 230 M92 190 L68 230
             M68 230 L92 270 M92 230 L68 270
             M68 270 L92 310 M92 270 L68 310
             M68 310 L92 350 M92 310 L68 350
             M68 350 L92 390 M92 350 L68 390
             M68 390 L92 430 M92 390 L68 430
             M68 430 L92 470 M92 430 L68 470
             M68 470 L92 500 M92 470 L68 500"
          stroke="#d97706"
          strokeWidth="3"
        />

        {/* Operator Cabin */}
        <rect x="74" y="125" width="32" height="34" rx="4" fill="#1e293b" />
        <polygon points="76,130 98,130 92,150 76,150" fill="#67e8f9" opacity="0.8" />

        {/* Horizontal Jib & Lattice Truss */}
        <rect x="10" y="95" width="305" height="15" fill="#f59e0b" />
        <path
          d="M10 95 L315 95 M10 110 L315 110
             M10 95 L30 110 M30 95 L50 110 M50 95 L70 110
             M100 95 L120 110 M120 95 L140 110 M140 95 L160 110
             M160 95 L180 110 M180 95 L200 110 M200 95 L220 110
             M220 95 L240 110 M240 95 L260 110 M260 95 L280 110
             M280 95 L300 110"
          stroke="#d97706"
          strokeWidth="2"
        />

        {/* Counter-Jib Weight */}
        <rect x="12" y="85" width="40" height="25" rx="3" fill="#475569" />

        {/* Apex Tower & Steel Tension Cables */}
        <polygon points="75,95 80,35 85,95" fill="#d97706" />
        <line x1="80" y1="35" x2="25" y2="95" stroke="#64748b" strokeWidth="2.5" />
        <line x1="80" y1="35" x2="225" y2="95" stroke="#64748b" strokeWidth="2.5" />

        {/* Hoist Trolley, Cable & Hook */}
        <rect x="195" y="110" width="16" height="8" rx="1" fill="#334155" />
        <line x1="203" y1="118" x2="203" y2="215" stroke="#475569" strokeWidth="2" />
        <circle cx="203" cy="222" r="6" fill="#f59e0b" />
        <path
          d="M203 228 C203 240 190 238 190 230"
          stroke="#334155"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>

      {/* RIGHT: Under-Construction Building */}
      <svg
        className="backdrop-building"
        viewBox="0 0 280 540"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Ground Foundation Slab */}
        <rect x="30" y="440" width="220" height="90" fill="#334155" />
        <rect x="50" y="470" width="40" height="60" fill="#0f172a" />
        <rect x="110" y="470" width="45" height="60" fill="#0f172a" />
        <rect x="180" y="470" width="45" height="60" fill="#0f172a" />

        {/* Concrete Floors */}
        <rect x="35" y="340" width="210" height="100" fill="#475569" />
        <rect x="35" y="240" width="210" height="100" fill="#64748b" />
        <rect x="35" y="150" width="210" height="90" fill="#94a3b8" />

        {/* Windows / Open Framing */}
        <rect x="55" y="360" width="35" height="48" fill="#1e293b" />
        <rect x="115" y="360" width="45" height="48" fill="#1e293b" />
        <rect x="185" y="360" width="40" height="48" fill="#1e293b" />

        <rect x="55" y="260" width="35" height="48" fill="#334155" />
        <rect x="115" y="260" width="45" height="48" fill="#334155" />
        <rect x="185" y="260" width="40" height="48" fill="#334155" />

        <rect x="55" y="165" width="35" height="45" fill="#cbd5e1" />
        <rect x="115" y="165" width="45" height="45" fill="#cbd5e1" />
        <rect x="185" y="165" width="40" height="45" fill="#cbd5e1" />

        {/* Yellow Safety Guardrails */}
        <rect x="30" y="145" width="220" height="7" fill="#f59e0b" />
        <rect x="30" y="235" width="220" height="7" fill="#f59e0b" />
        <rect x="30" y="335" width="220" height="7" fill="#f59e0b" />
        <rect x="30" y="435" width="220" height="7" fill="#f59e0b" />

        {/* Exposed Top Steel Rebars (Under Construction) */}
        <line x1="50" y1="145" x2="50" y2="85" stroke="#334155" strokeWidth="3" />
        <line x1="60" y1="145" x2="60" y2="85" stroke="#334155" strokeWidth="3" />
        <line x1="120" y1="145" x2="120" y2="70" stroke="#334155" strokeWidth="3" />
        <line x1="130" y1="145" x2="130" y2="70" stroke="#334155" strokeWidth="3" />
        <line x1="190" y1="145" x2="190" y2="85" stroke="#334155" strokeWidth="3" />
        <line x1="200" y1="145" x2="200" y2="85" stroke="#334155" strokeWidth="3" />

        {/* Top Scaffolding Poles */}
        <rect x="42" y="105" width="195" height="4" fill="#f59e0b" />
        <line x1="75" y1="145" x2="75" y2="105" stroke="#f59e0b" strokeWidth="2.5" />
        <line x1="155" y1="145" x2="155" y2="105" stroke="#f59e0b" strokeWidth="2.5" />
        <line x1="215" y1="145" x2="215" y2="105" stroke="#f59e0b" strokeWidth="2.5" />
      </svg>
    </div>
  );
}