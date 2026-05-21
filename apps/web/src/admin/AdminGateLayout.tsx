/** @refresh reset */
import { AdminAuthGate } from '../auth/AdminAuthGate';
import { AdminShell } from './Shell';

/** Auth gate + studio shell; child routes render in `<Outlet />`. */
export function AdminGateLayout() {
  return (
    <AdminAuthGate
      allowedRoles={['super_admin', 'tenant_admin', 'admin']}
      forbiddenTitle="Admin access required"
      forbiddenSubtitle="The admin portal is restricted to platform admins."
    >
      <AdminShell />
    </AdminAuthGate>
  );
}
