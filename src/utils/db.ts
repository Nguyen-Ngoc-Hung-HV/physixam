import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (db) return db;

  const uri = process.env.MONGODB_URI || '';
  if (!uri) {
    throw new Error('Chưa cấu hình biến môi trường MONGODB_URI trong tệp .env');
  }

  client = new MongoClient(uri);
  await client.connect();
  db = client.db('physixam_db');
  console.log('>>> [MongoDB Atlas] Kết nối database physixam_db thành công!');
  return db;
}
