export interface Meta {
  id?: string;
  titulo: string;
  descripcion: string;
  estado: 'pendiente' | 'en progreso' | 'completada';
  fechaCreacion?: Date;
  fechaVencimiento?: Date;
  prioridad: 'baja' | 'media' | 'alta';
}
