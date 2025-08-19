import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditUserDialogProps {
  user: {
    id: string;
    user_id: string;
    display_name: string | null;
    role: string | null;
    subscription_tier: string;
    subscribed: boolean;
    email?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export function EditUserDialog({ user, open, onOpenChange, onUpdate }: EditUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState(user.display_name || "");
  const [role, setRole] = useState(user.role || "user");
  const [plan, setPlan] = useState(user.subscription_tier);
  const [subscribed, setSubscribed] = useState(user.subscribed);
  const { toast } = useToast();

  useEffect(() => {
    setDisplayName(user.display_name || "");
    setRole(user.role || "user");
    setPlan(user.subscription_tier);
    setSubscribed(user.subscribed);
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Atualizar perfil
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          role: role,
        })
        .eq("user_id", user.user_id);

      if (profileError) throw profileError;

      // Atualizar subscription se necessário
      if (plan !== user.subscription_tier || subscribed !== user.subscribed) {
        const { error: subscriptionError } = await supabase
          .from("subscribers")
          .upsert({
            email: user.email || '',
            user_id: user.user_id,
            subscription_tier: plan,
            subscribed: subscribed,
            subscription_end: subscribed ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
          }, {
            onConflict: "user_id"
          });

        if (subscriptionError) throw subscriptionError;
      }

      toast({
        title: "Usuário atualizado",
        description: "As alterações foram salvas com sucesso.",
      });

      onUpdate?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao atualizar usuário:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o usuário.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="displayName">Nome de Exibição</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nome do usuário"
            />
          </div>

          <div>
            <Label htmlFor="role">Função</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="plan">Plano</Label>
            <Select value={plan} onValueChange={setPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Gratuito">Gratuito</SelectItem>
                <SelectItem value="Essencial">Essencial</SelectItem>
                <SelectItem value="Premium">Premium</SelectItem>
                <SelectItem value="Elite">Elite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subscribed">Status da Assinatura</Label>
            <Select value={subscribed.toString()} onValueChange={(value) => setSubscribed(value === "true")}>
              <SelectTrigger>
                <SelectValue placeholder="Status da assinatura" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Ativo</SelectItem>
                <SelectItem value="false">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}