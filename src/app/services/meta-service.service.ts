import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { Meta } from '../models/meta.model';
import { environment } from '../../environments/environment';

interface FirestoreValue {
  stringValue?: string;
  timestampValue?: string;
}

interface FirestoreDocument {
  name?: string;
  fields?: Record<string, FirestoreValue>;
}

@Injectable({
  providedIn: 'root'
})
export class MetaService {
  private readonly projectId = environment.firebase.projectId;
  private readonly apiKey = environment.firebase.apiKey;
  private readonly collectionPath = 'metas';
  private readonly baseUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/${this.collectionPath}`;

  getMetas(): Observable<Meta[]> {
    this.assertFirebaseConfig();
    return from(this.fetchMetas());
  }

  agregarMeta(meta: Meta): Promise<string> {
    this.assertFirebaseConfig();
    const payload = {
      fields: this.toFirestoreFields({
        ...meta,
        fechaCreacion: new Date()
      })
    };

    return fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(async (response: Response) => {
        if (!response.ok) {
          throw new Error(await response.text());
        }

        const data = (await response.json()) as FirestoreDocument;
        return this.extractDocumentId(data.name);
      });
  }

  eliminarMeta(id: string): Promise<void> {
    this.assertFirebaseConfig();
    return fetch(`${this.baseUrl}/${id}?key=${this.apiKey}`, {
      method: 'DELETE'
    })
      .then(async (response: Response) => {
        if (!response.ok) {
          throw new Error(await response.text());
        }
      });
  }

  private async fetchMetas(): Promise<Meta[]> {
    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`);

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = (await response.json()) as { documents?: FirestoreDocument[] };
    const documents = data.documents ?? [];

    return documents
      .map((document) => this.mapDocumentToMeta(document))
      .sort((left, right) => {
        const leftTime = left.fechaCreacion ? new Date(left.fechaCreacion).getTime() : 0;
        const rightTime = right.fechaCreacion ? new Date(right.fechaCreacion).getTime() : 0;
        return rightTime - leftTime;
      });
  }

  private mapDocumentToMeta(document: FirestoreDocument): Meta {
    const fields = document.fields ?? {};
    const id = this.extractDocumentId(document.name);

    return {
      id,
      titulo: fields['titulo']?.stringValue ?? '',
      descripcion: fields['descripcion']?.stringValue ?? '',
      estado: (fields['estado']?.stringValue ?? 'pendiente') as Meta['estado'],
      prioridad: (fields['prioridad']?.stringValue ?? 'media') as Meta['prioridad'],
      fechaCreacion: fields['fechaCreacion']?.timestampValue ? new Date(fields['fechaCreacion']!.timestampValue as string) : undefined,
      fechaVencimiento: fields['fechaVencimiento']?.timestampValue ? new Date(fields['fechaVencimiento']!.timestampValue as string) : undefined
    };
  }

  private toFirestoreFields(meta: Meta): Record<string, FirestoreValue> {
    return {
      titulo: { stringValue: meta.titulo },
      descripcion: { stringValue: meta.descripcion ?? '' },
      estado: { stringValue: meta.estado },
      prioridad: { stringValue: meta.prioridad },
      fechaCreacion: { timestampValue: (meta.fechaCreacion ?? new Date()).toISOString() }
    };
  }

  private extractDocumentId(name?: string): string {
    if (!name) {
      return '';
    }

    return name.split('/').pop() ?? '';
  }

  private assertFirebaseConfig(): void {
    if (!this.projectId || !this.apiKey) {
      throw new Error('Falta configurar Firebase en los archivos de environment.');
    }
  }
}
