type Filter = { field: string; value: unknown };
type CollectionRef = { name: string; filters: Filter[] };
type DocumentRef = { collection: string; id: string };

export const database = {};
export const collection = (_db: unknown, name: string): CollectionRef => ({ name, filters: [] });
export const where = (field: string, _operator: "==", value: unknown): Filter => ({ field, value });
export const query = (ref: CollectionRef, ...filters: Filter[]): CollectionRef => ({ ...ref, filters });
export const doc = (_db: unknown, collectionName: string, id: string): DocumentRef => ({ collection: collectionName, id });
export const serverTimestamp = () => new Date().toISOString();

class SnapshotDocument {
  constructor(public id: string, private value: Record<string, unknown>) {}
  data(): any { return { ...this.value }; }
}

export async function getDocs(ref: CollectionRef) {
  const params = new URLSearchParams();
  for (const filter of ref.filters) params.append(filter.field, String(filter.value));
  const response = await fetch(`/api/data/${ref.name}?${params}`, { cache: "no-store" });
  if (!response.ok) throw new Error(await response.text());
  const values: any[] = await response.json();
  const docs: SnapshotDocument[] = values.map((value: any) => new SnapshotDocument(value.id || value.uid, value));
  return { docs, empty: docs.length === 0, forEach: (fn: (doc: SnapshotDocument) => void) => docs.forEach(fn) };
}

export async function addDoc(ref: CollectionRef, value: unknown) {
  const response = await fetch(`/api/data/${ref.name}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function setDoc(ref: DocumentRef, value: unknown, _options?: { merge?: boolean }) {
  const response = await fetch(`/api/data/${ref.collection}/${ref.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function deleteDoc(ref: DocumentRef) {
  const response = await fetch(`/api/data/${ref.collection}/${ref.id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(await response.text());
}

export const storage = {};
export const getStorage = () => storage;
export const ref = (_storage: unknown, path: string) => ({ path });
export async function uploadBytes(reference: { path: string }, file: File) {
  const response = await fetch("/api/storage/presign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contentType: file.type, size: file.size }) });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || "Não foi possível preparar o envio do PDF");
  }
  const { url, fields, key } = await response.json() as { url: string; fields: Record<string, string>; key: string };
  const form = new FormData();
  for (const [name, value] of Object.entries(fields)) form.append(name, value);
  form.append("file", file);
  const upload = await fetch(url, { method: "POST", body: form });
  if (!upload.ok) throw new Error("Falha ao enviar o PDF");
  return { ref: { ...reference, path: key } };
}
export async function getDownloadURL(reference: { path: string }) {
  const response = await fetch(`/api/storage/url?key=${encodeURIComponent(reference.path)}`);
  if (!response.ok) throw new Error(await response.text());
  return (await response.json()).url as string;
}
