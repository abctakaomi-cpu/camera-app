const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;
const SERVER_START_TIME = Date.now();

// 保存先フォルダ（Codespaces対応: プロジェクト内の ./uploads/ に保存）
const SAVE_DIR = path.join(__dirname, 'uploads');

// 保存先フォルダがなければ作成
if (!fs.existsSync(SAVE_DIR)) {
  fs.mkdirSync(SAVE_DIR, { recursive: true });
  console.log(`保存先フォルダを作成しました: ${SAVE_DIR}`);
}

// multer設定: ファイル名を photo_YYYYMMDD_HHmmss.jpg 形式にする
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, SAVE_DIR);
  },
  filename: (req, file, cb) => {
    const now = new Date();
    const timestamp = now.getFullYear().toString()
      + String(now.getMonth() + 1).padStart(2, '0')
      + String(now.getDate()).padStart(2, '0')
      + '_'
      + String(now.getHours()).padStart(2, '0')
      + String(now.getMinutes()).padStart(2, '0')
      + String(now.getSeconds()).padStart(2, '0');
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `photo_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('画像ファイルのみアップロードできます'));
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 } // 最大20MB
});

// 静的ファイル配信
app.use(express.static(path.join(__dirname, 'public')));

// サーバーステータスエンドポイント
app.get('/status', (req, res) => {
  let photoCount = 0;
  try {
    const files = fs.readdirSync(SAVE_DIR);
    photoCount = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f)).length;
  } catch (e) {
    // uploads ディレクトリが未作成の場合
  }

  const uptimeSeconds = Math.floor((Date.now() - SERVER_START_TIME) / 1000);
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;

  let uptimeDisplay = '';
  if (hours > 0) uptimeDisplay += hours + '時間';
  if (minutes > 0 || hours > 0) uptimeDisplay += minutes + '分';
  uptimeDisplay += seconds + '秒';

  res.json({
    status: 'online',
    uptime_seconds: uptimeSeconds,
    uptime_display: uptimeDisplay,
    photo_count: photoCount,
    server_time: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 写真アップロードエンドポイント
app.post('/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'ファイルが送信されませんでした' });
  }
  console.log(`写真を保存しました: ${req.file.filename}`);
  res.json({ success: true, filename: req.file.filename });
});

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error('エラー:', err.message);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('======================================');
  console.log('  写真撮影アプリ起動中');
  console.log('======================================');
  console.log(`  URL:    http://localhost:${PORT}`);
  console.log(`  保存先: ${SAVE_DIR}`);
  console.log('======================================');
  console.log('');
});
