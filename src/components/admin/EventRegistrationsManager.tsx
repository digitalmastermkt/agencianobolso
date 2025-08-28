import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Download, Shield } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EventRegistration {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  created_at: string;
  updated_at: string;
}

export function EventRegistrationsManager() {
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<EventRegistration | null>(null);
  const { toast } = useToast();

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_decrypted_event_registrations');
      
      if (error) {
        console.error('Error fetching registrations:', error);
        toast({
          title: 'Erro ao carregar registros',
          description: 'Não foi possível carregar os registros do evento.',
          variant: 'destructive',
        });
        return;
      }

      setRegistrations(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Erro',
        description: 'Erro interno ao carregar registros.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleRegistration = async (id: string) => {
    try {
      const { data, error } = await supabase.rpc('get_decrypted_event_registration', {
        registration_id: id
      });
      
      if (error) {
        console.error('Error fetching single registration:', error);
        toast({
          title: 'Erro ao carregar detalhes',
          description: 'Não foi possível carregar os detalhes do registro.',
          variant: 'destructive',
        });
        return;
      }

      if (data && data.length > 0) {
        setSelectedRegistration(data[0]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Erro',
        description: 'Erro interno ao carregar detalhes.',
        variant: 'destructive',
      });
    }
  };

  const exportRegistrations = () => {
    if (registrations.length === 0) {
      toast({
        title: 'Nenhum dado para exportar',
        description: 'Não há registros para exportar.',
        variant: 'destructive',
      });
      return;
    }

    const csvContent = [
      ['Nome', 'Email', 'WhatsApp', 'Data de Registro'].join(','),
      ...registrations.map(reg => [
        reg.nome,
        reg.email,
        reg.whatsapp,
        new Date(reg.created_at).toLocaleString('pt-BR')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `registros_evento_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: 'Dados exportados',
      description: 'Os registros foram exportados com sucesso.',
    });
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Registros do Evento</h2>
          <p className="text-muted-foreground">
            Gerencie os registros do evento com dados descriptografados
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchRegistrations} disabled={loading}>
            Atualizar
          </Button>
          <Button onClick={exportRegistrations} variant="outline" disabled={registrations.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Dados Sensíveis:</strong> Os dados exibidos nesta página são descriptografados e contêm informações pessoais. 
          Todos os acessos são registrados para auditoria de segurança.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Registros ({registrations.length})
            <Badge variant="secondary">Dados Descriptografados</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando registros...</div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum registro encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Data de Registro</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell className="font-medium">{registration.nome}</TableCell>
                    <TableCell>{registration.email}</TableCell>
                    <TableCell>{registration.whatsapp}</TableCell>
                    <TableCell>
                      {new Date(registration.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => fetchSingleRegistration(registration.id)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Detalhes do Registro</DialogTitle>
                          </DialogHeader>
                          {selectedRegistration && (
                            <div className="space-y-4">
                              <div>
                                <strong>Nome:</strong> {selectedRegistration.nome}
                              </div>
                              <div>
                                <strong>Email:</strong> {selectedRegistration.email}
                              </div>
                              <div>
                                <strong>WhatsApp:</strong> {selectedRegistration.whatsapp}
                              </div>
                              <div>
                                <strong>Data de Registro:</strong>{' '}
                                {new Date(selectedRegistration.created_at).toLocaleString('pt-BR')}
                              </div>
                              <div>
                                <strong>Última Atualização:</strong>{' '}
                                {new Date(selectedRegistration.updated_at).toLocaleString('pt-BR')}
                              </div>
                              <Alert>
                                <Shield className="h-4 w-4" />
                                <AlertDescription>
                                  Este acesso aos dados descriptografados foi registrado para auditoria.
                                </AlertDescription>
                              </Alert>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}