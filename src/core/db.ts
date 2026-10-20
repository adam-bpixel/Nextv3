import type { Db, MongoClient } from 'mongodb';
import config from './config';

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
  allByField(collection: string, field: string, value: string | number | boolean): Promise<Entry[]>;
  getMany(collection: string, keys: readonly string[]): Promise<Entry[]>;
  top(collection: string, field: string, limit: number): Promise<Entry[]>;
  flush(): Promise<void>;
}

interface StoredDocument {
  _id: string;
  value: unknown;
}

export class MongoStore implements Store {
  private database: Db | null = null;
  private client: MongoClient | null = null;

  constructor(
    private readonly uri: string,
    private readonly name: string,
  ) {}

  async connect(): Promise<void> {
    if (!this.uri) throw new Error('MONGODB_URI is required; this bot stores all data in MongoDB.');
    const { MongoClient } = await import('mongodb');
    this.client = new MongoClient(this.uri);
    await this.client.connect();
    this.database = this.client.db(this.name);
    await this.documents('profileBackgroundOwnership').createIndex({ 'value.userId': 1 });
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

  async allByField(collection: string, field: string, value: string | number | boolean): Promise<Entry[]> {
    const documents = await this.documents(collection).find({ [`value.${field}`]: value }).toArray();
    return documents.map((document) => ({ key: document._id, value: document.value }));
  }

  async getMany(collection: string, keys: readonly string[]): Promise<Entry[]> {
    if (!keys.length) return [];
    const documents = await this.documents(collection).find({ _id: { $in: [...new Set(keys)] } }).toArray();
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
    await this.client?.close();
    this.client = null;
    this.database = null;
  }
}

const store: Store = new MongoStore(config.mongoUri, config.mongoDb);

export default store;
