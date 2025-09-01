import { EventRegistrationsManager } from "@/components/admin/EventRegistrationsManager";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function AdminEvents() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Gerenciar Eventos</h2>
          <p className="text-muted-foreground">Administre eventos e inscrições da plataforma.</p>
        </div>
        
        <EventRegistrationsManager />
      </div>
    </DashboardLayout>
  );
}