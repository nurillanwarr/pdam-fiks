# SIPAS PDAM — Sistem Informasi Pengelolaan Arsip Surat

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-61dafb?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791?style=flat-square&logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-7.8-2d3748?style=flat-square&logo=prisma)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

> **Sistem manajemen surat digital yang powerful dan user-friendly untuk PDAM dengan fitur tracking real-time, disposisi inteligent, dan tanda tangan digital QR Code.**

---

## 📑 Daftar Isi
- [Tentang Aplikasi](#tentang-aplikasi)
- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Struktur Folder](#-struktur-folder)
- [Quick Start](#-quick-start)
- [Konfigurasi Environment](#-konfigurasi-environment)
- [Database Setup](#-database-setup)
- [Peran & Aksesibilitas](#-peran--aksesibilitas)
- [API Endpoints](#-api-endpoints)
- [Scripts & Commands](#-scripts--commands)
- [Troubleshooting](#-troubleshooting)
- [Kontribusi](#-kontribusi)

---

## Tentang Aplikasi

**SIPAS PDAM** adalah platform web modern yang mendigitalisasi seluruh alur persuratan di organisasi PDAM. Sistem ini dirancang untuk meningkatkan efisiensi, transparansi, dan akuntabilitas dalam pengelolaan dokumen administratif.

Dengan antarmuka yang intuitif dan proses otomatis, SIPAS PDAM menghilangkan bottleneck dalam pengarsipan tradisional dan memberikan visibilitas penuh terhadap setiap dokumen yang masuk maupun keluar.

### Manfaat Utama:
- 📊 **Paperless**: Mengurangi penggunaan kertas hingga 95%
- ⚡ **Efisiensi**: Mempercepat proses review & persetujuan dokumen
- 🔍 **Transparansi**: Tracking real-time status setiap surat
- 🔐 **Keamanan**: Autentikasi multi-role & audit log lengkap
- ✍️ **Digital Signature**: Tanda tangan QR Code terintegrasi PDF

---

## 🚀 Fitur Utama

### 1. **Multi-Role Dashboard** 
Antarmuka dinamis untuk 5 peran berbeda dengan menu & fitur yang disesuaikan:
- **Admin Staff**: Kelola user, audit log, pengaturan sistem
- **Agendaris**: Registrasi surat masuk, review dokumen, manajemen arsip
- **Direktur**: Review & keputusan dokumen, tanda tangan digital
- **Kabag/Kasubag**: Kelola disposisi dari Direktur
- **Dashboard Management**: Statistik & monitoring real-time

### 2. **Manajemen Dokumen Komprehensif**
- Dukung 7 jenis dokumen: Surat Masuk, Surat Keluar, Surat Tugas, SK Direktur, Perjanjian, Peraturan, Undangan
- Unggah attachment berukuran besar dengan kompresi otomatis
- Preview PDF langsung dalam aplikasi
- Pencarian full-text dengan filter advanced

### 3. **Status Tracking & Timeline**
- 11 status dokumen: Draft → Arsip Final Tersimpan
- Visual timeline menampilkan setiap perubahan status
- Notifikasi real-time untuk status update
- Export laporan tracking per dokumen

### 4. **Sistem Disposisi Intelligent**
- Disposisi dari Direktur → Kabag/Staff dengan instruksi detail
- Pencatatan waktu pengerjaan & deadline
- Follow-up otomatis untuk disposisi yang overdue
- Riwayat lengkap disposisi per dokumen

### 5. **Tanda Tangan Digital (QR Code)**
- Pengesahan PDF otomatis dengan QR Code verifikasi
- Paraf digital & signature dari Direktur
- Halaman verifikasi publik untuk memvalidasi keaslian
- Timestamp & audit trail tanda tangan

### 6. **Manajemen Jadwal & Undangan Digital**
- Jadwal rapat & acara dengan notifikasi otomatis
- Status baca penerima undangan real-time
- Integrasi Google Calendar (opsional)
- RSVP tracking per peserta

### 7. **Audit Log & Compliance**
- Pencatatan lengkap setiap aksi pengguna
- Filter audit log per user/dokumen/tanggal
- Export audit report untuk compliance
- IP tracking & timestamp akurat

---

## 💻 Tech Stack

### Frontend
| Teknologi | Versi | Deskripsi |
|-----------|-------|-----------|
| **Next.js** | 16.2 | Framework React dengan App Router (SSR/SSG) |
| **React** | 19.2 | UI library dengan hooks & server components |
| **TypeScript** | 5 | Type-safe programming language |
| **Tailwind CSS** | 4 | Utility-first CSS framework |
| **React Hook Form** | 7.73 | Form validation & management |
| **Lucide React** | 1.9 | Icon library modern & lightweight |

### Backend & Database
| Teknologi | Versi | Deskripsi |
|-----------|-------|-----------|
| **Next.js API Routes** | 16.2 | REST API dengan App Router |
| **Prisma ORM** | 7.8 | Database ORM type-safe |
| **Prisma PG Adapter** | 7.8 | Connection pooling untuk Supabase |
| **PostgreSQL** | 14+ | Database relasional |
| **NextAuth.js** | 4.24 | Authentication & session management |

### Utilities & Libraries
| Teknologi | Versi | Deskripsi |
|-----------|-------|-----------|
| **PDF-lib** | 1.17 | Manipulasi & generate PDF |
| **QRCode** | 1.5 | Generate QR Code untuk signature |
| **ExcelJS** | 4.4 | Export data ke Excel |
| **Bcryptjs** | 3.0 | Password hashing & verification |
| **Nodemailer** | 7.0 | Email notifications |
| **Date-fns** | 4.1 | Date formatting & manipulation |

---

## 📁 Struktur Folder

```
pdam-sipasi/
├── app/                           # Next.js App Router
│   ├── api/                       # API endpoints
│   │   ├── auth/                  # NextAuth.js config
│   │   ├── documents/             # Document CRUD
│   │   ├── users/                 # User management
│   │   ├── audit-logs/            # Audit logging
│   │   └── notifications/         # Notification service
│   ├── dashboard/                 # Main dashboard
│   │   ├── admin/                 # Agendaris dashboard
│   │   ├── direktur/              # Direktur dashboard
│   │   ├── kabag/                 # Kabag dashboard
│   │   └── [role]/                # Role-specific pages
│   ├── login/                     # Login page
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Home page
├── components/                    # React components
│   ├── admin/                     # Admin-specific components
│   ├── documents/                 # Document components
│   ├── layout/                    # Layout components
│   └── ui/                        # Reusable UI components
├── lib/                           # Utility functions
│   ├── prisma.ts                  # Prisma client config
│   ├── auth-helpers.ts            # Auth utilities
│   ├── upload.ts                  # File upload handling
│   ├── pdf-stamper.ts             # PDF manipulation
│   └── utils.ts                   # General utilities
├── prisma/                        # Database
│   ├── schema.prisma              # Database schema
│   ├── migrations/                # Migration files
│   ├── seed.ts                    # Seed test data
│   └── schema_full.sql            # Full schema backup
├── public/                        # Static assets
│   └── uploads/                   # User uploads (temp)
├── types/                         # TypeScript types
│   └── index.ts                   # Global type definitions
├── hooks/                         # React hooks
│   └── useDocuments.ts            # Document hook
├── .env.example                   # Example environment
├── next.config.ts                 # Next.js config
├── tsconfig.json                  # TypeScript config
└── package.json                   # Dependencies
```

---

## 🚀 Quick Start

### Prerequisites
Pastikan sistem Anda memiliki:
- **Node.js** 18+ ([download](https://nodejs.org/))
- **npm** atau **yarn** package manager
- **Git** untuk version control
- **Akun Supabase** dengan database PostgreSQL ([signup free](https://supabase.com/))

### Langkah 1: Clone Repository
```bash
git clone https://github.com/lung173/pdam-sipasi.git
cd pdam-sipasi
```

### Langkah 2: Install Dependencies
```bash
npm install
# atau
yarn install
```

### Langkah 3: Konfigurasi Environment
```bash
cp .env.example .env.local
# Edit .env.local dengan kredensial database Anda
```

### Langkah 4: Setup Database
```bash
# Generate Prisma Client
npm run db:generate

# Jalankan migrasi
npm run db:migrate

# (Opsional) Seed data testing
npm run db:seed
```

### Langkah 5: Run Development Server
```bash
npm run dev
```

Akses aplikasi di: **http://localhost:3000** 🎉

---

## ⚙️ Konfigurasi Environment

Buat file `.env.local` di root directory dengan variabel berikut:

```env
# ━━━ DATABASE CONFIGURATION ━━━
# URL Supabase dengan connection pooling (pgBouncer) - Port 6543
DATABASE_URL="postgresql://postgres.XXXXX:[PASSWORD]@db.XXXXX.supabase.co:6543/postgres?pgbouncer=true"

# URL koneksi langsung untuk migrasi - Port 5432
DIRECT_URL="postgresql://postgres.XXXXX:[PASSWORD]@db.XXXXX.supabase.co:5432/postgres"

# ━━━ AUTHENTICATION ━━━
# URL aplikasi (untuk redirect setelah login)
NEXTAUTH_URL="http://localhost:3000"

# Secret key NextAuth.js (generate random string untuk production)
NEXTAUTH_SECRET="your-secret-key-here-min-32-chars"

# ━━━ EMAIL CONFIGURATION (Optional) ━━━
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@pdam.go.id"

# ━━━ APPLICATION INFO ━━━
NEXT_PUBLIC_APP_NAME="SIPAS PDAM"
NEXT_PUBLIC_APP_VERSION="1.0.0"
NEXT_PUBLIC_APP_DESCRIPTION="Sistem Informasi Pengelolaan Arsip Surat"

# ━━━ FEATURE FLAGS ━━━
NEXT_PUBLIC_ENABLE_EMAIL_NOTIF="true"
NEXT_PUBLIC_ENABLE_GOOGLE_CALENDAR="false"
```

> **⚠️ Penting**: Jika password database mengandung karakter spesial (`@`, `#`, `?`, `%`), lakukan URL-encode. Contoh: `@` menjadi `%40`, `#` menjadi `%23`

---

## 🗄️ Database Setup

### Migrasi Database
```bash
# Generate Prisma Client (setiap kali schema berubah)
npm run db:generate

# Jalankan migrasi ke database
npm run db:migrate

# Reset database (HATI-HATI: akan menghapus semua data)
npm run db:reset

# Buka Prisma Studio (GUI untuk database)
npm run db:studio
```

### Seed Test Data
```bash
npm run db:seed
```

Data testing yang di-seed:
- **5 Users** (Admin Staff, Agendaris, Direktur, Kabag, Kasubag)
- **12 Dokumen** dari 7 jenis berbeda
- **4 Reviews** & **3 Decisions**
- **3 Jadwal & Disposisi**
- **Audit logs** & status timeline lengkap

**Default Credentials untuk Testing:**
```
Admin Staff 1  → staff@pdam.go.id        / Staff@12345
Admin Staff 2  → staff2@pdam.go.id       / Staff2@12345
Agendaris      → agendaris@pdam.go.id    / Agendaris@12345
Direktur       → direktur@pdam.go.id     / Direktur@12345
Kabag          → kabag@pdam.go.id        / Kabag@12345
```

---

## 👥 Peran & Aksesibilitas

### Admin Staff
- ✅ Kelola user account (create, edit, delete, reset password)
- ✅ Lihat audit log lengkap
- ✅ Akses pengaturan sistem
- ✅ Generate laporan
- ✅ Kelola upload file

### Agendaris (Administrator Surat)
- ✅ Registrasi surat masuk baru
- ✅ Review & proses dokumen
- ✅ Kelola status dokumen
- ✅ Arsip dokumen final
- ✅ Buat laporan distribusi
- ❌ Tidak bisa membuat keputusan direktur

### Direktur
- ✅ Review dokumen dari agendaris
- ✅ Buat keputusan: Setujui/Tolak/Revisi/Disposisi
- ✅ Tanda tangan digital dengan QR Code
- ✅ Buat disposisi ke staff
- ✅ Lihat riwayat keputusan
- ❌ Tidak bisa mengarsip dokumen

### Kabag/Kasubag
- ✅ Lihat disposisi dari direktur
- ✅ Kelola task/instruksi dari disposisi
- ✅ Report progress disposisi
- ✅ Lihat dokumen terkait
- ❌ Tidak bisa membuat disposisi baru

### Super Admin
- ✅ Full access ke semua fitur
- ✅ Bisa assign role pengguna
- ✅ Edit sistem configuration
- ✅ View all audit logs

---

## 🔌 API Endpoints

### Dokumentasi API

#### Authentication
```
POST   /api/auth/signin           - Login user
POST   /api/auth/signout          - Logout user
GET    /api/auth/session          - Get current session
POST   /api/auth/callback/:provider - OAuth callback
```

#### Documents
```
GET    /api/documents             - List semua dokumen
POST   /api/documents             - Create dokumen baru
GET    /api/documents/:id         - Get detail dokumen
PUT    /api/documents/:id         - Update dokumen
DELETE /api/documents/:id         - Hapus dokumen
POST   /api/documents/:id/review  - Submit review
POST   /api/documents/:id/decision - Submit keputusan direktur
```

#### Users
```
GET    /api/users                 - List semua user
POST   /api/users                 - Create user baru
GET    /api/users/:id             - Get detail user
PUT    /api/users/:id             - Update user
DELETE /api/users/:id             - Hapus user
POST   /api/users/:id/reset-password - Reset password
```

#### Audit Logs
```
GET    /api/audit-logs            - List audit logs
GET    /api/audit-logs/:id        - Detail audit log
GET    /api/audit-logs/export     - Export audit log (CSV/PDF)
```

#### Notifications
```
GET    /api/notifications         - List notifikasi user
POST   /api/notifications/:id/dismiss - Dismiss notifikasi
DELETE /api/notifications/:id     - Hapus notifikasi
```

---

## 📦 Scripts & Commands

```bash
# Development
npm run dev                 # Start development server (port 3000)
npm run build              # Build untuk production
npm start                  # Start production server

# Linting & Quality
npm run lint               # Run ESLint
npm run format             # Format code dengan Prettier (jika ada)

# Database
npm run db:generate        # Generate Prisma Client
npm run db:migrate         # Run migrations
npm run db:reset           # Reset database (warning: destructive)
npm run db:seed            # Seed test data
npm run db:studio          # Open Prisma Studio GUI

# Utility
npm run analyze            # Analyze bundle size
```

---

## 🐛 Troubleshooting

### Problem: Port 3000 sudah terpakai
```bash
# Cari proses yang menggunakan port 3000
lsof -i :3000              # macOS/Linux
netstat -ano | findstr :3000  # Windows PowerShell

# Kill process (Windows)
taskkill /PID [PID] /F

# Atau gunakan port lain
npm run dev -- -p 3001
```

### Problem: Database connection error
```bash
# Verifikasi .env.local memiliki DATABASE_URL yang benar
# Cek koneksi database di Prisma Studio
npm run db:studio

# Coba reset migrasi
npm run db:reset
npm run db:migrate
```

### Problem: "Error: Cannot find module 'next-auth'"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Problem: Prisma Client tidak ter-generate
```bash
# Generate Prisma Client secara eksplisit
npm run db:generate

# Atau install dengan fresh
npm install @prisma/client@latest
```

### Problem: Login tidak bekerja
Pastikan:
1. Database sudah di-seed: `npm run db:seed`
2. NEXTAUTH_SECRET sudah di-set di `.env.local`
3. Kredensial user sudah benar (lihat tabel credentials)
4. `isActive` field user adalah `true`

---

## 📝 Development Guidelines

### Branching Strategy
- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - Feature branches
- `hotfix/*` - Hotfix branches

### Commit Convention
```bash
feat: add new feature
fix: fix bug
docs: update documentation
refactor: refactor code
test: add tests
chore: update dependencies
```

### Code Style
- TypeScript strict mode enabled
- ESLint configuration in place
- Prisma schema formatting

---

## 📄 License

MIT License - Silakan gunakan & modifikasi sesuai kebutuhan.

---

## 🤝 Kontribusi

Kami menerima kontribusi dari komunitas! Silakan:

1. Fork repository ini
2. Buat branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buka Pull Request

Untuk issue & bug reports, gunakan GitHub Issues.

---

## 📞 Support & Contact

- **Email**: support@pdam.go.id
- **Issues**: [GitHub Issues](https://github.com/lung173/pdam-sipasi/issues)
- **Documentation**: Check `docs/` folder

---

**Made with ❤️ for PDAM | Last Updated: May 2026**
#   p d a m - f i k s  
 #   p d a m - f i k s  
 