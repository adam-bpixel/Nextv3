import fs from 'node:fs';
import path from 'node:path';
import type { Db } from 'mongodb';
import config from './config';
import { isRecord } from './json';

export interface Entry {
  key: string;
  value: unknown;
}

export interface Store {
  connect(): Promise<void>;
  get(collection: string, key: string): Promise<unknown>;
  set(collection: string, key: string, value: unknown): Promise<void>;
  delete(collection: string, key: string): Promise<void>;
  all(collection: string): Promise<Entry[]>;
  top(collection: string, field: string, limit: number): Promise<Entry[]>;
  flush(): Promise<void>;
}

type Collections = Record<string, Record<string, unknown>>;

const JSON_WRITE_BATCH_MS = 500;

function numericField(value: unknown, field: string): number | null {
  if (!isRecord(value)) return null;
  const fieldValue = value[field];
  return typeof fieldValue === 'number' ? fieldValue : null;
}

function parseCollections(text: string): Collections | null {
  const parsed: unknown = JSON.parse(text);
  if (!isRecord(parsed)) return null;
  const collections: Collections = {};
  for (const [name, entries] of Object.entries(parsed)) {
    if (!isRecord(entries)) return null;
    collections[name] = { ...entries };
  }
  return collections;
}

export class JsonStore implements Store {
  private data: Collections = {};
  private pendingWrite: NodeJS.Timeout | null = null;

  constructor(private readonly file: string) {}

  async connect(): Promise<void> {
    this.data = this.readFile();
    console.log(`Storage: ${path.relative(config.root, this.file)} (set MONGODB_URI to use MongoDB)`);
    return Promise.resolve();
  }

  private readFile(): Collections {
    if (!fs.existsSync(this.file)) return {};
    const text = fs.readFileSync(this.file, 'utf8');
    let collections: Collections | null = null;
    try {
      collections = parseCollections(text);
    } catch {
      collections = null;
    }
    if (collections) return collections;
    const backup = `${this.file}.corrupt-${Date.now()}`;
    fs.renameSync(this.file, backup);
    console.error(`Storage: ${this.file} was not valid JSON; it was moved to ${backup} and an empty store was started.`);
    return {};
  }

  private collection(name: string): Record<string, unknown> {
    const existing = this.data[name];
    if (existing) return existing;
    const created: Record<string, unknown> = {};
    this.data[name] = created;
    return created;
  }

  private scheduleWrite(): void {
    if (this.pendingWrite) return;
    this.pendingWrite = setTimeout(() => this.writeNow(), JSON_WRITE_BATCH_MS);
  }

  private writeNow(): void {
    if (this.pendingWrite) clearTimeout(this.pendingWrite);
    this.pendingWrite = null;
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const temporary = `${this.file}.tmp`;
    fs.writeFileSync(temporary, JSON.stringify(this.data));
    fs.renameSync(temporary, this.file);
  }

  async get(collection: string, key: string): Promise<unknown> {
    return Promise.resolve(this.data[collection]?.[key]);
  }

  async set(collection: string, key: string, value: unknown): Promise<void> {
    this.collection(collection)[key] = value;
    this.scheduleWrite();
    return Promise.resolve();
  }

  async delete(collection: string, key: string): Promise<void> {
    const entries = this.data[collection];
    if (entries) Reflect.deleteProperty(entries, key);
    this.scheduleWrite();
    return Promise.resolve();
  }

  async all(collection: string): Promise<Entry[]> {
    return Promise.resolve(Object.entries(this.data[collection] ?? {}).map(([key, value]) => ({ key, value })));
  }

  async top(collection: string, field: string, limit: number): Promise<Entry[]> {
    const ranked = (await this.all(collection))
      .map((entry) => ({ entry, score: numericField(entry.value, field) }))
      .filter((item): item is { entry: Entry; score: number } => item.score !== null)
      .sort((a, b) => b.score - a.score);
    return ranked.slice(0, limit).map((item) => item.entry);
  }

  async flush(): Promise<void> {
    if (this.pendingWrite) this.writeNow();
    return Promise.resolve();
  }
}

interface StoredDocument {
  _id: string;
  value: unknown;
}

export class MongoStore implements Store {
  private database: Db | null = null;

  constructor(
    private readonly uri: string,
    private readonly name: string,
  ) {}

  async connect(): Promise<void> {
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(this.uri);
    await client.connect();
    this.database = client.db(this.name);
    console.log(`Storage: MongoDB database "${this.name}"`);
  }

  private documents(collection: string) {
    if (!this.database) throw new Error('MongoStore used before connect()');
    return this.database.collection<StoredDocument>(collection);
  }

  async get(collection: string, key: string): Promise<unknown> {
    const document = await this.documents(collection).findOne({ _id: key });
    return document?.value;
  }

  async set(collection: string, key: string, value: unknown): Promise<void> {
    await this.documents(collection).updateOne({ _id: key }, { $set: { value } }, { upsert: true });
  }

  async delete(collection: string, key: string): Promise<void> {
    await this.documents(collection).deleteOne({ _id: key });
  }

  async all(collection: string): Promise<Entry[]> {
    const documents = await this.documents(collection).find().toArray();
    return documents.map((document) => ({ key: document._id, value: document.value }));
  }

  async top(collection: string, field: string, limit: number): Promise<Entry[]> {
    const path = `value.${field}`;
    const documents = await this.documents(collection)
      .find({ [path]: { $type: 'number' } })
      .sort({ [path]: -1 })
      .limit(limit)
      .toArray();
    return documents.map((document) => ({ key: document._id, value: document.value }));
  }

  async flush(): Promise<void> {
    return Promise.resolve();
  }
}

const store: Store = config.mongoUri ? new MongoStore(config.mongoUri, config.mongoDb) : new JsonStore(path.join(config.root, 'data', 'db.json'));

export default store;
