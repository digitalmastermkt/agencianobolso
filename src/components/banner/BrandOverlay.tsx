import { type CSSProperties } from 'react';

export interface BrandOverlayProps {
  width: number;
  height: number;
  colors: string[];
  logoUrl?: string;
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showDecorations?: boolean;
  scale?: number;
}

export function BrandOverlay({
  width,
  height,
  colors,
  logoUrl,
  logoPosition = 'bottom-right',
  showDecorations = true,
  scale = 1,
}: BrandOverlayProps) {
  const safeMargin = width * 0.05;
  const logoSize = width * 0.12;
  
  const primaryColor = colors[0] || '#ffffff';
  const secondaryColor = colors[1] || colors[0] || '#ffffff';

  const getLogoStyle = (): CSSProperties => {
    const base: CSSProperties = {
      position: 'absolute',
      width: logoSize * scale,
      height: logoSize * scale,
      objectFit: 'contain',
      zIndex: 20,
    };

    switch (logoPosition) {
      case 'top-left':
        return { ...base, top: safeMargin * scale, left: safeMargin * scale };
      case 'top-right':
        return { ...base, top: safeMargin * scale, right: safeMargin * scale };
      case 'bottom-left':
        return { ...base, bottom: safeMargin * scale, left: safeMargin * scale };
      case 'bottom-right':
      default:
        return { ...base, bottom: safeMargin * scale, right: safeMargin * scale };
    }
  };

  // Decorative elements based on brand colors
  const decorations: CSSProperties[] = showDecorations
    ? [
        // Top corner accent
        {
          position: 'absolute',
          top: 0,
          right: 0,
          width: width * 0.15 * scale,
          height: width * 0.15 * scale,
          background: `linear-gradient(135deg, ${primaryColor}40 0%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 5,
        },
        // Bottom corner accent
        {
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: width * 0.2 * scale,
          height: width * 0.2 * scale,
          background: `linear-gradient(315deg, ${secondaryColor}30 0%, transparent 60%)`,
          pointerEvents: 'none',
          zIndex: 5,
        },
        // Subtle light line
        {
          position: 'absolute',
          top: height * 0.3 * scale,
          right: 0,
          width: width * 0.4 * scale,
          height: 2 * scale,
          background: `linear-gradient(90deg, transparent 0%, ${primaryColor}50 50%, transparent 100%)`,
          pointerEvents: 'none',
          zIndex: 5,
        },
      ]
    : [];

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: width * scale,
        height: height * scale,
        pointerEvents: 'none',
        zIndex: 15,
      }}
    >
      {/* Decorative elements */}
      {decorations.map((style, index) => (
        <div key={index} style={style as CSSProperties} />
      ))}

      {/* Logo */}
      {logoUrl && (
        <img
          src={logoUrl}
          alt="Brand logo"
          style={getLogoStyle()}
          crossOrigin="anonymous"
        />
      )}
    </div>
  );
}
