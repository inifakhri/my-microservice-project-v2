const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Client } = require('pg');
const Minio = require('minio');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;

// Setup PostgreSQL
// Setup PostgreSQL dengan fungsi retry
const pgClient = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

async function connectDB() {
    let retries = 5;
    while (retries) {
        try {
            await pgClient.connect();
            console.log('✅ Terhubung ke PostgreSQL');
            break;
        } catch (err) {
            console.error('❌ Gagal konek ke DB, mencoba lagi dalam 5 detik...', err.message);
            retries -= 1;
            await new Promise(res => setTimeout(res, 5000)); // Tunggu 5 detik
        }
    }
}
connectDB();

// Setup MinIO
const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT, port: parseInt(process.env.MINIO_PORT),
    useSSL: false, accessKey: process.env.MINIO_ROOT_USER, secretKey: process.env.MINIO_ROOT_PASSWORD,
});
const bucketName = process.env.MINIO_BUCKET || 'book-reviews';

minioClient.bucketExists(bucketName, (err, exists) => {
    if (!exists) {
        minioClient.makeBucket(bucketName, 'us-east-1', (err) => {
            if (!err) {
                const policy = { Version: "2012-10-17", Statement: [{ Action: ["s3:GetObject"], Effect: "Allow", Principal: "*", Resource: [`arn:aws:s3:::${bucketName}/*`] }] };
                minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
            }
        });
    }
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // Limit 5MB [cite: 44]

// Middleware Cek Login
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (e) { res.status(401).json({ error: 'Invalid Token' }); }
};

// === ENDPOINTS USER (AUTH) ===
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, birth_date } = req.body;

    // VALIDASI INPUT
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, dan password wajib diisi' });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({ error: "Format email tidak valid" });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: "Password minimal 6 karakter" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pgClient.query('INSERT INTO users (name, email, password, birth_date) VALUES ($1, $2, $3, $4)', [name, email, hashedPassword, birth_date]);
        res.status(201).json({ message: 'User registered' });
    } catch (err) { res.status(400).json({ error: 'Email mungkin sudah dipakai' }); }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await pgClient.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0 || !(await bcrypt.compare(password, user.rows[0].password))) {
        return res.status(401).json({ error: 'Email atau Password salah' });
    }
    const token = jwt.sign({ id: user.rows[0].id, name: user.rows[0].name }, JWT_SECRET);
    res.json({ token, user: { id: user.rows[0].id, name: user.rows[0].name } });
});

// === ENDPOINTS RESENSI (CRUD) ===
app.post('/api/reviews', authenticate, upload.single('image'), async (req, res) => {
    const { book_title, book_author, publish_year, book_genre, review_text } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Gambar wajib diupload' });

    try {
        const fileName = `${Date.now()}-${req.file.originalname.replace(/\s/g, '_')}`;
        await minioClient.putObject(bucketName, fileName, req.file.buffer, req.file.size);
        const image_url = `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucketName}/${fileName}`; // Menggunakan MINIO_ENDPOINT untuk internal URL

        await pgClient.query(
            'INSERT INTO reviews (user_id, book_title, book_author, publish_year, book_genre, review_text, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [req.user.id, book_title, book_author, publish_year, book_genre, review_text, image_url]
        );
        res.status(201).json({ message: 'Created' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/reviews', authenticate, async (req, res) => {
    const result = await pgClient.query('SELECT * FROM reviews WHERE user_id = $1 ORDER BY id DESC', [req.user.id]);
    
    // Replace internal MinIO host with localhost for frontend access
    const reviews = result.rows.map(review => ({
        ...review,
        image_url: review.image_url.replace(`http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`, process.env.PUBLIC_MINIO_URL) // GANTI IP INI JIKA IP VM BERUBAH
    }));
    
    res.json(reviews);
});

app.put('/api/reviews/:id', authenticate, upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { book_title, book_author, publish_year, book_genre, review_text } = req.body;
    
    try {
        let updateQuery = 'UPDATE reviews SET book_title=$1, book_author=$2, publish_year=$3, book_genre=$4, review_text=$5 WHERE id=$6 AND user_id=$7';
        let values = [book_title, book_author, publish_year, book_genre, review_text, id, req.user.id];

        if (req.file) {
            // Jika ada file baru, upload dan ganti
            const fileName = `${Date.now()}-${req.file.originalname.replace(/\s/g, '_')}`;
            await minioClient.putObject(bucketName, fileName, req.file.buffer, req.file.size);
            const image_url = `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucketName}/${fileName}`;
            updateQuery = 'UPDATE reviews SET book_title=$1, book_author=$2, publish_year=$3, book_genre=$4, review_text=$5, image_url=$6 WHERE id=$7 AND user_id=$8';
            values = [book_title, book_author, publish_year, book_genre, review_text, image_url, id, req.user.id];
        }
        await pgClient.query(updateQuery, values);
        res.json({ message: 'Updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/reviews/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Ambil info review untuk mendapatkan nama file gambarnya
        const reviewResult = await pgClient.query(
            'SELECT image_url FROM reviews WHERE id = $1 AND user_id = $2', 
            [id, req.user.id]
        );

        if (reviewResult.rows.length === 0) {
            return res.status(404).json({ error: 'Resensi tidak ditemukan' });
        }

        const imageUrl = reviewResult.rows[0].image_url;
        
        // 2. Ekstrak nama file dari URL (mengambil bagian setelah /book-reviews/)
        // Contoh URL: http://minio:9000/book-reviews/17102345-foto.jpg
        const fileName = imageUrl.split('/').pop();

        // 3. Hapus file dari MinIO
        try {
            await minioClient.removeObject(bucketName, fileName);
            console.log(`File ${fileName} berhasil dihapus dari MinIO`);
        } catch (minioErr) {
            console.error("Gagal hapus file di MinIO:", minioErr);
            // Kita lanjut saja agar data di DB tetap terhapus jika file sudah tidak ada
        }

        // 4. Hapus data dari PostgreSQL
        await pgClient.query('DELETE FROM reviews WHERE id = $1 AND user_id = $2', [id, req.user.id]);

        res.json({ message: 'Resensi dan Gambar Berhasil Dihapus' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(process.env.PORT_BACKEND, () => console.log('Backend running'));

