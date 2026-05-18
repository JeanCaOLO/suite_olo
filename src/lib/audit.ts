import { supabase } from '@/lib/supabase';

export type AuditAction =
  | 'role_changed'
  | 'permissions_updated'
  | 'permissions_reset';

export interface AuditLogEntry {
  action: AuditAction;
  target_user_id: string;
  target_user_name: string;
  target_user_email: string;
  details: Record<string, unknown>;
}

export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const adminId = sessionData?.session?.user?.id ?? null;

  const { error } = await supabase.from('audit_logs').insert({
    action: entry.action,
    performed_by: adminId,
    target_user_id: entry.target_user_id,
    target_user_name: entry.target_user_name,
    target_user_email: entry.target_user_email,
    details: entry.details,
  });

  if (error) {
    console.error('Error writing audit log:', error);
  }
}