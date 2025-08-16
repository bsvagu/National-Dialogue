export function isUnauthorizedError(error: Error): boolean {
  return /^401: /.test(error.message);
}

export function getAuthToken(): string | null {
  return localStorage.getItem("accessToken");
}

export function hasPermission(userRoles: string[], requiredPermission: string): boolean {
  // SuperAdmin has all permissions
  if (userRoles.includes("SuperAdmin")) {
    return true;
  }

  // Basic permission mapping
  const rolePermissions: Record<string, string[]> = {
    Admin: ["manage_users", "manage_departments", "view_analytics", "manage_settings"],
    Analyst: ["view_analytics", "export_data"],
    Moderator: ["review_submissions", "manage_cases"],
    DeptOfficer: ["manage_assigned_cases", "view_department_data"],
  };

  return userRoles.some(role => 
    rolePermissions[role]?.includes(requiredPermission)
  );
}
