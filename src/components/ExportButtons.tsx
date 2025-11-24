import { Button } from "@/components/ui/button";
import { FileDown, FileText, Share2 } from "lucide-react";
import { useContentExport } from "@/hooks/useContentExport";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportButtonsProps {
  content: string;
  agentType: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ExportButtons({ content, agentType, variant = "outline", size = "sm" }: ExportButtonsProps) {
  const { exportToPDF, exportToTXT, shareWhatsApp } = useContentExport();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Share2 className="w-4 h-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportToPDF(content, agentType)}>
          <FileText className="w-4 h-4 mr-2" />
          Exportar PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToTXT(content, agentType)}>
          <FileDown className="w-4 h-4 mr-2" />
          Baixar TXT
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => shareWhatsApp(content, agentType)}>
          <Share2 className="w-4 h-4 mr-2" />
          Compartilhar no WhatsApp
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
