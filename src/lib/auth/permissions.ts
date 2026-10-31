import type { UserRole } from "@/lib/api/auth";

// Qué puede hacer cada rol en el backstage. El admin consulta en solo lectura lo operativo de logística.
const PERMISSIONS = {
  "requests.manage": ["ADMIN"],
  "users.manage": ["ADMIN"],
  "resources.manage": ["ADMIN"],
  "calendar.global": ["ADMIN"],
  "logistics.operate": ["LOGISTICS"],
  "calendar.own": ["LOGISTICS"],
} as const satisfies Record<string, readonly UserRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: UserRole | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly UserRole[]).includes(role);
}

export type NavItem = { href: string; label: string; icon: string; permission?: Permission };

export const NAV_ITEMS: NavItem[] = [
  { href: "/panel", label: "Inicio", icon: "home" },
  { href: "/panel/solicitudes", label: "Solicitudes", icon: "inbox", permission: "requests.manage" },
  { href: "/panel/mis-solicitudes", label: "Mis solicitudes", icon: "clipboard", permission: "logistics.operate" },
  { href: "/panel/calendario", label: "Calendario", icon: "calendar" },
  { href: "/panel/usuarios", label: "Usuarios", icon: "users", permission: "users.manage" },
  { href: "/panel/recursos", label: "Recursos", icon: "box", permission: "resources.manage" },
  { href: "/panel/roles-operativos", label: "Roles operativos", icon: "tag", permission: "resources.manage" },
];

export function navFor(role: UserRole | undefined | null): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.permission || can(role, item.permission));
}

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador",
  LOGISTICS: "Logística",
};
