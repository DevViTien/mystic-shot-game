# Hướng Dẫn Cấu Hình & Deploy — Mystic Shot

## Mục Lục

1. [Yêu Cầu Hệ Thống](#1-yêu-cầu-hệ-thống)
2. [Cài Đặt Dự Án](#2-cài-đặt-dự-án)
3. [Cấu Hình Firebase](#3-cấu-hình-firebase)
   - 3.1 [Tạo Firebase Project](#31-tạo-firebase-project)
   - 3.2 [Tạo Web App](#32-tạo-web-app)
   - 3.3 [Bật Anonymous Authentication](#33-bật-anonymous-authentication)
   - 3.4 [Tạo Realtime Database](#34-tạo-realtime-database)
   - 3.5 [Cấu Hình Security Rules](#35-cấu-hình-security-rules)
   - 3.6 [Lấy Thông Tin Cấu Hình](#36-lấy-thông-tin-cấu-hình)
4. [Cấu Hình Environment Variables](#4-cấu-hình-environment-variables)
5. [Chạy Development Server](#5-chạy-development-server)
6. [Build Production](#6-build-production)
7. [Deploy lên Firebase Hosting](#7-deploy-lên-firebase-hosting)
8. [Deploy lên Vercel](#8-deploy-lên-vercel)
9. [Deploy lên Netlify](#9-deploy-lên-netlify)
10. [Xử Lý Lỗi Thường Gặp](#10-xử-lý-lỗi-thường-gặp)

---

## 1. Yêu Cầu Hệ Thống

| Công cụ | Phiên bản tối thiểu |
|---------|---------------------|
| Node.js | **18.x** trở lên (khuyến nghị 20.x+) |
| npm | **9.x** trở lên |
| Git | Bất kỳ phiên bản hiện đại |

Kiểm tra phiên bản:

```bash
node -v    # v20.x.x
npm -v     # 10.x.x
git --version
```

---

## 2. Cài Đặt Dự Án

```bash
# Clone repository
git clone <repo-url> mystic-shot-game
cd mystic-shot-game

# Cài đặt dependencies
npm install
```

### Cấu trúc scripts

| Script | Mô tả |
|--------|-------|
| `npm run dev` | Chạy dev server (Vite HMR) tại `localhost:5173` |
| `npm run build` | TypeScript check + Vite build production → thư mục `dist/` |
| `npm run preview` | Xem bản build production locally |
| `npm run lint` | Kiểm tra lỗi ESLint |
| `npm run lint:fix` | Tự động sửa lỗi ESLint |
| `npm run format` | Format code với Prettier |
| `npm run format:check` | Kiểm tra format (dùng cho CI) |

---

## 3. Cấu Hình Firebase

Firebase cần thiết cho tính năng **Online Multiplayer**. Nếu chỉ chơi Local (offline), có thể bỏ qua phần này — game sẽ tự detect và ẩn nút Online Play.

### 3.1 Tạo Firebase Project

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** (hoặc **Create a project**)
3. Nhập tên project (VD: `mystic-shot`)
4. Google Analytics: tùy chọn bật/tắt (không ảnh hưởng game)
5. Click **Create project** → đợi khởi tạo → **Continue**

### 3.2 Tạo Web App

1. Trong Firebase Console → **Project Overview** (trang chủ project)
2. Click icon **Web** (`</>`) ở phần "Add an app to get started"
3. Nhập **App nickname**: `Mystic Shot` (hoặc tên bất kỳ)
4. **Firebase Hosting**: có thể tick nếu muốn deploy lên Firebase Hosting (xem [mục 7](#7-deploy-lên-firebase-hosting))
5. Click **Register app**
6. Màn hình tiếp theo hiển thị **Firebase SDK config** — **copy lại toàn bộ giá trị** (sẽ cần ở [mục 3.6](#36-lấy-thông-tin-cấu-hình))
7. Click **Continue to console**

### 3.3 Bật Anonymous Authentication

Game sử dụng **Anonymous Auth** để xác thực người chơi online mà không cần đăng ký tài khoản.

1. Firebase Console → sidebar trái → **Build** → **Authentication**
   (hoặc **Security** → **Authentication** tùy giao diện)
2. Nếu lần đầu: click **Get started**
3. Chuyển sang tab **Sign-in method**
4. Tìm **Anonymous** trong danh sách providers
5. Click vào → bật **Enable** → **Save**

✅ Verify: Status hiển thị **Enabled** (màu xanh)

### 3.4 Tạo Realtime Database

> ⚠️ **Quan trọng**: Game dùng **Realtime Database**, KHÔNG phải Firestore. Đây là hai sản phẩm khác nhau.

1. Firebase Console → sidebar trái → **Build** → **Realtime Database**
   (hoặc **Databases & Storage** → **Realtime Database**)
2. Click **Create Database**
3. **Database location** — chọn theo vùng gần nhất:
   - Việt Nam/Đông Nam Á: `Singapore (asia-southeast1)`
   - US: `United States (us-central1)`
4. **Security rules**: chọn **Start in test mode** (cho phép đọc/ghi 30 ngày — sẽ cấu hình rules cụ thể sau)
5. Click **Enable**

Sau khi tạo, URL database hiển thị ở đầu trang. URL sẽ có dạng:

| Region | URL format |
|--------|-----------|
| US (default) | `https://<project-id>-default-rtdb.firebaseio.com` |
| Singapore | `https://<project-id>-default-rtdb.asia-southeast1.firebasedatabase.app` |
| Belgium | `https://<project-id>-default-rtdb.europe-west1.firebasedatabase.app` |

**Copy URL này** — sẽ dùng cho `VITE_FIREBASE_DATABASE_URL`.

### 3.5 Cấu Hình Security Rules

Sau khi tạo database, cấu hình rules cho phù hợp:

1. Firebase Console → **Realtime Database** → tab **Rules**
2. Thay nội dung bằng:

#### Rules cho Development (mở rộng, dùng khi dev/test):

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "rooms": {
      ".indexOn": ["meta/roomCode"]
    }
  }
}
```

#### Rules cho Production (hạn chế hơn):

```json
{
  "rules": {
    "rooms": {
      ".indexOn": ["meta/roomCode"],
      "$roomId": {
        "meta": {
          ".read": "auth != null",
          ".write": "auth != null && (
            !data.exists() ||
            data.child('hostId').val() === auth.uid ||
            data.child('guestId').val() === auth.uid
          )"
        },
        "commands": {
          ".read": "auth != null",
          ".write": "auth != null && (
            root.child('rooms').child($roomId).child('meta').child('hostId').val() === auth.uid ||
            root.child('rooms').child($roomId).child('meta').child('guestId').val() === auth.uid
          )"
        },
        "state": {
          ".read": "auth != null",
          ".write": "auth != null && (
            root.child('rooms').child($roomId).child('meta').child('hostId').val() === auth.uid
          )"
        },
        "presence": {
          ".read": "auth != null",
          "$uid": {
            ".write": "auth != null && auth.uid === $uid"
          }
        }
      }
    }
  }
}
```

3. Click **Publish**

> **Giải thích Production Rules:**
> - Chỉ user đã xác thực mới đọc/ghi được
> - `meta`: chỉ host hoặc guest của room mới sửa được
> - `commands`: chỉ host/guest ghi command
> - `state`: chỉ host ghi state (host là nguồn chân lý)
> - `presence`: mỗi user chỉ ghi được presence của chính mình
> - `indexOn`: ["meta/roomCode"] cho phép query tìm room theo code

### 3.6 Lấy Thông Tin Cấu Hình

Nếu bạn đã bỏ lỡ config ở bước 3.2, lấy lại tại:

1. Firebase Console → ⚙️ **Project settings** (icon cài đặt cạnh "Project Overview")
2. Tab **General** → kéo xuống phần **Your apps**
3. Chọn Web App đã tạo
4. Phần **SDK setup and configuration** → chọn **Config**
5. Copy các giá trị:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",               // → VITE_FIREBASE_API_KEY
  authDomain: "xxx.firebaseapp.com", // → VITE_FIREBASE_AUTH_DOMAIN
  databaseURL: "https://xxx...",     // → VITE_FIREBASE_DATABASE_URL  ⚠️ Xem bên dưới
  projectId: "your-project-id",      // → VITE_FIREBASE_PROJECT_ID
  storageBucket: "xxx.appspot.com",  // → VITE_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123456789",    // → VITE_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123:web:abc123"          // → VITE_FIREBASE_APP_ID
};
```

> ⚠️ **Lưu ý về `databaseURL`**: Giá trị này **chỉ xuất hiện** trong SDK config nếu bạn tạo Realtime Database **trước** khi tạo Web App. Nếu tạo database sau, `databaseURL` sẽ **không có** trong config. Trong trường hợp đó, lấy URL trực tiếp từ trang **Realtime Database** (xem [mục 3.4](#34-tạo-realtime-database)).

---

## 4. Cấu Hình Environment Variables

### 4.1 Tạo file `.env`

Copy từ template và điền giá trị:

```bash
cp .env.example .env
```

### 4.2 Điền giá trị

Mở file `.env` và điền đúng từng field:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### 4.3 Bảng ánh xạ chi tiết

| Biến môi trường | Giá trị từ Firebase Console | Ví dụ |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Project settings → Web App → `apiKey` | `AIzaSyCv9LX-iZPy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` | `truongnbn-syp.firebaseapp.com` |
| `VITE_FIREBASE_DATABASE_URL` | Realtime Database page URL | `https://xxx-default-rtdb.asia-southeast1.firebasedatabase.app` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` (= Project settings → General → Project ID) | `truongnbn-syp` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` | `truongnbn-syp.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` (= Project number) | `1082215990106` |
| `VITE_FIREBASE_APP_ID` | `appId` | `1:1082215990106:web:b44d888...` |

### 4.4 Lưu ý quan trọng

- File `.env` đã được thêm vào `.gitignore` — **không bị commit lên Git**
- File `.env.example` là template trống — an toàn để commit
- **Vite chỉ đọc `.env` khi khởi động** — sau khi sửa `.env`, phải **restart dev server** (`Ctrl+C` rồi `npm run dev` lại)
- Tất cả biến phải có prefix `VITE_` để Vite expose ra client code

---

## 5. Chạy Development Server

```bash
npm run dev
```

Mở trình duyệt tại `http://localhost:5173`.

### Kiểm tra Firebase hoạt động

1. Trang chủ → **Online Play**
2. Nhập tên, chọn màu/skin
3. Click **CREATE** → nếu tạo room thành công (hiện Waiting Room với room code) → Firebase đã cấu hình đúng

### Test Online 2 người chơi

1. **Tab 1**: Create Room → copy room code (6 ký tự)
2. **Tab 2** (hoặc trình duyệt khác): Online Play → nhập code → **JOIN**
3. Tab 1: Guest đã join → click **START GAME**
4. Game bắt đầu — hai tab chơi xen kẽ lượt

---

## 6. Build Production

```bash
npm run build
```

Output nằm trong thư mục `dist/`. Kiểm tra locally:

```bash
npm run preview
```

Mở `http://localhost:4173` để xem bản production.

---

## 7. Deploy lên Firebase Hosting

### 7.1 Cài Firebase CLI

```bash
npm install -g firebase-tools
```

### 7.2 Đăng nhập

```bash
firebase login
```

### 7.3 Khởi tạo Firebase Hosting

```bash
firebase init hosting
```

Trả lời các câu hỏi:
- **Use an existing project** → chọn project đã tạo ở mục 3.1
- **Public directory**: `dist`
- **Single-page app (rewrite all URLs to /index.html)**: **Yes**
- **Set up automatic builds with GitHub**: tùy chọn
- **Overwrite dist/index.html**: **No**

### 7.4 Build & Deploy

```bash
npm run build
firebase deploy --only hosting
```

### 7.5 Cấu hình Environment Variables cho Production

Firebase Hosting serve static files — `.env` không tồn tại ở production. Biến môi trường được **bake vào** lúc build.

Có 2 cách:

**Cách 1: Tạo `.env.production`**

```bash
cp .env .env.production
# Sửa giá trị nếu cần (VD: dùng project Firebase khác cho production)
```

Vite tự động load `.env.production` khi chạy `npm run build`.

**Cách 2: Truyền qua CI/CD**

```bash
# GitHub Actions example
VITE_FIREBASE_API_KEY=${{ secrets.FIREBASE_API_KEY }} \
VITE_FIREBASE_AUTH_DOMAIN=${{ secrets.FIREBASE_AUTH_DOMAIN }} \
... \
npm run build
```

---

## 8. Deploy lên Vercel

### 8.1 Cài Vercel CLI (tùy chọn)

```bash
npm install -g vercel
```

### 8.2 Deploy từ CLI

```bash
npm run build
vercel --prod
```

### 8.3 Deploy từ Dashboard (khuyến nghị)

1. Push code lên GitHub/GitLab
2. Truy cập [vercel.com](https://vercel.com) → **Import Project** → chọn repo
3. **Framework Preset**: Vite
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. **Environment Variables**: thêm tất cả 7 biến `VITE_FIREBASE_*` vào Settings → Environment Variables
7. Click **Deploy**

### 8.4 Tự động redeploy

Mỗi lần push code lên branch chính → Vercel tự động build & deploy.

---

## 9. Deploy lên Netlify

### 9.1 Deploy từ Dashboard

1. Push code lên GitHub/GitLab
2. Truy cập [netlify.com](https://www.netlify.com) → **Add new site** → **Import an existing project**
3. Chọn repo
4. **Build command**: `npm run build`
5. **Publish directory**: `dist`
6. **Environment variables**: thêm 7 biến `VITE_FIREBASE_*`
7. Click **Deploy site**

### 9.2 Cấu hình SPA redirect

Tạo file `public/_redirects`:

```
/*    /index.html   200
```

Hoặc `public/netlify.toml`:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 10. Xử Lý Lỗi Thường Gặp

### `Firebase: Error (auth/configuration-not-found)`

**Nguyên nhân**: Anonymous Authentication chưa bật.

**Giải pháp**: Firebase Console → Authentication → Sign-in method → Anonymous → Enable.

---

### `Index not defined, add ".indexOn": "meta/roomCode", for path "/rooms"`

**Nguyên nhân**: Realtime Database chưa có index rule cho query tìm room.

**Giải pháp**: Firebase Console → Realtime Database → Rules → thêm:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "rooms": {
      ".indexOn": ["meta/roomCode"]
    }
  }
}
```

---

### `Firebase not configured. Set VITE_FIREBASE_* in .env`

**Nguyên nhân**: File `.env` chưa tạo hoặc thiếu giá trị `VITE_FIREBASE_API_KEY` / `VITE_FIREBASE_DATABASE_URL`.

**Giải pháp**: Tạo file `.env` theo [mục 4](#4-cấu-hình-environment-variables).

---

### Nút "Online Play" bị disable / không hiển thị

**Nguyên nhân**: `isFirebaseConfigured()` trả về `false` vì thiếu `API_KEY` hoặc `DATABASE_URL`.

**Giải pháp**: Kiểm tra `.env` có đủ giá trị → restart dev server.

---

### Sửa `.env` nhưng không có hiệu lực

**Nguyên nhân**: Vite chỉ đọc `.env` khi khởi động.

**Giải pháp**: `Ctrl+C` dừng dev server → `npm run dev` lại.

---

### `PERMISSION_DENIED` khi tạo/join room

**Nguyên nhân**: Security rules không cho phép ghi.

**Giải pháp**: Kiểm tra rules có `.write: "auth != null"`. Đảm bảo user đã được xác thực (Anonymous Auth bật).

---

### `databaseURL` không có trong Firebase SDK Config

**Nguyên nhân**: Realtime Database được tạo **sau** khi tạo Web App.

**Giải pháp**: Lấy URL trực tiếp từ trang Realtime Database trong Firebase Console (hiển thị ở đầu trang).

---

### Build lỗi TypeScript

```bash
# Kiểm tra lỗi TypeScript
npx tsc --noEmit

# Kiểm tra linting
npm run lint
```

---

## Checklist Trước Khi Deploy

- [ ] Node.js ≥ 18 đã cài
- [ ] `npm install` chạy thành công
- [ ] Firebase Project đã tạo
- [ ] Anonymous Authentication đã **bật**
- [ ] Realtime Database đã **tạo**
- [ ] Security Rules đã **publish** (bao gồm `indexOn`)
- [ ] File `.env` đã tạo với đủ 7 biến
- [ ] `npm run build` chạy thành công (0 lỗi)
- [ ] Test local: tạo room + join room hoạt động
- [ ] Environment variables đã thêm vào hosting platform (Vercel/Netlify/Firebase)
