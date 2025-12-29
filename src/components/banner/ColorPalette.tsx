import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Copy, Check, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ColorPaletteProps {
  colors: string[];
  onColorsChange?: (colors: string[]) => void;
  editable?: boolean;
}

export function ColorPalette({ colors, onColorsChange, editable = false }: ColorPaletteProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const copyColor = (color: string, index: number) => {
    navigator.clipboard.writeText(color);
    setCopiedIndex(index);
    toast({
      title: "Cor copiada!",
      description: color,
    });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleColorChange = (index: number, newColor: string) => {
    if (onColorsChange) {
      const newColors = [...colors];
      newColors[index] = newColor;
      onColorsChange(newColors);
    }
    setEditingIndex(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {colors.map((color, index) => (
          <Popover key={index}>
            <PopoverTrigger asChild>
              <button
                className="group relative w-12 h-12 rounded-lg shadow-md hover:scale-110 transition-transform border-2 border-background"
                style={{ backgroundColor: color }}
                title={color}
              >
                {copiedIndex === index ? (
                  <Check className="w-4 h-4 text-white absolute inset-0 m-auto drop-shadow-lg" />
                ) : (
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 flex items-center justify-center">
                    {editable ? (
                      <Edit2 className="w-4 h-4 text-white drop-shadow-lg" />
                    ) : (
                      <Copy className="w-4 h-4 text-white drop-shadow-lg" />
                    )}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="center">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-mono text-sm">{color}</span>
                </div>
                
                {editable && editingIndex === index ? (
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      defaultValue={color}
                      placeholder="#000000"
                      className="w-28 font-mono text-sm"
                      onBlur={(e) => handleColorChange(index, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleColorChange(index, (e.target as HTMLInputElement).value);
                        }
                      }}
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyColor(color, index)}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copiar
                    </Button>
                    {editable && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setEditingIndex(index)}
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        ))}
      </div>
      
      <div className="flex flex-wrap gap-1">
        {colors.map((color, index) => (
          <span 
            key={index} 
            className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
          >
            {color}
          </span>
        ))}
      </div>
    </div>
  );
}
