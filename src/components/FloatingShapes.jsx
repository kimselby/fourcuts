const SHAPES = [
  { type: 'circle',  size: 28, color: '#C4BDEE', left: 8,  dur: 7.2,  delay: 0   },
  { type: 'rect',    size: 22, color: '#FFD6C8', left: 18, dur: 9.1,  delay: 1.4 },
  { type: 'blob',    size: 36, color: '#DDD8FB', left: 30, dur: 8.0,  delay: 0.6 },
  { type: 'star',    size: 20, color: '#F9C74F', left: 42, dur: 6.8,  delay: 2.2 },
  { type: 'circle',  size: 18, color: '#C8F0E8', left: 55, dur: 10.0, delay: 0.3 },
  { type: 'diamond', size: 24, color: '#FFB8C6', left: 65, dur: 7.6,  delay: 1.8 },
  { type: 'rect',    size: 30, color: '#DDD8FB', left: 75, dur: 8.8,  delay: 3.1 },
  { type: 'blob',    size: 26, color: '#FFD6C8', left: 85, dur: 9.4,  delay: 0.9 },
  { type: 'star',    size: 16, color: '#C4BDEE', left: 92, dur: 7.0,  delay: 2.7 },
  { type: 'circle',  size: 40, color: '#C8F0E8', left: 22, dur: 11.0, delay: 4.2 },
  { type: 'diamond', size: 18, color: '#F9C74F', left: 48, dur: 8.2,  delay: 5.0 },
  { type: 'blob',    size: 20, color: '#FFB8C6', left: 70, dur: 6.5,  delay: 1.1 },
  { type: 'rect',    size: 14, color: '#7C6FF7', left: 38, dur: 9.8,  delay: 3.6 },
  { type: 'circle',  size: 12, color: '#FF7B6B', left: 60, dur: 7.4,  delay: 6.0 },
  { type: 'star',    size: 22, color: '#4CC9B0', left: 12, dur: 10.5, delay: 2.0 },
];

const STAR_POINTS = Array.from({ length: 10 }, (_, i) => {
  const r = i % 2 === 0 ? 18 : 8;
  const a = (Math.PI / 5) * i - Math.PI / 2;
  return `${(20 + r * Math.cos(a)).toFixed(1)},${(20 + r * Math.sin(a)).toFixed(1)}`;
}).join(' ');

function ShapeEl({ type, color }) {
  switch (type) {
    case 'circle':
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" style={{ display: 'block' }}>
          <circle cx="20" cy="20" r="18" fill={color} />
        </svg>
      );
    case 'rect':
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" style={{ display: 'block' }}>
          <rect x="4" y="4" width="32" height="32" rx="6" fill={color} />
        </svg>
      );
    case 'diamond':
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" style={{ display: 'block' }}>
          <polygon points="20,2 38,20 20,38 2,20" fill={color} />
        </svg>
      );
    case 'blob':
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" style={{ display: 'block' }}>
          <ellipse cx="20" cy="22" rx="16" ry="14" fill={color} />
        </svg>
      );
    case 'star':
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" style={{ display: 'block' }}>
          <polygon points={STAR_POINTS} fill={color} />
        </svg>
      );
    default:
      return null;
  }
}

const layerStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  zIndex: 0,
  pointerEvents: 'none',
};

export default function FloatingShapes() {
  return (
    <div style={layerStyle}>
      {SHAPES.map((shape, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${shape.left}%`,
            top: '-60px',
            animationName: i % 3 === 0 ? 'fallWiggle' : 'fall',
            animationDuration: `${shape.dur}s`,
            animationDelay: `${shape.delay}s`,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            animationFillMode: 'both',
            willChange: 'transform',
            pointerEvents: 'none',
          }}
        >
          <ShapeEl type={shape.type} color={shape.color} />
        </div>
      ))}
    </div>
  );
}
