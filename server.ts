import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectToDatabase } from './src/utils/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));

// 1. Kiểm tra trạng thái kết nối Database
app.get('/api/health', async (_req, res) => {
  try {
    const db = await connectToDatabase();
    res.json({ success: true, message: 'Đã kết nối MongoDB Atlas thành công!', dbName: db.databaseName });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Lưu bài nộp học sinh vào MongoDB
app.post('/api/submissions', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const submission = req.body;
    const result = await db.collection('submissions').insertOne({
      ...submission,
      createdAt: new Date(),
    });
    res.json({ success: true, insertedId: result.insertedId });
  } catch (error: any) {
    console.error('Lỗi lưu submission:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Lấy danh sách toàn bộ bài nộp
app.get('/api/submissions', async (_req, res) => {
  try {
    const db = await connectToDatabase();
    const list = await db.collection('submissions').find().sort({ createdAt: -1 }).toArray();
    res.json({ success: true, submissions: list });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Lưu hoặc cập nhật Gói đề thi vào Ngân hàng đề
app.post('/api/exam-packages', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const pkg = req.body;
    await db.collection('exam_packages').updateOne(
      { id: pkg.id },
      { $set: { ...pkg, updatedAt: new Date() } },
      { upsert: true }
    );
    res.json({ success: true, message: 'Đã lưu gói đề thi thành công' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Lấy toàn bộ gói đề thi từ ngân hàng
app.get('/api/exam-packages', async (_req, res) => {
  try {
    const db = await connectToDatabase();
    const packages = await db.collection('exam_packages').find().toArray();
    res.json({ success: true, packages });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Luôn phục vụ giao diện tĩnh từ thư mục dist
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`>>> PhysiXam Server đang chạy: http://localhost:${PORT}`);
  console.log(`==================================================\n`);
});
