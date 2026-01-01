import { type CSSProperties } from 'react';

export interface BrandOverlayProps {
  width: number;
  height: number;
  colors: string[];
  logoUrl?: string;
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showDecorations?: boolean;
  decorationStyle?: 'geometric' | 'neon' | 'lines' | 'corners';
  scale?: number;
}

export function BrandOverlay({
  width,
  height,
  colors,
  logoUrl,
  logoPosition = 'bottom-right',
  showDecorations = true,
  decorationStyle = 'geometric',
  scale = 1,
}: BrandOverlayProps) {
  const safeMargin = width * 0.05;
  const logoSize = width * 0.12;
  
  const primaryColor = colors[0] || '#ffffff';
  const secondaryColor = colors[1] || colors[0] || '#ffffff';
  const tertiaryColor = colors[2] || secondaryColor;

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

  // Generate decorations based on style
  const getDecorations = (): CSSProperties[] => {
    if (!showDecorations) return [];

    switch (decorationStyle) {
      case 'neon':
        return [
          // Glowing line at top
          {
            position: 'absolute',
            top: height * 0.15 * scale,
            left: 0,
            width: width * 0.6 * scale,
            height: 3 * scale,
            background: `linear-gradient(90deg, ${primaryColor} 0%, transparent 100%)`,
            boxShadow: `0 0 20px ${primaryColor}, 0 0 40px ${primaryColor}50`,
            pointerEvents: 'none',
            zIndex: 5,
          },
          // Vertical neon accent
          {
            position: 'absolute',
            top: height * 0.2 * scale,
            right: width * 0.1 * scale,
            width: 3 * scale,
            height: height * 0.25 * scale,
            background: `linear-gradient(180deg, ${secondaryColor} 0%, transparent 100%)`,
            boxShadow: `0 0 15px ${secondaryColor}, 0 0 30px ${secondaryColor}50`,
            pointerEvents: 'none',
            zIndex: 5,
          },
          // Bottom glow
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: height * 0.1 * scale,
            background: `linear-gradient(0deg, ${primaryColor}30 0%, transparent 100%)`,
            pointerEvents: 'none',
            zIndex: 5,
          },
        ];

      case 'corners':
        const cornerSize = width * 0.08 * scale;
        const cornerThickness = 4 * scale;
        return [
          // Top-left corner
          {
            position: 'absolute',
            top: safeMargin * scale,
            left: safeMargin * scale,
            width: cornerSize,
            height: cornerThickness,
            background: primaryColor,
            pointerEvents: 'none',
            zIndex: 5,
          },
          {
            position: 'absolute',
            top: safeMargin * scale,
            left: safeMargin * scale,
            width: cornerThickness,
            height: cornerSize,
            background: primaryColor,
            pointerEvents: 'none',
            zIndex: 5,
          },
          // Top-right corner
          {
            position: 'absolute',
            top: safeMargin * scale,
            right: safeMargin * scale,
            width: cornerSize,
            height: cornerThickness,
            background: secondaryColor,
            pointerEvents: 'none',
            zIndex: 5,
          },
          {
            position: 'absolute',
            top: safeMargin * scale,
            right: safeMargin * scale,
            width: cornerThickness,
            height: cornerSize,
            background: secondaryColor,
            pointerEvents: 'none',
            zIndex: 5,
          },
          // Bottom-left corner
          {
            position: 'absolute',
            bottom: safeMargin * scale,
            left: safeMargin * scale,
            width: cornerSize,
            height: cornerThickness,
            background: secondaryColor,
            pointerEvents: 'none',
            zIndex: 5,
          },
          {
            position: 'absolute',
            bottom: safeMargin * scale,
            left: safeMargin * scale,
            width: cornerThickness,
            height: cornerSize,
            background: secondaryColor,
            pointerEvents: 'none',
            zIndex: 5,
          },
        ];

      case 'lines':
        return [
          // Horizontal lines
          {
            position: 'absolute',
            top: height * 0.12 * scale,
            left: safeMargin * scale,
            width: width * 0.3 * scale,
            height: 2 * scale,
            background: primaryColor,
            pointerEvents: 'none',
            zIndex: 5,
          },
          {
            position: 'absolute',
            top: height * 0.14 * scale,
            left: safeMargin * scale,
            width: width * 0.15 * scale,
            height: 2 * scale,
            background: `${primaryColor}80`,
            pointerEvents: 'none',
            zIndex: 5,
          },
          // Right side accent
          {
            position: 'absolute',
            top: height * 0.25 * scale,
            right: 0,
            width: width * 0.02 * scale,
            height: height * 0.3 * scale,
            background: secondaryColor,
            pointerEvents: 'none',
            zIndex: 5,
          },
        ];

      case 'geometric':
      default:
        return [
          // Top corner accent triangle
          {
            position: 'absolute',
            top: 0,
            right: 0,
            width: 0,
            height: 0,
            borderLeft: `${width * 0.2 * scale}px solid transparent`,
            borderTop: `${width * 0.2 * scale}px solid ${primaryColor}30`,
            pointerEvents: 'none',
            zIndex: 5,
          },
          // Circle decoration
          {
            position: 'absolute',
            top: height * 0.15 * scale,
            left: width * 0.85 * scale,
            width: width * 0.08 * scale,
            height: width * 0.08 * scale,
            borderRadius: '50%',
            border: `3px solid ${secondaryColor}60`,
            pointerEvents: 'none',
            zIndex: 5,
          },
          // Small square accent
          {
            position: 'absolute',
            top: height * 0.35 * scale,
            left: width * 0.9 * scale,
            width: width * 0.03 * scale,
            height: width * 0.03 * scale,
            background: primaryColor,
            transform: 'rotate(45deg)',
            pointerEvents: 'none',
            zIndex: 5,
          },
          // Bottom gradient bar
          {
            position: 'absolute',
            bottom: height * 0.08 * scale,
            left: safeMargin * scale,
            width: width * 0.25 * scale,
            height: 4 * scale,
            background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 50%, transparent 100%)`,
            pointerEvents: 'none',
            zIndex: 5,
          },
          // Vertical line accent
          {
            position: 'absolute',
            bottom: 0,
            right: width * 0.15 * scale,
            width: 2 * scale,
            height: height * 0.12 * scale,
            background: `linear-gradient(0deg, ${tertiaryColor} 0%, transparent 100%)`,
            pointerEvents: 'none',
            zIndex: 5,
          },
        ];
    }
  };

  const decorations = getDecorations();

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