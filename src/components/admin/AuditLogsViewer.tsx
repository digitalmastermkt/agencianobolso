import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, AlertCircle, Eye, Edit, Send, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditLog {
  id: string;
  admin_user_id: string;
  action: string;
  target_user_id: string | null;
  resource_type: string;
  resource_ids: string[] | null;
  metadata: any;
  created_at: string;
  admin_email?: string;
  target_email?: string;
}

const actionLabels: Record<string, { label: string; icon: any; color: string }> = {
  view_users_list: { label: "Visualizou Lista de Usuários", icon: Eye, color: "blue" },
  edit_user_profile: { label: "Editou Perfil de Usuário", icon: Edit, color: "yellow" },
  edit_user_status: { label: "Editou Status de Usuário", icon: Edit, color: "yellow" },
  send_whatsapp: { label: "Enviou WhatsApp", icon: Send, color: "green" },
  view_user_report: { label: "Visualizou Relatório", icon: FileText, color: "purple" },
};

export function AuditLogsViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      // Fetch audit logs
      const { data: logsData, error: logsError } = await supabase
        .from("admin_access_audit")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      // Get unique user IDs to fetch profiles with emails
      const adminIds = [...new Set(logsData?.map(log => log.admin_user_id) || [])];
      const targetIds = [...new Set(logsData?.filter(log => log.target_user_id).map(log => log.target_user_id!) || [])];
      
      // Fetch profiles to get display names and emails via join with auth
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", [...adminIds, ...targetIds]);

      const profileMap = new Map<string, string>();
      profilesData?.forEach(p => {
        profileMap.set(p.user_id, p.display_name || "Usuário");
      });

      // Enrich logs with user names
      const enrichedLogs: AuditLog[] = logsData?.map(log => ({
        ...log,
        admin_email: profileMap.get(log.admin_user_id) || "Admin Desconhecido",
        target_email: log.target_user_id ? profileMap.get(log.target_user_id) : undefined,
      })) || [];

      setLogs(enrichedLogs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.admin_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === "all" || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    const actionInfo = actionLabels[action] || { label: action, icon: AlertCircle, color: "gray" };
    const Icon = actionInfo.icon;

    return (
      <Badge variant="outline" className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {actionInfo.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registro de Atividades Administrativas</CardTitle>
        <div className="flex gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por admin, usuário ou ação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              {Object.entries(actionLabels).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Nenhum log encontrado</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Administrador</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Usuário Alvo</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{log.admin_email}</TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>{log.target_email || "-"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
