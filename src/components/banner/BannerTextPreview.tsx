import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Type } from "lucide-react";
import { BANNER_FORMATS, type BannerFormat } from "@/components/banner/BannerComposite";

interface BannerTextPreviewProps {
  format: BannerFormat;
  headline: string;
  subheadline?: string;
  cta?: string;
  brandColors?: string[];
  className?: string;
}

export function BannerTextPreview({
  format,
  headline,
  subheadline,
  cta,
  brandColors = [],
  className,
}: BannerTextPreviewProps) {
  const dimensions = BANNER_FORMATS[format];
  const aspectRatio = dimensions.width / dimensions.height;
  
  // Calculate font sizes based on format
  const fontSizes = useMemo(() => {
    const baseSize = format === 'stories' ? 24 : format === 'retrato' ? 22 : 28;
    return {
      headline: baseSize,
      subheadline: baseSize * 0.6,
      cta: baseSize * 0.45,
    };
  }, [format]);

  // Primary brand color or default
  const primaryColor = brandColors[0] || "#8B5CF6";
  const accentColor = brandColors[1] || "#EC4899";

  // Simulate text wrapping based on container width
  const estimatedMaxChars = format === 'stories' ? 20 : format === 'retrato' ? 25 : 30;
  const headlineLines = headline ? Math.ceil(headline.length / estimatedMaxChars) : 0;
  
  const getFormatLabel = () => {
    switch (format) {
      case 'stories':
        return 'Stories (1080x1920)';
      case 'retrato':
        return 'Retrato (1080x1350)';
      case 'quadrado':
        return 'Quadrado (1080x1080)';
      default:
        return format;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Eye className="w-4 h-4" />
          Preview do Texto
          <Badge variant="outline" className="ml-auto text-[10px]">
            {getFormatLabel()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="relative mx-auto overflow-hidden rounded-lg border bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          style={{ 
            aspectRatio: aspectRatio,
            maxWidth: aspectRatio > 1 ? '100%' : '200px',
          }}
        >
          {/* Simulated gradient overlay */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}40, ${accentColor}40)`,
            }}
          />

          {/* Text content area */}
          <div className="absolute inset-0 flex flex-col p-4">
            {/* Top area - headline and subheadline */}
            <div className="flex-1">
              {headline ? (
                <div className="space-y-2">
                  <p 
                    className="font-bold leading-tight text-white drop-shadow-lg"
                    style={{ 
                      fontSize: `${fontSizes.headline * 0.5}px`,
                      lineHeight: 1.2,
                    }}
                  >
                    {headline}
                  </p>
                  
                  {subheadline && (
                    <p 
                      className="text-white/80 leading-tight"
                      style={{ 
                        fontSize: `${fontSizes.subheadline * 0.5}px`,
                        lineHeight: 1.3,
                      }}
                    >
                      {subheadline}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-white/40">
                  <div className="text-center">
                    <Type className="w-6 h-6 mx-auto mb-1" />
                    <p className="text-[10px]">Digite o headline</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom area - CTA */}
            {cta && (
              <div className="mt-auto pt-2">
                <div 
                  className="inline-block px-3 py-1.5 rounded-lg font-semibold text-center"
                  style={{ 
                    fontSize: `${fontSizes.cta * 0.5}px`,
                    backgroundColor: primaryColor,
                    color: '#ffffff',
                  }}
                >
                  {cta}
                </div>
              </div>
            )}
          </div>

          {/* Character count indicators */}
          <div className="absolute bottom-1 right-1 flex gap-1">
            {headline.length > estimatedMaxChars * 2 && (
              <Badge variant="destructive" className="text-[8px] px-1 py-0">
                Texto longo
              </Badge>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-3 space-y-1.5">
          {headline.length === 0 && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Digite um headline para visualizar
            </p>
          )}
          {headline.length > 0 && headline.length < 10 && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Headlines curtos funcionam bem para impacto
            </p>
          )}
          {headline.length > estimatedMaxChars * 2 && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
              Texto pode ficar pequeno no banner final
            </p>
          )}
          {headlineLines > 3 && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Considere reduzir para ~{estimatedMaxChars * 2} caracteres
            </p>
          )}
          {cta && cta.length > 20 && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              CTA ideal: até 20 caracteres
            </p>
          )}
          {!cta && headline.length > 0 && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Adicione um CTA para melhor conversão
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
