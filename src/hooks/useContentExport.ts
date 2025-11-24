import { useCallback } from 'react';
import jsPDF from 'jspdf';
import { useToast } from './use-toast';

const agentNames: Record<string, string> = {
  vendas: "Agente de Vendas",
  storytelling: "Agente de Storytelling",
  viral: "Agente Viral",
  interacao: "Agente de Interação",
  conexao: "Agente de Conexão",
  banner: "Agente de Banner",
};

export function useContentExport() {
  const { toast } = useToast();

  const exportToPDF = useCallback((content: string, agentType: string) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      
      // Header
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text(agentNames[agentType] || 'Geração de IA', margin, margin);
      
      // Date
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const date = new Date().toLocaleDateString('pt-BR');
      doc.text(`Data: ${date}`, margin, margin + 10);
      
      // Content
      doc.setFontSize(12);
      const lines = doc.splitTextToSize(content, maxWidth);
      let y = margin + 25;
      
      lines.forEach((line: string) => {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 7;
      });
      
      // Save
      const filename = `${agentType}_${Date.now()}.pdf`;
      doc.save(filename);
      
      toast({
        title: "PDF exportado!",
        description: "O arquivo foi baixado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar o PDF",
        variant: "destructive",
      });
    }
  }, [toast]);

  const exportToTXT = useCallback((content: string, agentType: string) => {
    try {
      const header = `${agentNames[agentType] || 'Geração de IA'}\nData: ${new Date().toLocaleDateString('pt-BR')}\n\n`;
      const fullContent = header + content;
      
      const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${agentType}_${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "TXT exportado!",
        description: "O arquivo foi baixado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao exportar TXT:', error);
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar o arquivo TXT",
        variant: "destructive",
      });
    }
  }, [toast]);

  const shareWhatsApp = useCallback((content: string, agentType: string) => {
    try {
      const header = `*${agentNames[agentType] || 'Geração de IA'}*\n\n`;
      const message = header + content;
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://web.whatsapp.com/send?text=${encodedMessage}`;
      
      window.open(whatsappUrl, '_blank');
      
      toast({
        title: "Abrindo WhatsApp",
        description: "Compartilhe sua geração no WhatsApp Web",
      });
    } catch (error) {
      console.error('Erro ao compartilhar no WhatsApp:', error);
      toast({
        title: "Erro ao compartilhar",
        description: "Não foi possível abrir o WhatsApp",
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    exportToPDF,
    exportToTXT,
    shareWhatsApp,
  };
}
