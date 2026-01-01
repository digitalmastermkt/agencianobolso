import { forwardRef, type CSSProperties } from 'react';
import { BrandOverlay } from './BrandOverlay';

// Formatos fixos com dimensões exatas
export const BANNER_FORMATS = {
  stories: { width: 1080, height: 1920, label: 'Stories', aspect: '9:16' },
  retrato: { width: 1080, height: 1350, label: 'Retrato', aspect: '4:5' },
  quadrado: { width: 1080, height: 1080, label: 'Quadrado', aspect: '1:1' },
} as const;

export type BannerFormat = keyof typeof BANNER_FORMATS;

export interface BannerCompositeProps {
  format: BannerFormat;
  backgroundImageUrl: string;
  personPhotoUrl?: string;
  personCutoutUrl?: string; // Person photo with background removed
  personPosition: 'esquerda' | 'centro' | 'direita';
  headline: string;
  subheadline?: string;
  cta?: string;
  colors: {
    headline: string;
    subheadline: string;
    ctaBackground: string;
    ctaText: string;
    brandPrimary?: string;
    brandSecondary?: string;
  };
  brandColors?: string[];
  logoUrl?: string;
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showDecorations?: boolean;
  decorationStyle?: 'geometric' | 'neon' | 'lines' | 'corners';
  highlightKeyword?: boolean; // Highlight part of headline with brand color
  highlightPosition?: 'first' | 'last' | 'auto'; // Which part to highlight
  style?: 'clean' | 'minimal' | 'premium';
  previewScale?: number; // Para preview responsivo (ex: 0.3 = 30% do tamanho real)
}

const BannerComposite = forwardRef<HTMLDivElement, BannerCompositeProps>(
  (
    {
      format,
      backgroundImageUrl,
      personPhotoUrl,
      personCutoutUrl,
      personPosition,
      headline,
      subheadline,
      cta,
      colors,
      brandColors = [],
      logoUrl,
      logoPosition = 'bottom-right',
      showDecorations = true,
      decorationStyle = 'geometric',
      highlightKeyword = true,
      highlightPosition = 'auto',
      style = 'clean',
      previewScale,
    },
    ref
  ) => {
    const { width, height } = BANNER_FORMATS[format];
    const scale = previewScale ?? 1;
    
    // Use cutout if available, otherwise fallback to regular photo
    const personImageUrl = personCutoutUrl || personPhotoUrl;

    // Calcular posição da pessoa baseado no template
    const getPersonStyle = (): CSSProperties => {
      const baseStyle: CSSProperties = {
        position: 'absolute',
        bottom: 0,
        height: '70%',
        width: 'auto',
        objectFit: 'contain',
        objectPosition: 'bottom',
      };

      switch (personPosition) {
        case 'esquerda':
          return { ...baseStyle, left: '5%' };
        case 'direita':
          return { ...baseStyle, right: '5%' };
        case 'centro':
        default:
          return { ...baseStyle, left: '50%', transform: 'translateX(-50%)' };
      }
    };

    // Safe-area margins baseadas no formato
    const getSafeArea = () => {
      const marginPercent = 0.05; // 5% de margem
      return {
        top: height * marginPercent,
        bottom: height * marginPercent,
        left: width * marginPercent,
        right: width * marginPercent,
      };
    };

    const safeArea = getSafeArea();

    // Posição do texto baseada na posição da pessoa
    const getTextContainerStyle = (): CSSProperties => {
      const baseStyle: CSSProperties = {
        position: 'absolute',
        top: safeArea.top,
        display: 'flex',
        flexDirection: 'column',
        gap: height * 0.02,
        zIndex: 10,
      };

      switch (personPosition) {
        case 'esquerda':
          return {
            ...baseStyle,
            right: safeArea.right,
            left: '45%',
            textAlign: 'right',
            alignItems: 'flex-end',
          };
        case 'direita':
          return {
            ...baseStyle,
            left: safeArea.left,
            right: '45%',
            textAlign: 'left',
            alignItems: 'flex-start',
          };
        case 'centro':
        default:
          return {
            ...baseStyle,
            left: safeArea.left,
            right: safeArea.right,
            textAlign: 'center',
            alignItems: 'center',
          };
      }
    };

    // Estilos de tipografia baseados no formato
    const getFontSizes = () => {
      const baseSize = width * 0.05; // 5% da largura
      return {
        headline: baseSize * 1.2,
        subheadline: baseSize * 0.7,
        cta: baseSize * 0.5,
      };
    };

    const fonts = getFontSizes();

    // Estilo de sombra de texto para legibilidade
    const textShadow = '0 2px 8px rgba(0,0,0,0.6), 0 4px 20px rgba(0,0,0,0.4)';

    // CTA estilo baseado no design
    const getCtaStyle = (): CSSProperties => {
      const padding = width * 0.025;
      return {
        backgroundColor: colors.ctaBackground,
        color: colors.ctaText,
        padding: `${padding}px ${padding * 2}px`,
        borderRadius: width * 0.02,
        fontSize: fonts.cta,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        marginTop: height * 0.02,
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
      >
        {/* Background Image - Full bleed */}
        <img
          src={backgroundImageUrl}
          alt="Background"
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

        {/* Overlay gradient for text legibility */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Person Photo (use cutout if available) */}
        {personImageUrl && (
          <img
            src={personImageUrl}
            alt="Pessoa"
            style={getPersonStyle()}
            crossOrigin="anonymous"
          />
        )}

        {/* Brand Overlay - decorative elements and logo */}
        {(brandColors.length > 0 || logoUrl) && (
          <BrandOverlay
            width={width}
            height={height}
            colors={brandColors}
            logoUrl={logoUrl}
            logoPosition={logoPosition}
            showDecorations={showDecorations}
            decorationStyle={decorationStyle}
            scale={scale}
          />
        )}

        {/* Text Container */}
        <div style={getTextContainerStyle()}>
          {/* Headline - with professional keyword highlighting */}
          <h2
            style={{
              color: colors.headline,
              fontSize: fonts.headline * scale,
              fontWeight: 800,
              lineHeight: 1.15,
              margin: 0,
              textShadow,
              maxWidth: '90%',
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
            }}
          >
            {highlightKeyword && colors.brandPrimary ? (
              <HeadlineWithHighlight 
                text={headline} 
                highlightColor={colors.brandPrimary}
                baseColor={colors.headline}
                position={highlightPosition}
              />
            ) : (
              headline
            )}
          </h2>

          {/* Subheadline */}
          {subheadline && (
            <p
              style={{
                color: colors.subheadline,
                fontSize: fonts.subheadline * scale,
                fontWeight: 400,
                lineHeight: 1.4,
                margin: 0,
                textShadow,
                maxWidth: '80%',
              }}
            >
              {subheadline}
            </p>
          )}

          {/* CTA */}
          {cta && (
            <span style={getCtaStyle()}>
              {cta}
            </span>
          )}
        </div>
      </div>
    );
  }
);

// Helper component for headline highlighting with professional typography
function HeadlineWithHighlight({ 
  text, 
  highlightColor, 
  baseColor,
  position = 'auto'
}: { 
  text: string; 
  highlightColor: string; 
  baseColor: string;
  position?: 'first' | 'last' | 'auto';
}) {
  // Try to find natural break points (comma, period, newline, colon)
  const breakPattern = /([,.:!\n])/;
  const parts = text.split(breakPattern);
  
  if (parts.length <= 1) {
    // No break points, try to highlight last word or key phrase
    const words = text.split(' ');
    if (words.length >= 2) {
      // Highlight last 1-3 words based on position setting
      const highlightWordCount = position === 'first' ? Math.min(2, Math.ceil(words.length / 3)) : 
                                  Math.min(3, Math.ceil(words.length / 2));
      
      if (position === 'first') {
        return (
          <>
            <span style={{ color: highlightColor }}>{words.slice(0, highlightWordCount).join(' ')}</span>
            <span style={{ color: baseColor }}>{' ' + words.slice(highlightWordCount).join(' ')}</span>
          </>
        );
      } else {
        return (
          <>
            <span style={{ color: baseColor }}>{words.slice(0, -highlightWordCount).join(' ') + ' '}</span>
            <span style={{ color: highlightColor }}>{words.slice(-highlightWordCount).join(' ')}</span>
          </>
        );
      }
    }
    return <span style={{ color: baseColor }}>{text}</span>;
  }
  
  // Has break points - highlight based on position
  if (position === 'first') {
    // Highlight first segment
    const firstPart = parts[0];
    const rest = parts.slice(1).join('');
    return (
      <>
        <span style={{ color: highlightColor }}>{firstPart}</span>
        <span style={{ color: baseColor }}>{rest}</span>
      </>
    );
  } else {
    // Highlight last segment (default 'auto' and 'last')
    const lastIndex = parts.length - 1;
    let lastPart = parts[lastIndex];
    
    // Skip empty parts and find the last meaningful text
    let actualLastIndex = lastIndex;
    while (actualLastIndex > 0 && !parts[actualLastIndex].trim()) {
      actualLastIndex--;
    }
    lastPart = parts[actualLastIndex];
    
    return (
      <>
        {parts.slice(0, actualLastIndex).map((part, i) => (
          <span key={i} style={{ color: baseColor }}>{part}</span>
        ))}
        <span style={{ color: highlightColor }}>{lastPart}</span>
        {actualLastIndex < lastIndex && (
          <span style={{ color: baseColor }}>{parts.slice(actualLastIndex + 1).join('')}</span>
        )}
      </>
    );
  }
}

BannerComposite.displayName = 'BannerComposite';

export { BannerComposite };
