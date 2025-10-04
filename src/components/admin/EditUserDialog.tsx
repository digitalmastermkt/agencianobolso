import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { AlertTriangle } from "lucide-react";

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
  const { user: currentUser } = useAuth();
  const { isAdmin } = useUserRole();

  // Security checks
  const isEditingSelf = currentUser?.id === user.user_id;
  const originalRole = user.role || "user";
  const isRoleChange = role !== originalRole;
  const isElevatingToAdmin = role === "admin" && originalRole !== "admin";

  useEffect(() => {
    setDisplayName(user.display_name || "");
    setRole(user.role || "user");
    setPlan(user.subscription_tier);
    setSubscribed(user.subscribed);
  }, [user]);

  const validateSecurityConstraints = (): string | null => {
    // Prevent self-role modification
    if (isEditingSelf && isRoleChange) {
      return "Você não pode modificar sua própria função por questões de segurança.";
    }

    // Only admins can elevate to admin role
    if (isElevatingToAdmin && !isAdmin) {
      return "Apenas administradores podem promover outros usuários a administrador.";
    }

    return null;
  };

  const logSecurityEvent = async (action: string, details: any) => {
    try {
      await supabase.functions.invoke('log-security-event', {
        body: {
          action,
          target_user_id: user.user_id,
          details,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.warn('Failed to log security event:', error);
    }
  };

  const handleSave = async () => {
    // Security validation
    const securityError = validateSecurityConstraints();
    if (securityError) {
      toast({
        title: "Operação não permitida",
        description: securityError,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const changes: any = {};
      
      // Track changes for audit
      if (displayName !== (user.display_name || "")) {
        changes.display_name = { old: user.display_name, new: displayName };
      }
      if (isRoleChange) {
        changes.role = { old: originalRole, new: role };
      }

      // Log role changes before making them
      if (isRoleChange) {
        await logSecurityEvent('role_change_attempt', {
          target_user: user.user_id,
          old_role: originalRole,
          new_role: role,
          is_elevation: isElevatingToAdmin
        });
      }

      // Atualizar perfil (sem role, que agora está em user_roles)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
        })
        .eq("user_id", user.user_id);

      if (profileError) throw profileError;

      // Atualizar role na tabela user_roles se houver mudança
      if (isRoleChange) {
        // Primeiro, remover a role antiga
        const { error: deleteError } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", user.user_id);

        if (deleteError) throw deleteError;

        // Depois, inserir a nova role
        const { error: insertError } = await supabase
          .from("user_roles")
          .insert([{
            user_id: user.user_id,
            role: role as 'admin' | 'moderator' | 'user',
          }]);

        if (insertError) throw insertError;
      }

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

      // Log successful changes
      if (Object.keys(changes).length > 0) {
        await logSecurityEvent('user_profile_updated', {
          target_user: user.user_id,
          changes
        });
      }

      toast({
        title: "Usuário atualizado",
        description: "As alterações foram salvas com sucesso.",
      });

      onUpdate?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao atualizar usuário:", error);
      
      // Log failed attempt
      await logSecurityEvent('user_profile_update_failed', {
        target_user: user.user_id,
        error: error.message
      });

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
          {/* Security Warnings */}
          {isEditingSelf && (
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                Você está editando seu próprio perfil. Mudanças na função serão bloqueadas por segurança.
              </AlertDescription>
            </Alert>
          )}
          
          {isElevatingToAdmin && !isEditingSelf && (
            <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                <strong>Atenção:</strong> Você está promovendo este usuário a administrador. Esta ação será registrada no log de auditoria.
              </AlertDescription>
            </Alert>
          )}

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
            <Select value={role} onValueChange={setRole} disabled={isEditingSelf}>
              <SelectTrigger className={isEditingSelf ? "opacity-50 cursor-not-allowed" : ""}>
                <SelectValue placeholder="Selecione a função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
            {isEditingSelf && (
              <p className="text-sm text-muted-foreground mt-1">
                Você não pode alterar sua própria função
              </p>
            )}
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