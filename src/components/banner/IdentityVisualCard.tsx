import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ColorPalette } from "./ColorPalette";
import { Palette, Type, Sparkles, Heart } from "lucide-react";

export interface VisualIdentity {
  colors: string[];
  typography: {
    style: string;
    weight: string;
    description: string;
  };
  visualStyle: string;
  mood: string;
  recurringElements: string[];
  overallDescription: string;
}

interface IdentityVisualCardProps {
  identity: VisualIdentity;
  onIdentityChange?: (identity: VisualIdentity) => void;
  editable?: boolean;
}

export function IdentityVisualCard({ identity, onIdentityChange, editable = false }: IdentityVisualCardProps) {
  const handleColorsChange = (newColors: string[]) => {
    if (onIdentityChange) {
      onIdentityChange({ ...identity, colors: newColors });
    }
  };

  return (
    <Card className="bg-gradient-to-br from-background to-muted/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Palette className="w-5 h-5 text-primary" />
          Identidade Visual Detectada
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Colors */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Palette className="w-4 h-4 text-muted-foreground" />
            Paleta de Cores
          </div>
          <ColorPalette 
            colors={identity.colors} 
            onColorsChange={editable ? handleColorsChange : undefined}
            editable={editable}
          />
        </div>

        {/* Typography */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Type className="w-4 h-4 text-muted-foreground" />
            Tipografia
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{identity.typography.style}</Badge>
            <Badge variant="outline">{identity.typography.weight}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{identity.typography.description}</p>
        </div>

        {/* Visual Style & Mood */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
              Estilo Visual
            </div>
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
              {identity.visualStyle}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Heart className="w-4 h-4 text-muted-foreground" />
              Mood
            </div>
            <Badge variant="outline">{identity.mood}</Badge>
          </div>
        </div>

        {/* Recurring Elements */}
        {identity.recurringElements.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Elementos Recorrentes</div>
            <div className="flex flex-wrap gap-1.5">
              {identity.recurringElements.map((element, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {element}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Overall Description */}
        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground italic">
            "{identity.overallDescription}"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
