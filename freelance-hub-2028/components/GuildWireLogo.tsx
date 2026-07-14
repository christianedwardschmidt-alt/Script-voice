interface GuildWireLogoProps {
  width?: number
  guildColor?: string
  wireColor?: string
  taglineColor?: string
  wordmarkFontSize?: number
  taglineFontSize?: number
  className?: string
}

export default function GuildWireLogo({
  width = 680,
  guildColor = '#0A1A2E',
  wireColor = '#16A34A',
  taglineColor = '#6B7280',
  wordmarkFontSize = 56,
  taglineFontSize = 15,
  className,
}: GuildWireLogoProps) {
  const height = width * (160 / 680)

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 680 160"
      width={width}
      height={height}
      role="img"
      aria-label="GuildWire — Work for yourself. Never by yourself."
      className={className}
    >
      <text
        x={340}
        y={82}
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight={700}
        fontSize={wordmarkFontSize}
        textLength={300}
        lengthAdjust="spacing"
      >
        <tspan fill={guildColor}>Guild</tspan><tspan fill={wireColor}>Wire</tspan>
      </text>
      <text
        x={340}
        y={114}
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize={taglineFontSize}
        fill={taglineColor}
        textLength={300}
        lengthAdjust="spacing"
      >
        Work for yourself. Never by yourself.
      </text>
    </svg>
  )
}
