# Book Review Microservice App

Aplikasi sederhana berbasis **microservice** untuk mengelola data pengguna dan resensi buku menggunakan **Node.js, PostgreSQL, dan MinIO**.
Seluruh layanan dijalankan menggunakan **Docker Compose** sehingga dapat dideploy dengan satu perintah.

Project ini dibuat sebagai tugas **UTS Administrasi Server Jaringan (ASJ)**.

---

# 1. Tujuan Proyek

Proyek ini bertujuan untuk memahami dan mengimplementasikan:

* Konsep **microservice architecture**
* Integrasi **PostgreSQL** sebagai relational database
* Integrasi **MinIO** sebagai object storage untuk file upload
* Containerization menggunakan **Docker**
* Orkestrasi service menggunakan **Docker Compose**
* REST API dengan operasi **CRUD**

---

# 2. Arsitektur Sistem

Aplikasi terdiri dari **5 service utama**:

| Service    | Deskripsi                                           |
| ---------- | --------------------------------------------------- |
| Frontend   | Interface web sederhana untuk interaksi pengguna    |
| Backend    | Server aplikasi yang menghubungkan frontend dan API |
| API        | Service utama yang menangani operasi CRUD           |
| PostgreSQL | Database untuk menyimpan metadata user              |
| MinIO      | Object storage untuk menyimpan file gambar          |

### Diagram Arsitektur

```
           +-------------+
           |  Frontend   |
           +------+------+
                  |
                  v
           +-------------+
           |   Backend   |
           +------+------+
                  |
                  v
           +-------------+
           |     API     |
           +------+------+
            |           |
            v           v
      +---------+   +---------+
      |PostgreSQL|  |  MinIO  |
      +---------+   +---------+
```

Alur data:

1. User mengakses frontend
2. Frontend mengirim request ke backend
3. Backend meneruskan request ke API
4. API:

   * menyimpan metadata user ke PostgreSQL
   * menyimpan foto profil ke MinIO

---

# 3. Teknologi yang Digunakan

| Teknologi             | Fungsi                  |
| --------------------- | ----------------------- |
| Node.js               | Backend runtime         |
| Express.js            | Framework REST API      |
| PostgreSQL            | Database metadata user  |
| MinIO                 | Penyimpanan file gambar |
| Docker                | Containerization        |
| Docker Compose        | Orkestrasi service      |
| Nginx / Static Server | Frontend hosting        |

### Alasan Pemilihan

* **Node.js + Express** mudah digunakan untuk REST API
* **PostgreSQL** stabil untuk relational database
* **MinIO** kompatibel dengan Amazon S3 API
* **Docker Compose** mempermudah deployment multi-service

---

# 4. Struktur Folder Project

```
my-microservice-project
│
├── frontend/
│   └── public
│
├── backend/
│   └── source code backend
│
├── api/
│   └── source code REST API
│
├── db/
│   └── init.sql
│
├── docker-compose.yml
├── .env
└── README.md
```

---

# 5. Konfigurasi Environment

Buat file `.env` berdasarkan `.env.example`.

Contoh:

```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=microservice_db

MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin

API_PORT=8080
```

Environment variable digunakan untuk menjaga **keamanan konfigurasi sensitif**.

---

# 6. Cara Menjalankan Project

Pastikan sudah menginstall:

* Docker
* Docker Compose

Kemudian jalankan perintah berikut:

```
docker compose up --build
```

Jika berhasil, service akan berjalan pada port berikut:

| Service       | URL                   |
| ------------- | --------------------- |
| API           | http://localhost:8080 |
| MinIO Console | http://localhost:9001 |
| Frontend      | http://localhost      |

---

# 7. Endpoint API

### Create User

```
POST /users
```

Form Data:

```
name
email
photo
```

Response:

```
201 Created
```

---

### Get All Users

```
GET /users
```

Response:

```
200 OK
```

---

### Get User by ID

```
GET /users/{id}
```

---

### Update User

```
PUT /users/{id}
```

Form Data:

```
name
email
photo
```

---

### Delete User

```
DELETE /users/{id}
```

Proses yang terjadi:

* data user dihapus dari PostgreSQL
* foto profil dihapus dari MinIO

---

# 8. Validasi Input

API menerapkan validasi dasar:

* email harus format valid
* ukuran file maksimal **5MB**
* name dan email wajib diisi

Jika input tidak valid:

```
400 Bad Request
```

---

# 9. Testing API

Testing dilakukan menggunakan **Postman**.

Berikut contoh pengujian yang dilakukan:

1. Create user
   
2. Get all users

3. Get user by id

4. Update user

5. Delete user

Tambahkan screenshot berikut:

```
/screenshots/create.png
/screenshots/read.png
/screenshots/update.png
/screenshots/delete.png
/screenshots/minio.png
```

---

# 10. Logging dan Debugging

Log container dapat dilihat dengan perintah:

```
docker compose logs
```

Jika terjadi error pada API:

```
docker compose logs api
```

---

# 11. Restart Stability Test

Project diuji dengan restart container:

```
docker compose down
docker compose up
```

Hasil:

* database tetap tersimpan (volume PostgreSQL)
* file di MinIO tidak hilang
* API kembali berjalan normal

---

# 12. Limitasi Project

Beberapa keterbatasan:

* autentikasi user belum diimplementasikan
* frontend masih sederhana
* belum ada pagination pada endpoint

---

# 13. Improvement Kedepan

Pengembangan yang dapat dilakukan:

* menambahkan sistem login dan JWT authentication
* menambahkan pagination dan search
* menambahkan rate limiting
* deployment ke cloud server

---

# 14. Author

Nama:
Kelas: XII TKJ

Project UTS Administrasi Server Jaringan 2026
