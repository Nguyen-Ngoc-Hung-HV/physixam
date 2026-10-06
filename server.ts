import express from 'express';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// Khởi tạo __dirname chuẩn cho môi trường ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Thiết lập header CORS trực tiếp bằng Express
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));

const uri = process.env.MONGODB_URI;
let client: MongoClient | null = null;
let db: any = null;

async function connectToMongo() {
  if (!uri) {
    console.warn('⚠️ MONGODB_URI chưa được cấu hình. Hệ thống chạy ở chế độ offline.');
    return;
  }
  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('physixam');
    console.log('✅ Đã kết nối thành công tới MongoDB Atlas!');
  } catch (err) {
    console.error('❌ Lỗi kết nối MongoDB Atlas:', err);
  }
}

connectToMongo();

// ================= API BÀI NỘP =================
app.post('/api/submissions', async (req, res) => {
  try {
    const submission = req.body;
    if (!submission || !submission.id) {
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }
    if (db) {
      const collection = db.collection('submissions');
      await collection.updateOne({ id: submission.id }, { $set: submission }, { upsert: true });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/submissions', async (req, res) => {
  try {
    if (!db) return res.json({ success: true, submissions: [] });
    const collection = db.collection('submissions');
    const submissions = await collection.find({}).sort({ _id: -1 }).limit(100).toArray();
    res.json({ success: true, submissions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= API NGÂN HÀNG ĐỀ THI =================
app.post('/api/exam-packages', async (req, res) => {
  try {
    const pkg = req.body;
    if (!pkg || !pkg.id) {
      return res.status(400).json({ success: false, message: 'Dữ liệu gói đề không hợp lệ' });
    }
    if (db) {
      const collection = db.collection('exam_packages');
      await collection.updateOne({ id: pkg.id }, { $set: pkg }, { upsert: true });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/exam-packages', async (req, res) => {
  try {
    if (!db) return res.json({ success: true, packages: [] });
    const collection = db.collection('exam_packages');
    const packages = await collection.find({}).toArray();
    res.json({ success: true, packages });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= API LƯỢT GIAO ĐỀ (ASSIGNMENTS) =================
app.post('/api/assignments', async (req, res) => {
  try {
    const assignment = req.body;
    if (!assignment || !assignment.id) {
      return res.status(400).json({ success: false, message: 'Dữ liệu giao bài không hợp lệ' });
    }
    if (db) {
      const collection = db.collection('assignments');
      await collection.updateOne({ id: assignment.id }, { $set: assignment }, { upsert: true });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/assignments', async (req, res) => {
  try {
    if (!db) return res.json({ success: true, assignments: [] });
    const collection = db.collection('assignments');
    const assignments = await collection.find({}).sort({ _id: -1 }).toArray();
    res.json({ success: true, assignments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Phục vụ frontend static build
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`🚀 PhysiXam Server đang chạy tại cổng ${port}`);
});