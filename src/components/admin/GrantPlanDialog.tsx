import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield } from "lucide-react";

interface GrantPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    user_id: string;
    display_name: string | null;
    email?: string;
  };
  onUserUpdate?: () => void;
}

export function GrantPlanDialog({ open, onOpenChange, user, onUserUpdate }: GrantPlanDialogProps) {
  const [tier, setTier] = useState<string>("Essencial");
  const [durationDays, setDurationDays] = useState<number>(30);
  const [loading, setLoading] = useState(false);

  const handleGrant = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      // Upsert subscriber record with manual override
      const { error } = await supabase
        .from("subscribers")
        .upsert(
          {
            user_id: user.user_id,
            email: user.email || "",
            subscribed: true,
            subscription_tier: tier,
            subscription_end: endDate.toISOString(),
            manual_override: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email" }
        );

      if (error) throw error;

      // Log admin action
      try {
        await supabase.rpc("log_admin_access", {
          p_action: "grant_beta_plan",
          p_target_user_id: user.user_id,
          p_resource_type: "subscribers",
          p_metadata: {
            tier,
            duration_days: durationDays,
            end_date: endDate.toISOString(),
          },
        });
      } catch (logErr) {
        console.error("Failed to log admin action:", logErr);
      }

      toast.success(`Plano ${tier} concedido para ${user.display_name || user.email} por ${durationDays} dias!`);
      onOpenChange(false);
      onUserUpdate?.();
    } catch (err) {
      console.error("Erro ao conceder plano:", err);
      toast.error("Erro ao conceder plano. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("subscribers")
        .update({
          subscribed: false,
          subscription_tier: null,
          subscription_end: null,
          manual_override: false,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.user_id)
        .eq("manual_override", true);

      if (error) throw error;

      // Log admin action
      try {
        await supabase.rpc("log_admin_access", {
          p_action: "revoke_beta_plan",
          p_target_user_id: user.user_id,
          p_resource_type: "subscribers",
        });
      } catch (logErr) {
        console.error("Failed to log admin action:", logErr);
      }

      toast.success(`Acesso beta removido de ${user.display_name || user.email}`);
      onOpenChange(false);
      onUserUpdate?.();
    } catch (err) {
      console.error("Erro ao revogar plano:", err);
      toast.error("Erro ao revogar plano.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Liberar Plano Beta
          </DialogTitle>
          <DialogDescription>
            Conceda acesso manual a um plano para <strong>{user.display_name || user.email}</strong>. 
            Este acesso não passa pelo Stripe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Plano</Label>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Essencial">Essencial (15 créditos/mês)</SelectItem>
                <SelectItem value="Premium">Premium (35 créditos/mês)</SelectItem>
                <SelectItem value="Elite">Elite (75 créditos/mês)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Duração (dias)</Label>
            <Input
              type="number"
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              min={1}
              max={365}
            />
            <p className="text-xs text-muted-foreground">
              Expira em: {new Date(Date.now() + durationDays * 86400000).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="destructive" onClick={handleRevoke} disabled={loading} className="sm:mr-auto">
            Revogar Acesso
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleGrant} disabled={loading}>
            {loading ? "Processando..." : "Conceder Acesso"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
