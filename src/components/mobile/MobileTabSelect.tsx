import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface MobileTabSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string; count?: number }>;
  placeholder?: string;
}

export function MobileTabSelect({ value, onValueChange, options, placeholder = "Selecione" }: MobileTabSelectProps) {
  const currentOption = options.find(opt => opt.value === value);
  
  return (
    <div className="flex items-center gap-2 w-full">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-12 flex-1">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="h-12">
              <div className="flex items-center justify-between w-full">
                <span>{option.label}</span>
                {option.count !== undefined && (
                  <Badge variant="secondary" className="ml-2">
                    {option.count}
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {currentOption?.count !== undefined && (
        <Badge variant="outline" className="h-8">
          {currentOption.count}
        </Badge>
      )}
    </div>
  );
}
