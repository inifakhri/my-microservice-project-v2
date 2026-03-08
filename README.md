# Book Review Microservice Application

## Deskripsi Proyek

Aplikasi ini merupakan implementasi **CRUD berbasis arsitektur microservice** yang dibuat untuk memenuhi tugas **UTS Administrasi Server Jaringan**.

Aplikasi digunakan untuk mengelola data pengguna dan resensi buku. Data teks disimpan di **PostgreSQL**, sedangkan file gambar disimpan di **MinIO Object Storage**.

Seluruh service dijalankan menggunakan **Docker** dan diorkestrasi dengan **Docker Compose** sehingga seluruh sistem dapat dijalankan hanya dengan satu perintah.

Fitur utama aplikasi:

* Registrasi dan login pengguna
* CRUD data pengguna
* CRUD resensi buku
* Upload gambar ke object storage
* Penyimpanan metadata di PostgreSQL
* API Gateway untuk routing request
* Frontend sederhana berbasis HTML

---

# Arsitektur Sistem

Aplikasi ini menggunakan **arsitektur microservice** dengan 5 service utama.

```
Client (Browser)
       │
       ▼
Frontend (Nginx / Static HTML)
       │
       ▼
API Gateway (Node.js)
       │
       ▼
Backend Service (Express.js)
       │
 ┌─────┴─────────────┐
 ▼                   ▼
PostgreSQL        MinIO
(Database)      (Object Storage)
```

Penjelasan service:

| Service  | Fungsi                                         |
| -------- | ---------------------------------------------- |
| frontend | Menyediakan antarmuka web                      |
| api      | API Gateway yang meneruskan request ke backend |
| backend  | Menangani logika aplikasi dan REST API         |
| postgres | Database untuk menyimpan metadata              |
| minio    | Object storage untuk menyimpan gambar          |

---

# Teknologi yang Digunakan

| Komponen       | Teknologi             |
| -------------- | --------------------- |
| Backend API    | Node.js + Express     |
| API Gateway    | http-proxy-middleware |
| Database       | PostgreSQL            |
| Object Storage | MinIO                 |
| Upload File    | Multer                |
| Validasi       | Validator             |
| Authentication | JWT                   |
| Container      | Docker                |
| Orkestrasi     | Docker Compose        |

---

# Struktur Project

```
my-microservice-project-v2
│
├── docker-compose.yml
├── .env
├── .env.example
│
├── api
│   ├── Dockerfile
│   └── index.js
│
├── backend
│   ├── Dockerfile
│   └── index.js
│
├── frontend
│   ├── Dockerfile
│   └── public/index.html
│
├── db
│   └── init.sql
│
└── README.md
```

---

# Konfigurasi Environment Variables

Buat file `.env` berdasarkan `.env.example`.

Contoh konfigurasi:

```
DB_HOST=postgres
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=bookdb
DB_PORT=5432

MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

JWT_SECRET=supersecret
PORT_API=8080
```

---

# Cara Menjalankan Aplikasi

Pastikan **Docker** dan **Docker Compose** sudah terinstall.

### 1. Clone repository

```
git clone <repository-url>
cd my-microservice-project-v2
```

### 2. Jalankan semua service

```
docker compose up --build
```

Docker akan menjalankan service:

* frontend
* api
* backend
* postgres
* minio

---

# Akses Service

| Service       | URL                   |
| ------------- | --------------------- |
| Frontend      | http://localhost      |
| API Gateway   | http://localhost:8080 |
| MinIO Console | http://localhost:9001 |

Login MinIO:

```
username: minioadmin
password: minioadmin
```

---

# REST API Endpoint

Base URL

```
http://localhost:8080/api
```

## User Endpoint

### Register User

```
POST /api/register
```

Body JSON:

```
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "123456",
  "birth_date": "2000-01-01"
}
```

---

### Login User

```
POST /api/login
```

---

## Review Endpoint

### Create Review

```
POST /api/reviews
```

Form-data:

* book_title
* book_author
* publish_year
* review_text
* image (file)

---

### Get All Reviews

```
GET /api/reviews
```

---

### Update Review

```
PUT /api/reviews/:id
```

---

### Delete Review

```
DELETE /api/reviews/:id
```

---

# Database Schema

Tabel utama:

### Users

| Field      | Type    |
| ---------- | ------- |
| id         | SERIAL  |
| name       | VARCHAR |
| email      | VARCHAR |
| password   | VARCHAR |
| birth_date | DATE    |
| photo_url  | TEXT    |

### Reviews

| Field        | Type    |
| ------------ | ------- |
| id           | SERIAL  |
| user_id      | INTEGER |
| book_title   | VARCHAR |
| book_author  | VARCHAR |
| publish_year | INTEGER |
| review_text  | TEXT    |
| image_url    | TEXT    |

---

# Pengujian API

Endpoint yang diuji:

1. Create user
2. Login user
3. Create review
4. Get review
5. Delete review

Screenshot pengujian dapat dilihat pada folder dokumentasi.

---

# Logging & Error Handling

Backend memiliki:

* validasi email menggunakan `validator`
* retry koneksi database
* logging koneksi PostgreSQL
* error handling untuk request invalid

---

# Keamanan dan Best Practices

Beberapa best practices yang diterapkan:

* Environment variables untuk konfigurasi sensitif
* Password hashing menggunakan bcrypt
* Authentication menggunakan JWT
* Validasi email
* Docker network antar service
* Volume persistence untuk database dan storage

---

# Pengembangan Selanjutnya

Beberapa peningkatan yang dapat dilakukan:

* Menambahkan rate limiting
* Menambahkan pagination pada review
* Menambahkan role user
* Menambahkan sistem komentar
* Deploy ke cloud server

---

# Kesimpulan

Proyek ini berhasil mengimplementasikan aplikasi **CRUD berbasis microservice** dengan integrasi **PostgreSQL** dan **MinIO** menggunakan **Docker Compose**.

Aplikasi menunjukkan bagaimana beberapa service dapat bekerja bersama dalam arsitektur terdistribusi untuk membangun sistem yang modular dan scalable.

---
# Credit

Nama: Fakhri Aulia Putra
Kelas: XII TKJ 2
Absen: 13
Mapel: ASJ
Github: _https://github.com/inifakhri/my-microservice-project-v2_
