import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";
import { CREATIVE_TYPES, type CreativeType } from "@/lib/creativeTypes";

interface CreativeTypeSelectorProps {
  value: CreativeType;
  onChange: (value: CreativeType) => void;
  label?: string;
  hint?: string;
  className?: string;
}

export function CreativeTypeSelector({
  value,
  onChange,
  label = "Tipo de Criativo",
  hint = "Define a estrutura visual: hierarquia, presença de CTA e atmosfera.",
  className,
}: CreativeTypeSelectorProps) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label>{label}</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {CREATIVE_TYPES.map((type) => {
          const Icon = type.icon;
          const selected = value === type.value;
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => onChange(type.value)}
              className={`flex items-start gap-3 p-3 min-h-[64px] rounded-lg border text-left transition-all ${
                selected
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-md shrink-0 ${
                  selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium flex items-center gap-1.5">
                  {type.label}
                  {selected && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {type.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
