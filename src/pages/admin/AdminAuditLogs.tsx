import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AuditLogsViewer } from "@/components/admin/AuditLogsViewer";
import { Shield } from "lucide-react";

export default function AdminAuditLogs() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Logs de Auditoria</h1>
          </div>
          <p className="text-muted-foreground">
            Registro de todos os acessos administrativos a dados sensíveis
          </p>
        </div>

        <AuditLogsViewer />
      </div>
    </DashboardLayout>
  );
}
