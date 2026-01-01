import { forwardRef, type CSSProperties } from 'react';

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
  personPosition: 'esquerda' | 'centro' | 'direita';
  headline: string;
  subheadline?: string;
  cta?: string;
  colors: {
    headline: string;
    subheadline: string;
    ctaBackground: string;
    ctaText: string;
  };
  style?: 'clean' | 'minimal' | 'premium';
  previewScale?: number; // Para preview responsivo (ex: 0.3 = 30% do tamanho real)
}

const BannerComposite = forwardRef<HTMLDivElement, BannerCompositeProps>(
  (
    {
      format,
      backgroundImageUrl,
      personPhotoUrl,
      personPosition,
      headline,
      subheadline,
      cta,
      colors,
      style = 'clean',
      previewScale,
    },
    ref
  ) => {
    const { width, height } = BANNER_FORMATS[format];
    const scale = previewScale ?? 1;

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

        {/* Person Photo (if preserveIdentity mode) */}
        {personPhotoUrl && (
          <img
            src={personPhotoUrl}
            alt="Pessoa"
            style={getPersonStyle()}
            crossOrigin="anonymous"
          />
        )}

        {/* Text Container */}
        <div style={getTextContainerStyle()}>
          {/* Headline */}
          <h2
            style={{
              color: colors.headline,
              fontSize: fonts.headline * scale,
              fontWeight: 700,
              lineHeight: 1.2,
              margin: 0,
              textShadow,
              maxWidth: '90%',
            }}
          >
            {headline}
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

BannerComposite.displayName = 'BannerComposite';

export { BannerComposite };
