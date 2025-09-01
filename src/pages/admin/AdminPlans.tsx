import { PlansAdmin } from "@/components/admin/PlansAdmin";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function AdminPlans() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Gerenciar Planos</h2>
          <p className="text-muted-foreground">Administre os planos de assinatura da plataforma.</p>
        </div>
        
        <PlansAdmin />
      </div>
    </DashboardLayout>
  );
}