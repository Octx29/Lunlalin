const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const app = express();
const PORT = 3000;

// Paths
const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'data', 'content.json');
const IMAGES_DIR = path.join(ROOT, 'images');

// Ensure images directory exists
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve admin panel
app.use('/admin', express.static(path.join(__dirname, 'public')));

// Serve images
app.use('/images', express.static(IMAGES_DIR));

// Serve main site for preview
app.use('/', express.static(ROOT));

// --- Image upload ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMAGES_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = file.originalname.replace(ext, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${name}_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    cb(null, extOk || mimeOk);
  }
});

// ==================== API ROUTES ====================

// GET content
app.get('/api/content', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Cannot read content.json' });
  }
});

// SAVE content
app.put('/api/content', (req, res) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Cannot write content.json' });
  }
});

// UPLOAD image
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `images/${req.file.filename}` });
});

// LIST images
app.get('/api/images', (req, res) => {
  try {
    const files = fs.readdirSync(IMAGES_DIR).filter(f => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f));
    res.json(files.map(f => ({ name: f, url: `images/${f}` })));
  } catch (e) {
    res.json([]);
  }
});

// DELETE image
app.delete('/api/images/:filename', (req, res) => {
  try {
    const filePath = path.join(IMAGES_DIR, req.params.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Cannot delete image' });
  }
});

// GIT PUSH
app.post('/api/push', (req, res) => {
  try {
    const message = req.body.message || `Update content — ${new Date().toLocaleString('th-TH')}`;
    execSync('git add -A', { cwd: ROOT });
    execSync(`git commit -m "${message}"`, { cwd: ROOT });
    execSync('git push origin admin', { cwd: ROOT });
    res.json({ success: true, message: 'Pushed to GitHub successfully!' });
  } catch (e) {
    const errMsg = e.stderr ? e.stderr.toString() : e.message;
    // If nothing to commit, that's fine
    if (errMsg.includes('nothing to commit')) {
      return res.json({ success: true, message: 'No changes to push.' });
    }
    res.status(500).json({ error: errMsg });
  }
});

// GIT STATUS
app.get('/api/git-status', (req, res) => {
  try {
    const status = execSync('git status --short', { cwd: ROOT }).toString();
    const branch = execSync('git branch --show-current', { cwd: ROOT }).toString().trim();
    res.json({ branch, changes: status.trim().split('\n').filter(Boolean) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n  ✨ Lunlalin Admin Panel is running!`);
  console.log(`  ─────────────────────────────────────`);
  console.log(`  🔧 Admin Panel : http://localhost:${PORT}/admin`);
  console.log(`  🌐 Website     : http://localhost:${PORT}`);
  console.log(`  ─────────────────────────────────────\n`);
});
