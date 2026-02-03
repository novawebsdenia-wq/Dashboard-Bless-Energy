export const STATUS_OPTIONS = ['Pendiente', 'Contactado', 'En proceso', 'Cerrado', 'Cancelado'];
export const PRIORITY_OPTIONS_EMAIL = ['Baja', 'Normal', 'Media', 'Alta', 'Critica'];
export const PRIORITY_OPTIONS_DEFAULT = ['Baja', 'Normal', 'Alta', 'Urgente'];
export const CLIENT_STATUS_OPTIONS = ['Nuevo', 'Activo', 'En proceso', 'Inactivo'];

export const getOptionsForField = (header: string, pageType?: string): string[] => {
    const h = header.toLowerCase();
    if (h.includes('estado')) {
        if (pageType === 'clientes') {
            return CLIENT_STATUS_OPTIONS;
        }
        return STATUS_OPTIONS;
    }
    if (h.includes('prioridad')) {
        if (pageType === 'emails') {
            return PRIORITY_OPTIONS_EMAIL;
        }
        return PRIORITY_OPTIONS_DEFAULT;
    }
    return [];
};
