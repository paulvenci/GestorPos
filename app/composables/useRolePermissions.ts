export type RoleKey = 'admin' | 'supervisor' | 'cajero'
export type SectionKey =
  | 'dashboard'
  | 'pos'
  | 'caja'
  | 'inventario'
  | 'ajuste_stock'
  | 'categorias'
  | 'reportes'
  | 'configuracion'

export type RolePermissionsMap = Record<RoleKey, SectionKey[]>

const ALL_SECTIONS: SectionKey[] = [
  'dashboard',
  'pos',
  'caja',
  'inventario',
  'ajuste_stock',
  'categorias',
  'reportes',
  'configuracion'
]

export function getDefaultRolePermissions(): RolePermissionsMap {
  return {
    admin: [...ALL_SECTIONS],
    supervisor: ['dashboard', 'pos', 'caja', 'inventario', 'ajuste_stock', 'categorias', 'reportes'],
    cajero: ['dashboard', 'pos', 'caja']
  }
}

function uniqueSections(list: unknown): SectionKey[] {
  const defaults = new Set<SectionKey>(ALL_SECTIONS)
  if (!Array.isArray(list)) return []
  const filtered = list.filter((s): s is SectionKey => typeof s === 'string' && defaults.has(s as SectionKey))
  return Array.from(new Set(filtered))
}

export function normalizeRolePermissions(input: unknown): RolePermissionsMap {
  const defaults = getDefaultRolePermissions()
  if (!input || typeof input !== 'object') return defaults

  const data = input as Record<string, unknown>
  const admin = uniqueSections(data.admin).length ? uniqueSections(data.admin) : defaults.admin
  if (!admin.includes('configuracion')) admin.push('configuracion')
  if (!admin.includes('dashboard')) admin.push('dashboard')
  return {
    admin,
    supervisor: uniqueSections(data.supervisor).length ? uniqueSections(data.supervisor) : defaults.supervisor,
    cajero: uniqueSections(data.cajero).length ? uniqueSections(data.cajero) : defaults.cajero
  }
}

export function getSectionFromPath(path: string): SectionKey | null {
  if (path === '/') return 'dashboard'
  if (path.startsWith('/pos')) return 'pos'
  if (path.startsWith('/caja')) return 'caja'
  if (path.startsWith('/admin/productos')) return 'inventario'
  if (path.startsWith('/admin/ajuste-stock')) return 'ajuste_stock'
  if (path.startsWith('/admin/categorias')) return 'categorias'
  if (path.startsWith('/admin/reportes')) return 'reportes'
  if (path.startsWith('/admin/configuracion')) return 'configuracion'
  return null
}

export function canAccessSection(
  role: string | null | undefined,
  section: SectionKey,
  permissions: RolePermissionsMap
): boolean {
  const r = (role || 'cajero') as RoleKey
  const allowed = permissions[r] || permissions.cajero
  return allowed.includes(section)
}

export function getFallbackRouteForRole(role: string | null | undefined, permissions: RolePermissionsMap): string {
  const r = (role || 'cajero') as RoleKey
  const allowed = permissions[r] || permissions.cajero
  if (allowed.includes('dashboard')) return '/'
  if (allowed.includes('pos')) return '/pos'
  if (allowed.includes('caja')) return '/caja'
  return '/login'
}
