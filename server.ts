import express from 'express';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// Khởi tạo chuẩn __dirname cho môi trường ES Module
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
    console.warn('⚠️ MONGODB_URI chưa được cấu hình. Hệ thống sẽ chạy ở chế độ lưu trữ cục bộ.');
    return;
  }
  try {
    if (!client) {
      client = new MongoClient(uri);
      await client.connect();
      db = client.db('physixam');
      console.log('✅ Đã kết nối thành công với MongoDB Atlas');
    }
  } catch (err) {
    console.error('❌ Lỗi kết nối MongoDB Atlas:', err);
  }
}

connectToMongo();

// API quản lý Submissions (Bài nộp của thí sinh)
app.get('/api/submissions', async (req, res) => {
  try {
    if (db) {
      const list = await db.collection('submissions').find({}).toArray();
      return res.json(list);
    }
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy danh sách bài nộp' });
  }
});

app.post('/api/submissions', async (req, res) => {
  try {
    const sub = req.body;
    if (db) {
      await db.collection('submissions').updateOne(
        { id: sub.id },
        { $set: sub },
        { upsert: true }
      );
    }
    res.json({ success: true, submission: sub });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lưu bài nộp' });
  }
});

// Xóa 1 bài nộp theo ID (Đã đồng bộ giao diện và database)
app.delete('/api/submissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (db) {
      await db.collection('submissions').deleteOne({ $or: [{ id }, { _id: id }] });
    }
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi xóa bài nộp' });
  }
});

// Xóa toàn bộ danh sách bài nộp
app.delete('/api/submissions/clear-all', async (req, res) => {
  try {
    if (db) {
      await db.collection('submissions').deleteMany({});
    }
    res.json({ success: true, message: 'Đã xóa sạch toàn bộ danh sách' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi xóa sạch danh sách' });
  }
});

// Phục vụ các tệp tĩnh từ thư mục build frontend (dist)
app.use(express.static(path.join(__dirname, 'dist')));

// Điều hướng mọi request khác về index.html của React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(Number(port), '0.0.0.0', () => {
  console.log(`🚀 Server PhysiXam đang chạy tại cổng ${port}`);
});