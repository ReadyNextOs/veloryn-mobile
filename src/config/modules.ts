// Mobile module catalogue — port z frontend/src/config/navigation/navigationConfig.ts.
// Każdy moduł ma slug (segment URL na mobile), desktopPath (referencja),
// labelKey (i18n), Lucide icon (z desktopu) + MCI icon (zmapowane).
// hasNativeImpl=true tylko dla modułów z natywnym ekranem RN.

import { mapIcon } from '@/config/iconMap';

export interface ModuleConfig {
  slug: string;
  desktopPath: string;
  labelKey: string;
  icon: string; // MaterialCommunityIcons
  iconLucide: string;
  permissions?: string[];
  licenseApp?: string;
  groupKey?: string;
  hasNativeImpl: boolean;
  nativeRoute?: string; // jeśli hasNativeImpl=true
}

export interface ModuleGroupConfig {
  key: string;
  labelKey: string;
  icon: string; // MaterialCommunityIcons
  iconLucide: string;
  modules: string[]; // sluggi
}

function m(
  slug: string,
  desktopPath: string,
  labelKey: string,
  iconLucide: string,
  opts: Partial<Omit<ModuleConfig, 'slug' | 'desktopPath' | 'labelKey' | 'icon' | 'iconLucide'>> = {},
): ModuleConfig {
  return {
    slug,
    desktopPath,
    labelKey,
    icon: mapIcon(iconLucide),
    iconLucide,
    hasNativeImpl: false,
    ...opts,
  };
}

export const MODULES: ModuleConfig[] = [
  // Standalone — DMS / Sprawy
  m('documents', '/documents', 'navigation.documents', 'FileText'),
  m('correspondence', '/korespondencja', 'navigation.correspondence', 'Inbox'),
  m('cloud-file', '/cloud-file', 'navigation.files', 'Cloud'),
  m('cases', '/cases', 'navigation.cases', 'FolderKanban', { permissions: ['cases.view'] }),
  m('contracts', '/umowy', 'navigation.contracts', 'FileSignature', { permissions: ['contracts.view'], licenseApp: 'contracts' }),

  // Projekty i zadania
  m('projects', '/projekty', 'navigation.projects', 'Rocket', { permissions: ['crm.view'] }),
  m('tasks', '/zadania', 'navigation.tasks', 'ListChecks'),
  m('kanban', '/kanban', 'navigation.kanban', 'SquareKanban', { permissions: ['kanban.view'] }),
  m('polls', '/polls', 'navigation.polls', 'Vote'),
  m('spaces', '/spaces', 'navigation.spaces', 'LayoutGrid'),

  // Komunikacja
  m('mail', '/mail', 'navigation.mail', 'Mail', {
    permissions: ['mail.view'],
    hasNativeImpl: true,
    nativeRoute: '/(app)/(tabs)/mail',
  }),
  m('calendar', '/calendar', 'navigation.calendar', 'Calendar', { permissions: ['calendar.view'] }),
  m('live-chat', '/live-chat', 'navigation.liveChat', 'MessageSquareText', {
    permissions: ['chat_widget.manage', 'chat_widget.supervisor'],
  }),
  m('messenger', '/messenger', 'tabs.messenger', 'MessageSquareText', {
    hasNativeImpl: true,
    nativeRoute: '/(app)/(tabs)/messenger',
  }),

  // CRM & Klienci
  m('crm', '/crm', 'navigation.crm', 'Target', { permissions: ['crm.view'], licenseApp: 'crm' }),
  m('clients', '/clients', 'navigation.contractors', 'Users', { permissions: ['contacts.view'], licenseApp: 'crm' }),
  m('contact-persons', '/contact-persons', 'navigation.contactPersons', 'Contact', {
    permissions: ['contacts.view'],
    licenseApp: 'crm',
  }),
  m('products', '/products', 'navigation.products', 'Package', { permissions: ['products.view'], licenseApp: 'service' }),

  // Service & SLA
  m('service-contracts', '/umowy-serwisowe', 'navigation.serviceAndSla', 'Wrench', {
    permissions: ['service_contracts.view'],
    licenseApp: 'service',
  }),
  m('tickets', '/tickets', 'navigation.helpManagement', 'TicketCheck', {
    permissions: ['tickets.view'],
    licenseApp: 'service',
  }),
  m('equipment', '/equipment', 'navigation.equipment', 'HardDrive', {
    permissions: ['equipment.view'],
    licenseApp: 'service',
  }),
  m('equipment-units', '/equipment/units', 'navigation.equipmentUnits', 'Monitor', {
    permissions: ['equipment.view'],
    licenseApp: 'service',
  }),

  // IT / Remote Support
  m('rustdesk', '/it/rustdesk', 'navigation.rustdesk', 'MonitorSmartphone', {
    permissions: ['remote_support.view', 'remote_support.connect'],
    licenseApp: 'service',
  }),

  // Wiedza i raporty
  m('wiki', '/wiki', 'navigation.wiki', 'BookMarked'),
  m('reports', '/reports', 'navigation.reports', 'BarChart3', { permissions: ['reports.view'], licenseApp: 'reports' }),

  // Handel
  m('sales-orders', '/sprzedaz/zamowienia', 'navigation.salesOrders', 'ClipboardPen', {
    permissions: ['finance.sales_orders.view'],
    licenseApp: 'trade',
  }),
  m('crm-quotes', '/crm/quotes', 'navigation.quotes', 'FileSpreadsheet', {
    permissions: ['crm.view'],
    licenseApp: 'trade',
  }),
  m('sales-proformas', '/sprzedaz/proformy', 'navigation.proformas', 'FileBadge', {
    permissions: ['sales_invoices.view'],
    licenseApp: 'trade',
  }),
  m('purchase-requests', '/purchase-requests', 'navigation.purchaseRequests', 'ShoppingCart', {
    permissions: ['purchase_requests.view'],
    licenseApp: 'trade',
  }),
  m('purchase-orders', '/zakupy/zamowienia', 'navigation.purchaseOrders', 'ClipboardList', {
    permissions: ['stock.purchase_orders.view'],
    licenseApp: 'trade',
  }),
  m('purchase-receipts', '/magazyn/przyjecia', 'navigation.purchaseReceipts', 'PackageCheck', {
    permissions: ['finance.stock_pickings.view'],
    licenseApp: 'trade',
  }),

  // Magazyn
  m('warehouse-list', '/magazyn/lista', 'navigation.warehouses', 'Warehouse', {
    permissions: ['finance.warehouses.view'],
    licenseApp: 'warehouse',
  }),
  m('warehouse-documents', '/magazyn/dokumenty', 'navigation.stockPickings', 'PackageSearch', {
    permissions: ['finance.stock_pickings.view'],
    licenseApp: 'warehouse',
  }),
  m('warehouse-stock', '/magazyn/stany', 'navigation.stockQuants', 'Boxes', {
    permissions: ['finance.stock_pickings.view'],
    licenseApp: 'warehouse',
  }),
  m('warehouse-locations', '/magazyn/lokalizacje', 'navigation.stockLocations', 'MapPin', {
    permissions: ['finance.warehouses.view'],
    licenseApp: 'warehouse',
  }),
  m('warehouse-lots', '/magazyn/partie', 'navigation.stockLots', 'Tags', {
    permissions: ['finance.stock_pickings.view'],
    licenseApp: 'warehouse',
  }),
  m('warehouse-inventory', '/magazyn/inwentaryzacja', 'navigation.stockInventory', 'ScanLine', {
    permissions: ['finance.warehouses.view'],
    licenseApp: 'warehouse',
  }),

  // Finanse
  m('sales-invoices', '/sprzedaz/faktury', 'navigation.salesInvoices', 'ReceiptText', {
    permissions: ['sales_invoices.view'],
    licenseApp: 'trade',
  }),
  m('purchase-invoices', '/zakupy/faktury', 'navigation.purchaseInvoices', 'Receipt', {
    permissions: ['invoices.view'],
    licenseApp: 'trade',
  }),
  m('payments', '/platnosci', 'navigation.payments', 'CreditCard', {
    permissions: ['payments.view'],
    licenseApp: 'finance',
  }),
  m('finance-analytics', '/finanse', 'navigation.financeAnalytics', 'PiggyBank', {
    permissions: ['invoices.view'],
    licenseApp: 'finance',
  }),
  m('budget', '/budget', 'navigation.budget', 'Wallet', { permissions: ['budgets.view'], licenseApp: 'finance' }),
  m('accounting', '/ksiegowosc', 'navigation.accounting', 'Calculator', {
    permissions: ['accounting.view'],
    licenseApp: 'accounting',
  }),

  // HR
  m('leave', '/urlopy', 'navigation.leaveRequests', 'Palmtree', { permissions: ['leave.view'], licenseApp: 'hr' }),
  m('delegations', '/delegations', 'navigation.delegations', 'Plane', {
    permissions: ['delegation.read'],
    licenseApp: 'hr',
  }),
  m('leave-calendar', '/urlopy/kalendarz', 'navigation.leaveCalendar', 'CalendarDays', {
    permissions: ['leave.view'],
    licenseApp: 'hr',
  }),
  m('leave-profiles', '/urlopy/profile', 'navigation.employeeProfiles', 'UserCircle', {
    permissions: ['leave.view'],
    licenseApp: 'hr',
  }),
  m('fleet', '/fleet', 'navigation.fleet', 'Car', { permissions: ['fleet.view'], licenseApp: 'fleet' }),

  // Admin
  m('settings', '/admin/settings', 'navigation.settings', 'Settings'),
];

export const MODULE_GROUPS: ModuleGroupConfig[] = [
  {
    key: 'communication',
    labelKey: 'navigation.groups.communication',
    iconLucide: 'Mail',
    icon: mapIcon('Mail'),
    modules: ['mail', 'calendar', 'messenger', 'live-chat'],
  },
  {
    key: 'dms',
    labelKey: 'navigation.groups.dms',
    iconLucide: 'FileText',
    icon: mapIcon('FileText'),
    modules: ['documents', 'correspondence', 'cloud-file', 'cases', 'contracts', 'wiki'],
  },
  {
    key: 'projects',
    labelKey: 'navigation.groups.projects',
    iconLucide: 'FolderGit2',
    icon: mapIcon('FolderGit2'),
    modules: ['projects', 'tasks', 'kanban', 'polls', 'spaces'],
  },
  {
    key: 'crm-group',
    labelKey: 'navigation.groups.crmClients',
    iconLucide: 'Target',
    icon: mapIcon('Target'),
    modules: ['crm', 'clients', 'contact-persons', 'products'],
  },
  {
    key: 'service',
    labelKey: 'navigation.groups.service',
    iconLucide: 'Wrench',
    icon: mapIcon('Wrench'),
    modules: ['service-contracts', 'tickets', 'equipment', 'equipment-units'],
  },
  {
    key: 'it',
    labelKey: 'navigation.groups.it',
    iconLucide: 'MonitorSmartphone',
    icon: mapIcon('MonitorSmartphone'),
    modules: ['rustdesk'],
  },
  {
    key: 'trade',
    labelKey: 'navigation.groups.trade',
    iconLucide: 'ShoppingBag',
    icon: mapIcon('ShoppingBag'),
    modules: [
      'sales-orders',
      'crm-quotes',
      'sales-proformas',
      'purchase-requests',
      'purchase-orders',
      'purchase-receipts',
    ],
  },
  {
    key: 'warehouse',
    labelKey: 'navigation.groups.warehouse',
    iconLucide: 'Warehouse',
    icon: mapIcon('Warehouse'),
    modules: [
      'warehouse-list',
      'warehouse-documents',
      'warehouse-stock',
      'warehouse-locations',
      'warehouse-lots',
      'warehouse-inventory',
    ],
  },
  {
    key: 'finance',
    labelKey: 'navigation.groups.finance',
    iconLucide: 'PiggyBank',
    icon: mapIcon('PiggyBank'),
    modules: ['sales-invoices', 'purchase-invoices', 'payments', 'finance-analytics', 'budget', 'accounting'],
  },
  {
    key: 'hr',
    labelKey: 'navigation.groups.hrAssets',
    iconLucide: 'Briefcase',
    icon: mapIcon('Briefcase'),
    modules: ['leave', 'delegations', 'leave-calendar', 'leave-profiles', 'fleet'],
  },
];

export function getModuleBySlug(slug: string): ModuleConfig | undefined {
  return MODULES.find((m) => m.slug === slug);
}

export function getModulesInGroup(groupKey: string): ModuleConfig[] {
  const group = MODULE_GROUPS.find((g) => g.key === groupKey);
  if (!group) return [];
  return group.modules
    .map((slug) => getModuleBySlug(slug))
    .filter((m): m is ModuleConfig => m !== undefined);
}

export function getStandaloneModules(): ModuleConfig[] {
  const groupedSlugs = new Set(MODULE_GROUPS.flatMap((g) => g.modules));
  return MODULES.filter((m) => !groupedSlugs.has(m.slug) && m.slug !== 'settings');
}
