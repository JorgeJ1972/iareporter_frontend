import { FileUtils } from "./FileUtils";

export class HandlerStorage<T> {
  private localUserId: string;

  constructor() {
    this.localUserId = "usuarioLocal"; // Aquí falta agregar el usuario real
  }

  find(name: string, defaultValue: T, encode: boolean = false, unique: boolean = true): T {
    const storageKey = this.createKey(name, unique);

    try {
      const data = localStorage.getItem(storageKey);
      if (!data) {
        this.save(name, defaultValue, encode, unique);
        return defaultValue;
      }

      return encode ? JSON.parse(FileUtils.B64ToUtf8(data)) : JSON.parse(data);
    } catch (error) {
      console.error(`Error al obtener ${storageKey} del localStorage`, error);
      return defaultValue;
    }
  }

  save(name: string, value: T, encode: boolean = false, unique: boolean = true): void {
    const storageKey = this.createKey(name, unique);

    try {
      const data = encode ? FileUtils.Utf8ToB64(JSON.stringify(value)) : JSON.stringify(value);
      localStorage.setItem(storageKey, data);
    } catch (error) {
      console.error(`Error al guardar ${storageKey} en localStorage`, error);
    }
  }

  remove(name: string, unique: boolean = true): void {
    const storageKey = this.createKey(name, unique);
    localStorage.removeItem(storageKey);
  }

  private createKey(name: string, unique: boolean): string {
    return unique ? name : `${this.localUserId}_${name}`;
  }
}