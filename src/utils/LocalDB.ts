type KeyType = IDBValidKey;
type ValueType = any;

export default class LocalDB {
  private readonly dbName: string;

  private readonly objectStoreName: string;

  private db: IDBDatabase | undefined;

  constructor(name = 'db', storeName = 'store') {
    this.dbName = name;
    this.objectStoreName = storeName;
  }

  public getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }

      const request = window.indexedDB.open(this.dbName, 1);
      request.onsuccess = (event) => {
        // @ts-ignore
        this.db = event.target.result;
        resolve(this.db as IDBDatabase);
      };
      request.onupgradeneeded = (event) => {
        // @ts-ignore
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.objectStoreName)) {
          db.createObjectStore(this.objectStoreName);
        }
      };
      request.addEventListener('error', (event) => reject(event));
    });
  }

  public getDBStore(mode: IDBTransactionMode = 'readwrite'): Promise<IDBObjectStore> {
    return new Promise((resolve, reject) => {
      this.getDB()
        .then((db) => {
          resolve(db.transaction(this.objectStoreName, mode).objectStore(this.objectStoreName));
        })
        .catch(reject);
    });
  }

  public getItem(key: KeyType): Promise<ValueType> {
    return new Promise((resolve, reject) => {
      this.getDBStore('readonly')
        .then((db) => {
          const request = db.get(key);

          request.onsuccess = () => resolve(request.result);
          request.addEventListener('error', reject);
        })
        .catch(reject);
    });
  }

  public setItem(key: KeyType, value: ValueType): Promise<ValueType> {
    return new Promise((resolve, reject) => {
      this.getDBStore()
        .then((db) => {
          const request = db.put(value, key);

          request.onsuccess = () => resolve(value);
          request.addEventListener('error', reject);
        })
        .catch(reject);
    });
  }

  public removeItem(key: KeyType): Promise<KeyType> {
    return new Promise((resolve, reject) => {
      this.getDBStore()
        .then((db) => {
          const request = db.delete(key);

          request.onsuccess = () => resolve(key);
          request.addEventListener('error', reject);
        })
        .catch(reject);
    });
  }

  public keys(): Promise<KeyType[]> {
    return new Promise((resolve, reject) => {
      this.getDBStore('readonly')
        .then((db) => {
          const request = db.getAllKeys();

          request.onsuccess = () => resolve(request.result);
          request.addEventListener('error', reject);
        })
        .catch(reject);
    });
  }

  public clear(): Promise<KeyType> {
    return new Promise((resolve, reject) => {
      this.getDBStore()
        .then((db) => {
          const request = db.clear();

          request.onsuccess = () => resolve('clear');
          request.addEventListener('error', reject);
        })
        .catch(reject);
    });
  }
}

export const localDB = new LocalDB();
