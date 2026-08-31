const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    "registry.view",
    "clients.view", "clients.create", "clients.update",
    "enquiries.view", "enquiries.create", "enquiries.update",
    "staff.view", "staff.manage",
    "reports.view",
    "field_leads.create", "field_leads.view", "field_leads.view_all",
    "field_leads.update", "field_leads.assign",
    "followups.view", "followups.create", "followups.update",
    "loans.view", "loans.create", "loans.update", "loans.track",
  ],
  supervisor: [
    "registry.view",
    "clients.view", "clients.create", "clients.update",
    "enquiries.view", "enquiries.create", "enquiries.update",
    "reports.view",
    "field_leads.create", "field_leads.view", "field_leads.view_all",
    "field_leads.update", "field_leads.assign",
    "followups.view", "followups.create", "followups.update",
    "loans.view", "loans.update", "loans.track",
  ],
  data_entrant: [
    "registry.view",
    "clients.view", "clients.create", "clients.update",
    "enquiries.view", "enquiries.create",
    "loans.view", "loans.create",
  ],
  field_marketer: [
    "registry.view",
    "field_leads.create", "field_leads.view", "field_leads.update",
    "followups.view", "followups.create", "followups.update",
  ],
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  supervisor: "Supervisor",
  data_entrant: "Data Entrant",
  field_marketer: "Field Marketer",
};

export type StaffRole = keyof typeof ROLE_PERMISSIONS;

export function getPermissionsForRole(role: string): string[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role: string, permission: string): boolean {
  return getPermissionsForRole(role).includes(permission);
}

export function hasAnyPermission(role: string, permissions: string[]): boolean {
  const rolePerms = getPermissionsForRole(role);
  return permissions.some((p) => rolePerms.includes(p));
}

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

export function isValidRole(role: string): role is StaffRole {
  return role in ROLE_PERMISSIONS;
}

export function getNavItemsForRole(role: string): string[] {
  const items: string[] = ["dashboard"];
  if (hasPermission(role, "clients.view")) items.push("clients");
  if (hasPermission(role, "enquiries.view")) items.push("enquiries");
  if (hasPermission(role, "field_leads.view")) items.push("field_leads");
  if (hasPermission(role, "followups.view")) items.push("follow-ups");
  if (hasPermission(role, "loans.view")) items.push("loans");
  if (hasPermission(role, "reports.view")) items.push("reports");
  if (hasPermission(role, "staff.view")) items.push("staff");
  return items;
}
