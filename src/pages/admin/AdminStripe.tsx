import { StripePriceUpdater } from "@/components/admin/StripePriceUpdater";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function AdminStripe() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Configurações Stripe</h2>
          <p className="text-muted-foreground">Gerencie preços e configurações do Stripe.</p>
        </div>
        
        <StripePriceUpdater />
      </div>
    </DashboardLayout>
  );
}