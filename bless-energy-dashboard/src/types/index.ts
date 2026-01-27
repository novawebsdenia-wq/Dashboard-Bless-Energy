// Email types (hojas: mails, chats, semanal, total)
export interface Email {
  id: string;
  fecha?: string;
  remitente?: string;
  asunto?: string;
  categoria?: string;
  estado?: string;
  [key: string]: string | undefined;
}

// Calculadora Web / Leads
export interface Lead {
  id: string;
  fecha?: string;
  nombre?: string;
  email?: string;
  telefono?: string;
  localidad?: string;
  tipoInstalacion?: string;
  presupuesto?: string;
  estado?: string;
  [key: string]: string | undefined;
}

// Formulario Web
export interface FormularioCliente {
  id: string;
  fecha?: string;
  nombre?: string;
  email?: string;
  telefono?: string;
  localidad?: string;
  prioridadRyo?: string;
  presupuesto?: string;
  estado?: string;
  origen?: string;
  [key: string]: string | undefined;
}

// Clientes
export interface Cliente {
  id: string;
  fecha?: string;
  nombre?: string;
  email?: string;
  telefono?: string;
  localidad?: string;
  direccion?: string;
  prioridad?: string;
  presupuesto?: string;
  mensaje?: string;
  estado?: string;
  origen?: string;
  [key: string]: string | undefined;
}

// Generic data row for dynamic handling
export interface DataRow {
  id: string;
  rowIndex: number;
  [key: string]: string | number | undefined;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Dashboard stats
export interface DashboardStats {
  totalEmails: number;
  totalLeads: number;
  totalClientes: number;
  totalFormulario: number;
  leadsPendientes: number;
  clientesNuevos: number;
}

// Notification type
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Filter types
export interface FilterOptions {
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
  estado?: string;
  origen?: string;
}
