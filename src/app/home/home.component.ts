import { Component, OnInit } from '@angular/core';
import { Meta } from '../models/meta.model';
import { MetaService } from '../services/meta-service.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  metas: Meta[] = [];
  nuevaMeta: Meta = {
    titulo: '',
    descripcion: '',
    estado: 'pendiente',
    prioridad: 'media'
  };
  mostrarFormulario = false;
  cargando = false;
  mensaje = '';

  constructor(private metaService: MetaService) {}

  ngOnInit(): void {
    this.cargarMetas();
  }

  /**
   * Carga todas las metas desde Firestore
   */
  cargarMetas(): void {
    this.cargando = true;
    this.metaService.getMetas().subscribe({
      next: (metas: Meta[]) => {
        this.metas = metas;
        this.cargando = false;
      },
      error: (error: unknown) => {
        console.error('Error al cargar metas:', error);
        this.mensaje = 'Error al cargar las metas';
        this.cargando = false;
      }
    });
  }

  /**
   * Agrega una nueva meta a Firestore
   */
  agregarMeta(): void {
    if (!this.nuevaMeta.titulo.trim()) {
      this.mensaje = 'El título es requerido';
      return;
    }

    this.cargando = true;
    this.metaService.agregarMeta(this.nuevaMeta).then(() => {
      this.mensaje = 'Meta agregada correctamente';
      this.nuevaMeta = {
        titulo: '',
        descripcion: '',
        estado: 'pendiente',
        prioridad: 'media'
      };
      this.mostrarFormulario = false;
      this.cargando = false;
      setTimeout(() => (this.mensaje = ''), 3000);
    }).catch((error: unknown) => {
      console.error('Error al agregar meta:', error);
      this.mensaje = 'Error al agregar la meta';
      this.cargando = false;
    });
  }

  /**
   * Elimina una meta de Firestore
   */
  eliminarMeta(id: string | undefined): void {
    if (!id) return;

    if (confirm('¿Está seguro de que desea eliminar esta meta?')) {
      this.cargando = true;
      this.metaService.eliminarMeta(id).then(() => {
        this.mensaje = 'Meta eliminada correctamente';
        this.cargando = false;
        setTimeout(() => (this.mensaje = ''), 3000);
      }).catch((error: unknown) => {
        console.error('Error al eliminar meta:', error);
        this.mensaje = 'Error al eliminar la meta';
        this.cargando = false;
      });
    }
  }

  /**
   * Alterna la visualización del formulario
   */
  toggleFormulario(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.nuevaMeta = {
        titulo: '',
        descripcion: '',
        estado: 'pendiente',
        prioridad: 'media'
      };
    }
  }
}
