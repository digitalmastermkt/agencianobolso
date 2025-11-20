import { useState } from "react";
import { MoreHorizontal, Edit, Key, MessageCircle, FileBarChart } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { EditUserDialog } from "./EditUserDialog";
import { UserReportDialog } from "./UserReportDialog";
import { ResetPasswordDialog } from "./ResetPasswordDialog";
import { supabase } from "@/integrations/supabase/client";

interface UserActionsMenuProps {
  user: {
    id: string;
    user_id: string;
    display_name: string | null;
    role: string | null;
    subscription_tier: string;
    subscribed: boolean;
    subscription_end?: string;
    email?: string;
    phone?: string;
  };
  onUserUpdate?: () => void;
}

export function UserActionsMenu({ user, onUserUpdate }: UserActionsMenuProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);

  const handleSendWhatsApp = async () => {
    if (user.phone) {
      const message = encodeURIComponent(
        `Olá ${user.display_name || 'usuário'}, como posso ajudá-lo?`
      );
      window.open(`https://wa.me/${user.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
      
      // Log admin action
      try {
        await supabase.rpc('log_admin_access', {
          p_action: 'send_whatsapp',
          p_target_user_id: user.user_id,
          p_resource_type: 'profiles',
          p_metadata: { phone: user.phone }
        });
      } catch (error) {
        console.error("Failed to log admin action:", error);
      }
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar Usuário
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setResetPasswordOpen(true)}>
            <Key className="mr-2 h-4 w-4" />
            Redefinir Senha
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSendWhatsApp} disabled={!user.phone}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Enviar WhatsApp
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setReportOpen(true)}>
            <FileBarChart className="mr-2 h-4 w-4" />
            Relatório
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserDialog
        user={user}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdate={onUserUpdate}
      />

      <UserReportDialog
        user={user}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />

      <ResetPasswordDialog
        user={user}
        open={resetPasswordOpen}
        onOpenChange={setResetPasswordOpen}
      />
    </>
  );
}