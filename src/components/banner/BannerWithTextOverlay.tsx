import { forwardRef, type CSSProperties } from 'react';
import { BANNER_FORMATS, type BannerFormat } from './BannerComposite';

interface TextOverlay {
  headline: string;
  subheadline?: string;
  cta?: string;
  textColors: {
    headline: string;
    subheadline: string;
    cta_bg: string;
    cta_text: string;
  };
}

interface BannerWithTextOverlayProps {
  format: BannerFormat;
  backgroundImageUrl: string;
  textOverlay: TextOverlay;
  logoUrl?: string | null;
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  brandColors?: string[];
  previewScale?: number;
}

const BannerWithTextOverlay = forwardRef<HTMLDivElement, BannerWithTextOverlayProps>(
  (
    {
      format,
      backgroundImageUrl,
      textOverlay,
      logoUrl,
      logoPosition = 'bottom-right',
      brandColors = [],
      previewScale,
    },
    ref
  ) => {
    const { width, height } = BANNER_FORMATS[format];
    const scale = previewScale ?? 1;

    // Calculate responsive font sizes based on format
    const getFontSizes = () => {
      const baseSize = width * 0.05;
      return {
        headline: baseSize * 1.2,
        subheadline: baseSize * 0.7,
        cta: baseSize * 0.5,
      };
    };

    const fonts = getFontSizes();

    // Text shadow for legibility on any background
    const textShadow = '0 2px 8px rgba(0,0,0,0.6), 0 4px 20px rgba(0,0,0,0.4)';

    // Safe area margins
    const safeArea = {
      top: height * 0.05,
      bottom: height * 0.05,
      left: width * 0.05,
      right: width * 0.05,
    };

    // Logo position styles
    const getLogoStyle = (): CSSProperties => {
      const size = width * 0.12;
      const margin = width * 0.03;
      const base: CSSProperties = {
        position: 'absolute',
        width: size,
        height: size,
        objectFit: 'contain',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
      };
      
      switch (logoPosition) {
        case 'top-left':
          return { ...base, top: margin, left: margin };
        case 'top-right':
          return { ...base, top: margin, right: margin };
        case 'bottom-left':
          return { ...base, bottom: margin, left: margin };
        case 'bottom-right':
        default:
          return { ...base, bottom: margin, right: margin };
      }
    };

    // CTA button style
    const getCtaStyle = (): CSSProperties => {
      const padding = width * 0.025;
      return {
        backgroundColor: textOverlay.textColors.cta_bg,
        color: textOverlay.textColors.cta_text,
        padding: `${padding * scale}px ${padding * 2 * scale}px`,
        borderRadius: width * 0.02 * scale,
        fontSize: fonts.cta * scale,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        marginTop: height * 0.02 * scale,
        display: 'inline-block',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      };
    };

    return (
      <div
        ref={ref}
        style={{
          width: width * scale,
          height: height * scale,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#000',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
        data-format={format}
        data-width={width}
        data-height={height}
        className="banner-with-text-overlay"
      >
        {/* Background Image - Full bleed */}
        <img
          src={backgroundImageUrl}
          alt="Background"
          crossOrigin="anonymous"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />

        {/* Gradient overlay for text readability */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '60%',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Text Container - positioned at top */}
        <div
          style={{
            position: 'absolute',
            top: safeArea.top * scale,
            left: safeArea.left * scale,
            right: safeArea.right * scale,
            display: 'flex',
            flexDirection: 'column',
            gap: height * 0.02 * scale,
            zIndex: 10,
          }}
        >
          {/* Headline */}
          <h2
            style={{
              color: textOverlay.textColors.headline,
              fontSize: fonts.headline * scale,
              fontWeight: 800,
              lineHeight: 1.15,
              margin: 0,
              textShadow,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              maxWidth: '90%',
            }}
          >
            {textOverlay.headline}
          </h2>

          {/* Subheadline */}
          {textOverlay.subheadline && (
            <p
              style={{
                color: textOverlay.textColors.subheadline,
                fontSize: fonts.subheadline * scale,
                fontWeight: 400,
                lineHeight: 1.4,
                margin: 0,
                textShadow,
                maxWidth: '80%',
              }}
            >
              {textOverlay.subheadline}
            </p>
          )}

          {/* CTA Button */}
          {textOverlay.cta && (
            <span style={getCtaStyle()}>
              {textOverlay.cta}
            </span>
          )}
        </div>

        {/* Logo */}
        {logoUrl && (
          <img
            src={logoUrl}
            alt="Logo"
            crossOrigin="anonymous"
            style={getLogoStyle()}
          />
        )}

        {/* Brand color accent line at bottom */}
        {brandColors.length > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: height * 0.01 * scale,
              background: `linear-gradient(to right, ${brandColors[0]}, ${brandColors[1] || brandColors[0]})`,
            }}
          />
        )}
      </div>
    );
  }
);

BannerWithTextOverlay.displayName = 'BannerWithTextOverlay';

export { BannerWithTextOverlay };
export type { TextOverlay, BannerWithTextOverlayProps };
