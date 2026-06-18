import { variantById } from '../data/configurator.js'

/* Small 2D schematic of a container variant for the palette / placed list. */
export default function ModuleThumb({ variant, color = '#cfd3d8', style }) {
  const v = variantById[variant] || variantById.blank
  const W = 100, H = 60
  const bx = 8, by = 8, bw = W - 16, bh = H - 16
  const mapX = (x) => bx + bw / 2 + (x || 0) * (bw / 2 - 12)

  const els = []
  v.openings.forEach((o, i) => {
    const cx = mapX(o.x)
    if (o.type === 'door' || o.type === 'doubleDoor') {
      const w = o.type === 'doubleDoor' ? 18 : 11
      els.push(<rect key={i} x={cx - w / 2} y={by + bh - 26} width={w} height={26} rx="1.5" fill="#23262b" stroke="#3a3e44" />)
      if (o.type === 'doubleDoor') els.push(<line key={`d${i}`} x1={cx} y1={by + bh - 26} x2={cx} y2={by + bh} stroke="#54585e" strokeWidth="1" />)
    } else if (o.type === 'window') {
      els.push(<rect key={i} x={cx - 8} y={by + 12} width={16} height={15} rx="1" fill="#7fa6bd" stroke="#3a3e44" />)
    } else if (o.type === 'windowBand') {
      els.push(<rect key={i} x={bx + 8} y={by + 12} width={bw - 16} height={13} rx="1" fill="#7fa6bd" stroke="#3a3e44" />)
    } else if (o.type === 'shopfront') {
      els.push(<rect key={i} x={cx - 14} y={by + 8} width={28} height={bh - 12} rx="1" fill="#9ec3d6" stroke="#3a3e44" />)
    } else if (o.type === 'glazed') {
      els.push(<rect key={i} x={bx + 4} y={by + 5} width={bw - 8} height={bh - 6} rx="1" fill="#9ec3d6" stroke="#3a3e44" />)
      els.push(<line key={`g${i}`} x1={mapX(-0.3)} y1={by + 5} x2={mapX(-0.3)} y2={by + bh - 1} stroke="#3a3e44" strokeWidth="1" />)
      els.push(<line key={`g2${i}`} x1={mapX(0.3)} y1={by + 5} x2={mapX(0.3)} y2={by + bh - 1} stroke="#3a3e44" strokeWidth="1" />)
    } else if (o.type === 'rollup') {
      els.push(<rect key={i} x={cx - 16} y={by + 6} width={32} height={bh - 8} rx="1" fill="#34383d" stroke="#3a3e44" />)
      for (let s = 0; s < 5; s++) els.push(<line key={`r${i}${s}`} x1={cx - 16} y1={by + 10 + s * 7} x2={cx + 16} y2={by + 10 + s * 7} stroke="#4a4e54" strokeWidth="1" />)
    } else if (o.type === 'open') {
      els.push(<rect key={i} x={cx - 14} y={by + 12} width={28} height={16} rx="1" fill="#2a2d31" stroke="#3a3e44" />)
      els.push(<rect key={`c${i}`} x={cx - 16} y={by + 28} width={32} height={4} fill="#23262b" />)
    } else if (o.type === 'louver') {
      els.push(<rect key={i} x={cx - 9} y={by + 12} width={18} height={20} rx="1" fill="#34383d" stroke="#3a3e44" />)
      for (let s = 0; s < 4; s++) els.push(<line key={`l${i}${s}`} x1={cx - 9} y1={by + 16 + s * 5} x2={cx + 9} y2={by + 16 + s * 5} stroke="#5a5e64" strokeWidth="1.4" />)
    }
  })

  return (
    <svg viewBox="0 0 100 60" style={style} preserveAspectRatio="xMidYMid meet">
      {/* body */}
      <rect x={bx} y={by} width={bw} height={bh} rx="2" fill={color} stroke="#23262b" strokeWidth="1.5" />
      {/* corrugation hint */}
      {!['glazed'].includes(v.openings[0]?.type) &&
        Array.from({ length: 9 }).map((_, i) => (
          <line key={i} x1={bx + 6 + i * ((bw - 12) / 8)} y1={by + 2} x2={bx + 6 + i * ((bw - 12) / 8)} y2={by + bh - 2} stroke="rgba(0,0,0,0.10)" strokeWidth="1" />
        ))}
      {/* corner castings */}
      {[[bx, by], [bx + bw - 6, by], [bx, by + bh - 6], [bx + bw - 6, by + bh - 6]].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="6" height="6" fill="#1c1f23" />
      ))}
      {els}
      {v.corner && <path d={`M${bx + bw} ${by} l6 4 l0 ${bh - 8} l-6 4`} fill="#9ec3d6" stroke="#3a3e44" strokeWidth="1" />}
    </svg>
  )
}
