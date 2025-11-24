import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FileText, FileDown, Share2 } from "lucide-react";
import { useContentExport } from "@/hooks/useContentExport";

interface MobileExportSheetProps {
  content: string;
  agentType: string;
}

export function MobileExportSheet({ content, agentType }: MobileExportSheetProps) {
  const { exportToPDF, exportToTXT, shareWhatsApp } = useContentExport();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="default" className="min-h-[44px]">
          <Share2 className="w-5 h-5 mr-2" />
          Compartilhar
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader>
          <SheetTitle>Compartilhar Conteúdo</SheetTitle>
          <SheetDescription>
            Escolha como deseja exportar ou compartilhar
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-3 mt-6">
          <Button 
            variant="default" 
            size="lg" 
            className="w-full h-14 text-base bg-green-600 hover:bg-green-700"
            onClick={() => shareWhatsApp(content, agentType)}
          >
            <Share2 className="w-5 h-5 mr-2" />
            Compartilhar no WhatsApp
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full h-14 text-base"
            onClick={() => exportToPDF(content, agentType)}
          >
            <FileText className="w-5 h-5 mr-2" />
            Exportar PDF
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full h-14 text-base"
            onClick={() => exportToTXT(content, agentType)}
          >
            <FileDown className="w-5 h-5 mr-2" />
            Baixar TXT
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
