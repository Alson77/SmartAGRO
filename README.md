# SmartAGRO

# 🌿 Smart AGRO — AI-Based Crop Disease Detection & Smart Farming Platform

<div align="center">

![Smart AGRO Banner](https://img.shields.io/badge/Smart-AGRO-22C55E?style=for-the-badge&logo=leaf&logoColor=white)
![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![Status](https://img.shields.io/badge/status-Live-brightgreen?style=for-the-badge)

**Empowering Nepalese farmers with AI-powered crop disease detection, real-time market prices, expert consultation, and digital subsidy management.**

🌐 **Live URL:** [linette-unclosable-culturedly.ngrok-free.dev](https://linette-unclosable-culturedly.ngrok-free.dev)

---

| Student | London Met ID | College ID | Institution |
|---|---|---|---|
| Alson Raj Bhandari | 23056625 | NP05CP4S240136 | Itahari International College / London Metropolitan University |

**Supervisors:** Niroj Shankhadev &nbsp;|&nbsp; Amit Shrestha  
**Module:** CS6P05NT Final Year Project &nbsp;|&nbsp; April 2026

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Configuration](#-environment-configuration)
- [Running the Application](#-running-the-application)
- [Seeding Expert Data](#-seeding-expert-data)
- [Public Deployment with ngrok](#-public-deployment-with-ngrok)
- [AI Model Information](#-ai-model-information)
- [API Reference](#-api-reference)
- [Default Credentials](#-default-credentials)
- [Common Issues & Fixes](#-common-issues--fixes)
- [Bug Log Summary](#-bug-log-summary)
- [License](#-license)

---

## 🌾 Overview

Smart AGRO is a comprehensive web-based smart farming platform built as a Final Year Project for CS6P05NT at Itahari International College (affiliated with London Metropolitan University). The platform addresses critical challenges facing Nepalese farmers:

- 🦠 **Delayed crop disease diagnosis** — farmers wait over a day using traditional methods
- 💰 **Inefficient subsidy management** — paper-based, opaque processes
- 👨‍🌾 **Limited expert access** — high cost and geographical barriers
- 📊 **Lack of real-time market data** — farmers disadvantaged in price negotiations

Smart AGRO solves these through a unified, mobile-friendly platform powered by a VGG16 convolutional neural network, live Kalimati market data, eSewa payment integration, and a comprehensive admin management panel.

---

## ✨ Features

### 🧑‍🌾 Farmer Portal

| Feature | Description |
|---|---|
| 🔬 **Crop Disease Detection** | Upload a leaf photo → VGG16 AI classifies disease from 39 classes → Nepali-language diagnosis + remedy in < 5 seconds |
| 🤖 **AI Chatbot** | Real-time farming advice chatbot with session-based conversation history |
| 📈 **Market Prices** | Live Kalimati commodity prices with 4-hour cache, search, sort, and manual refresh |
| 🌤️ **Weather Widget** | Real-time weather for 5 Nepali cities with Today's Conditions and 5-Day Farming Action Plan |
| 👨‍⚕️ **Expert Connect** | Contact agricultural specialists via in-app message, WhatsApp, phone call, or email |
| 📅 **Expert Booking** | Pre-book paid consultations using eSewa or bank transfer (15 Nepali banks) |
| 📝 **Subsidy Application** | Apply for government subsidies online, track status, receive admin decisions |
| 🌱 **Crop Issue Reporting** | Report crop problems with severity and urgency, receive admin responses |
| 👤 **Profile Management** | Update personal details and change password |
| 🔑 **Forgot Password** | OTP-based password reset via Gmail SMTP |

### 🛡️ Admin Panel

| Feature | Description |
|---|---|
| 📊 **Analytics Dashboard** | Platform stats: total farmers, active issues, pending subsidies, trend charts |
| 👥 **Farmer Management** | View, manage, and delete farmer accounts with full profile details |
| ✅ **Subsidy Management** | Approve or reject applications with written admin replies |
| 🚨 **Crop Issue Management** | Respond to and resolve farmer-reported crop problems |
| 💼 **Expert Bookings** | View all pre-booked consultations with payment details |
| 💹 **Market Price Management** | Monitor Kalimati data source, cache status, and force refresh |
| 🌿 **Scraped Subsidies** | View ongoing government subsidy programmes from MoALD |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.x | Component-based UI framework |
| TypeScript | 5.x | Static type checking |
| Vite | 7.x | Build tool and dev server |
| Tailwind CSS | 3.x | Utility-first styling |
| Recharts | 2.x | Dashboard analytics charts |
| Lucide React | 0.x | Icon library |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 24.x | JavaScript runtime |
| Express.js | 4.x | REST API framework |
| MongoDB Atlas | Cloud | Document database |
| Mongoose | 8.x | MongoDB ODM |
| JSON Web Token | — | Stateless authentication |
| Multer | — | Image file upload handling |
| bcryptjs | — | Password hashing (10 salt rounds) |
| Nodemailer | — | Email OTP for password reset |

### AI Microservice
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.11 | Runtime (required — see notes) |
| FastAPI | 0.x | High-performance API framework |
| TensorFlow / Keras | 2.x | VGG16 model inference |
| Pillow (PIL) | — | Image preprocessing |
| NumPy | — | Array operations |
| uvicorn | — | ASGI server |

### Payment & Integration
| Service | Purpose |
|---|---|
| eSewa (EPAYTEST) | Digital wallet payment for expert bookings |
| 15 Nepali Banks | Bank transfer payment option |
| Kalimati Market API | Live commodity price data |
| Weather API | Real-time Nepali city weather data |
| Gmail SMTP | Password reset OTP delivery |
| ngrok | Public HTTPS tunnel for local server |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PUBLIC INTERNET                       │
│              (ngrok HTTPS tunnel)                        │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│           REACT TYPESCRIPT FRONTEND                      │
│              Vite  |  Port 5173                          │
│   Farmer Portal ←→ Admin Panel ←→ Auth Pages            │
└─────────────────────┬───────────────────────────────────┘
                      │  REST API  (JWT protected)
┌─────────────────────▼───────────────────────────────────┐
│          NODE.JS EXPRESS BACKEND API                     │
│                    Port 5000                             │
│  /api/auth  /api/farmer  /api/admin  /api/disease        │
│  /api/chat  /api/subsidy  /api/issues  /api/market       │
│  /api/experts  /api/experts/bookings  /api/password      │
└──────────────┬──────────────────┬───────────────────────┘
               │                  │
┌──────────────▼────┐   ┌─────────▼──────────────────────┐
│  PYTHON FASTAPI   │   │      MONGODB ATLAS              │
│   AI MICROSERVICE │   │         Cloud DB                │
│     Port 8000     │   │                                 │
│                   │   │  Collections:                   │
│  VGG16 Model      │   │  • farmers      • admins        │
│  39 Disease       │   │  • diseasedetections            │
│  Classes          │   │  • chatsessions • chatmessages  │
│  Nepali Output    │   │  • cropissues   • replies       │
│                   │   │  • subsidyapps  • ongoingsubs   │
└───────────────────┘   │  • experts      • expertmsgs    │
                        │  • expertbookings               │
                        └────────────────────────────────-┘
```

---

## 📁 Project Structure

```
smartagro/
│
├── 📁 src/                              # React TypeScript Frontend
│   ├── 📁 pages/
│   │   ├── 📁 farmer/                   # Farmer portal pages
│   │   │   ├── Dashboard.tsx            # Weather, stats, charts
│   │   │   ├── CropDiseaseDetection.tsx # Image upload + AI result
│   │   │   ├── Chatbot.tsx              # AI farming chatbot
│   │   │   ├── MarketPrices.tsx         # Kalimati price table
│   │   │   ├── ExpertConnect.tsx        # Expert cards + booking
│   │   │   ├── SubsidyApplication.tsx   # Apply for subsidies
│   │   │   ├── CropIssues.tsx           # Report crop problems
│   │   │   └── Profile.tsx              # User profile management
│   │   │
│   │   ├── 📁 admin/                    # Admin panel pages
│   │   │   ├── AdminDashboard.tsx       # Stats + charts
│   │   │   ├── FarmersList.tsx          # Farmer management
│   │   │   ├── ExpertConnect.tsx        # Expert management
│   │   │   ├── ExpertBookings.tsx       # View all bookings
│   │   │   ├── SubsidyManagement.tsx    # Approve/reject subsidies
│   │   │   ├── CropIssues.tsx           # Resolve issues
│   │   │   ├── MarketPrices.tsx         # Market data management
│   │   │   └── ScrapedSubsidies.tsx     # MoALD subsidy programmes
│   │   │
│   │   ├── Login.tsx                    # Farmer login page
│   │   ├── Register.tsx                 # Farmer registration
│   │   ├── AdminLogin.tsx               # Admin portal login
│   │   ├── ForgotPassword.tsx           # OTP password reset
│   │   └── ChangePassword.tsx           # Change password
│   │
│   ├── 📁 components/
│   │   └── 📁 Layout/
│   │       ├── FarmerLayout.tsx         # Sidebar + header for farmers
│   │       └── AdminLayout.tsx          # Sidebar + header for admin
│   │
│   ├── 📁 services/
│   │   └── PaymentService.ts            # eSewa + bank transfer logic
│   │
│   ├── 📁 context/
│   │   └── AuthContext.tsx              # JWT auth context provider
│   │
│   ├── App.tsx                          # Route definitions + guards
│   ├── main.tsx                         # React app entry point
│   └── index.css                        # Global Tailwind imports
│
├── 📁 src/crop_disease_detection/       # Python FastAPI AI Microservice
│   ├── app.py                           # FastAPI application entry
│   ├── model.py                         # VGG16 load + predict function
│   ├── AI_plant_diseases_detection.keras # Trained VGG16 model (94% acc)
│   └── requirements.txt                 # Python dependencies
│
├── 📁 backend/                          # Node.js Express API Server
│   ├── server.js                        # Express entry + route registration
│   ├── seedExperts.js                   # Seed 4 expert documents to MongoDB
│   │
│   ├── 📁 config/
│   │   └── db.js                        # MongoDB Atlas connection
│   │
│   ├── 📁 middleware/
│   │   ├── jwtAuth.js                   # JWT verification middleware
│   │   └── upload.js                    # Multer config for images
│   │
│   ├── 📁 models/                       # Mongoose schemas
│   │   ├── Farmer.js
│   │   ├── Admin.js
│   │   ├── DiseaseDetection.js
│   │   ├── ChatSession.js
│   │   ├── ChatMessage.js
│   │   ├── CropIssue.js
│   │   ├── Reply.js
│   │   ├── SubsidyApplication.js
│   │   ├── OngoingSubsidy.js
│   │   ├── Expert.js
│   │   ├── ExpertMessage.js
│   │   └── ExpertBooking.js
│   │
│   ├── 📁 routes/                       # Express route modules
│   │   ├── auth.js                      # Register, login, logout
│   │   ├── farmer.js                    # Farmer profile CRUD
│   │   ├── admin.js                     # Admin farmer management
│   │   ├── disease.js                   # Predict, save, recent, delete
│   │   ├── chat.js                      # Session + messages
│   │   ├── subsidy.js                   # Apply, list, approve, reject
│   │   ├── issues.js                    # Report, update, resolve
│   │   ├── market.js                    # Kalimati proxy + cache
│   │   ├── expertRoutes.js              # Expert list + messages
│   │   ├── expert-bookings.js           # Booking + payment
│   │   ├── password.js                  # Forgot/reset/change
│   │   └── scraped-subsidies.js         # MoALD subsidy data
│   │
│   ├── 📁 uploads/
│   │   └── 📁 disease-images/           # Uploaded crop images
│   │
│   └── .env                             # Environment variables (not committed)
│
├── package.json                         # Frontend dependencies + scripts
├── vite.config.ts                       # Vite configuration
├── tailwind.config.js                   # Tailwind theme config
├── tsconfig.json                        # TypeScript config
└── README.md                            # This file
```

---

## ✅ Prerequisites

Before installing Smart AGRO, ensure you have the following installed:

```bash
# Check Node.js version (v24+ required)
node --version

# Check Python version (3.11 REQUIRED — see AI model notes)
python3.11 --version

# Check npm
npm --version
```

| Requirement | Version | Notes |
|---|---|---|
| Node.js | v24+ | Install from nodejs.org |
| Python | **3.11 only** | TensorFlow is incompatible with 3.13+ |
| MongoDB Atlas | Cloud account | Free tier sufficient |
| ngrok | Any | Free account for tunnelling |
| Gmail account | — | App Password required for SMTP |

> ⚠️ **IMPORTANT — Python Version:**  
> TensorFlow (including `tensorflow-macos` for Apple Silicon) does **not** support Python 3.13.  
> You **must** use Python 3.11. On macOS: `brew install python@3.11`

---

## 📦 Installation

### Step 1 — Clone the Repository

```bash
git clone https://github.com/alsonbhandari/smartagro.git
cd smartagro
```

### Step 2 — Install Frontend Dependencies

```bash
# From the project root directory
npm install
```

### Step 3 — Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### Step 4 — Set Up Python AI Environment

```bash
# Navigate to the AI microservice directory
cd src/crop_disease_detection

# Create a virtual environment using Python 3.11 specifically
python3.11 -m venv venv311

# Activate the virtual environment
source venv311/bin/activate          # macOS / Linux
# venv311\Scripts\activate           # Windows

# Install Python dependencies
pip install fastapi uvicorn tensorflow pillow numpy python-multipart

# For Apple Silicon (M1/M2/M3) Macs — use tensorflow-macos instead:
# pip install tensorflow-macos

# Verify TensorFlow installed correctly
python -c "import tensorflow as tf; print(tf.__version__)"

# Deactivate when done
deactivate

# Return to project root
cd ../..
```

---

## ⚙️ Environment Configuration

Create a `.env` file inside the `backend/` directory:

```bash
touch backend/.env
```

Add the following variables:

```env
# ── Database ────────────────────────────────────────────────
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/smartagro?retryWrites=true&w=majority

# ── Authentication ───────────────────────────────────────────
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long

# ── Email (for Forgot Password OTP) ─────────────────────────
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password_16_chars

# ── Server ───────────────────────────────────────────────────
PORT=5000

# ── AI Microservice ───────────────────────────────────────────
AI_SERVER_URL=http://localhost:8000

# ── Frontend URL (for CORS) ───────────────────────────────────
FRONTEND_URL=http://localhost:5173
```

### How to get each value:

<details>
<summary><strong>📌 MONGO_URI — MongoDB Atlas</strong></summary>

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Click **Connect** → **Connect your application**
4. Copy the connection string and replace `<username>` and `<password>`
5. Set your IP address in **Network Access** (or allow `0.0.0.0/0` for development)

</details>

<details>
<summary><strong>📌 JWT_SECRET — Generate a secure key</strong></summary>

```bash
# Generate a 256-bit random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it as your `JWT_SECRET`.

</details>

<details>
<summary><strong>📌 EMAIL_PASS — Gmail App Password</strong></summary>

1. Go to your Google Account → **Security**
2. Enable **2-Step Verification** (required)
3. Go to **App Passwords** → Select app: **Mail** → Select device: **Other**
4. Copy the generated 16-character password
5. Use this as `EMAIL_PASS` (not your regular Gmail password)

</details>

---

## 🚀 Running the Application

Smart AGRO requires **three separate terminal tabs** running simultaneously:

### Terminal 1 — React Frontend (Port 5173)

```bash
# From project root
npm run dev
```

✅ You should see: `VITE v7.x.x  ready in xxx ms — Local: http://localhost:5173/`

---

### Terminal 2 — Node.js Backend API (Port 5000)

```bash
cd backend
node server.js
```

✅ You should see:
```
Server running on port 5000
MongoDB Connected: cluster.mongodb.net
```

---

### Terminal 3 — Python AI Microservice (Port 8000)

```bash
cd src/crop_disease_detection
source venv311/bin/activate
uvicorn app:app --reload --port 8000
```

✅ You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

---

> ⚠️ **All three servers must be running simultaneously for full functionality.**  
> If any server is stopped, the features dependent on it will return errors.

| Server | Port | Features dependent on it |
|---|---|---|
| React Frontend | 5173 | All user interface |
| Node.js Backend | 5000 | Auth, database, market prices, subsidies, issues, expert features |
| Python AI | 8000 | Crop disease detection |

---

## 🌱 Seeding Expert Data

Before using the Expert Connect feature, seed the expert data into MongoDB:

```bash
cd backend
node seedExperts.js
```

Expected output:
```
Connecting to MongoDB...
MongoDB Connected
Cleared existing experts
Seeded 4 experts successfully:
  ✓ Dr. Ramesh Adhikari  — Crop Disease Specialist
  ✓ Dr. Sunita Sharma    — Soil Science Expert
  ✓ Mr. Bijay Thapa      — Agricultural Extension Officer
  ✓ Ms. Anita Poudel     — Organic Farming Specialist
Disconnected from MongoDB
```

---

## 🌐 Public Deployment with ngrok

To expose your locally running application to the internet for public access or demonstration:

### Step 1 — Install and configure ngrok

```bash
# Install ngrok (macOS)
brew install ngrok

# OR download from https://ngrok.com/download

# Add your auth token (get it free at ngrok.com)
ngrok config add-authtoken YOUR_NGROK_AUTH_TOKEN
```

### Step 2 — Start the tunnel

```bash
# Expose the React frontend (port 5173)
ngrok http 5173
```

### Step 3 — Copy the public URL

ngrok will display something like:
```
Forwarding  https://linette-unclosable-culturedly.ngrok-free.app -> http://localhost:5173
```

Share this URL for public access. **All three local servers must still be running.**

### Step 4 — Update CORS (if needed)

If you encounter CORS errors, update `FRONTEND_URL` in `backend/.env` to your ngrok URL:

```env
FRONTEND_URL=https://your-ngrok-url.ngrok-free.app
```

Then restart the Node.js backend.

---

## 🤖 AI Model Information

| Property | Value |
|---|---|
| Architecture | VGG16 (Visual Geometry Group, Oxford) |
| Training Dataset | PlantVillage (Hughes & Salathé, 2015) |
| Number of Classes | 39 (37 disease classes + 2 healthy) |
| Accuracy | 94% on test dataset |
| Input Size | 224 × 224 pixels (RGB) |
| Model Format | Keras `.keras` format |
| Output | Disease label + confidence % + Nepali description + Nepali remedy |

### Supported Crop Disease Classes (Sample)

| Crop | Diseases Detected |
|---|---|
| Tomato | Late blight, Early blight, Yellow Leaf Curl Virus, Mosaic Virus, Leaf Mold, Bacterial Spot, Spider Mites, Target Spot, Healthy |
| Potato | Early blight, Late blight, Healthy |
| Apple | Scab, Black Rot, Cedar Apple Rust, Healthy |
| Corn (Maize) | Grey Leaf Spot, Common Rust, Northern Leaf Blight, Healthy |
| Grape | Black Rot, Esca (Black Measles), Leaf Blight, Healthy |
| Pepper | Bacterial Spot, Healthy |
| Strawberry | Leaf Scorch, Healthy |
| Peach | Bacterial Spot, Healthy |
| Cherry | Powdery Mildew, Healthy |
| Squash | Powdery Mildew |
| Raspberry | Healthy |
| Soybean | Healthy |

> ⚠️ **Note on mock predictions:**  
> If TensorFlow fails to load (e.g., Python version incompatibility), the system automatically falls back to **mock predictions** so all other features remain functional. Resolve by using the Python 3.11 virtual environment (`venv311`).

---

## 📡 API Reference

### Authentication

```
POST   /api/auth/register         Register a new farmer
POST   /api/auth/login            Login and receive JWT token
POST   /api/auth/logout           Logout (client-side token removal)
POST   /api/password/forgot       Send OTP to email
POST   /api/password/reset        Reset password with OTP
PUT    /api/password/change       Change password (authenticated)
```

### Farmer

```
GET    /api/farmer/profile        Get farmer profile
PUT    /api/farmer/profile        Update farmer profile
```

### Disease Detection

```
POST   /api/disease/predict       Upload image and get AI prediction
POST   /api/disease/save          Save a detection result
GET    /api/disease/recent        Get last 5 detection results
DELETE /api/disease/:id           Delete a detection record
```

### AI Chatbot

```
GET    /api/chat/sessions          Get farmer's chat sessions
POST   /api/chat/sessions          Create new chat session
GET    /api/chat/sessions/:id      Get session messages
POST   /api/chat/messages          Send a message
```

### Market Prices

```
GET    /api/market-prices          Get Kalimati commodity prices (cached 4hr)
POST   /api/market-prices/refresh  Force refresh market data (admin)
```

### Expert Connect

```
GET    /api/experts                List all active experts
POST   /api/experts/message        Send message to expert
GET    /api/experts/messages       Get farmer's sent messages
```

### Expert Bookings

```
POST   /api/experts/bookings/payment    Create booking with payment
GET    /api/experts/bookings/my         Get farmer's bookings
GET    /api/experts/bookings/all        Get all bookings (admin)
```

### Subsidy

```
POST   /api/subsidy                Submit new subsidy application
GET    /api/subsidy/my             Get farmer's own applications
GET    /api/subsidy/all            Get all applications (admin)
PUT    /api/subsidy/:id/approve    Approve application (admin)
PUT    /api/subsidy/:id/reject     Reject application (admin)
```

### Crop Issues

```
POST   /api/issues                 Report a new crop issue
GET    /api/issues/my              Get farmer's own issues
GET    /api/issues/admin           Get all issues (admin)
PUT    /api/issues/:id             Update issue (admin response)
PUT    /api/issues/:id/resolve     Mark as resolved (admin)
```

### Admin

```
GET    /api/admin/farmers          Get all registered farmers
GET    /api/admin/farmers/:id      Get single farmer detail
DELETE /api/admin/farmers/:id      Delete farmer account
GET    /api/admin/analytics        Get platform analytics data
```

### Scraped Subsidies

```
GET    /api/scraped-subsidies      Get ongoing MoALD subsidy programmes
```

> All routes except `/api/auth/register`, `/api/auth/login`, `/api/password/forgot`, and `/api/password/reset` require a valid JWT token in the `Authorization: Bearer <token>` header.

---

## 🔑 Default Credentials

### Admin Account

```
Email:    admin@smartagro.com
Password: Admin@12345
```

> To create a new admin manually, insert a document into the `admins` MongoDB collection with a bcrypt-hashed password (10 salt rounds).

### Test Farmer Account

```
Email:    farmer@test.com
Password: Test@1234
```

> Or register a new farmer account through the signup page.

---

## 🔧 Common Issues & Fixes

| Problem | Cause | Solution |
|---|---|---|
| Disease detection returns 400 | Python AI server not running | Start `uvicorn app:app --reload --port 8000` in Terminal 3 |
| Market prices show ECONNREFUSED | Node.js backend not running | Start `node server.js` in Terminal 2 |
| TensorFlow import error | Using Python 3.13 | Create venv311 with Python 3.11 (see Installation Step 4) |
| Expert list is empty | seedExperts.js not run | Run `cd backend && node seedExperts.js` |
| JWT 401 Unauthorized | Token expired or missing | Re-login to get a fresh JWT token |
| Email OTP not received | Gmail App Password incorrect | Generate new App Password in Google Account → Security |
| CORS errors | Frontend URL mismatch | Update `FRONTEND_URL` in backend `.env` to match your ngrok URL |
| MongoDB connection failed | Wrong URI or IP not whitelisted | Check `MONGO_URI` in `.env` and add your IP in MongoDB Atlas Network Access |
| Port already in use | Previous process not stopped | Run `lsof -ti:5000 | xargs kill` (or 5173 / 8000) |
| Multer 400 Bad Request | File type rejected | Ensure you are uploading a valid image (JPEG, PNG, WEBP) |

---

## 🐛 Bug Log Summary

| ID | Bug | Severity | Status |
|---|---|---|---|
| BUG-01 | AI model load failed — Python server not started | Critical | ✅ Resolved |
| BUG-02 | main.py vs app.py confusion in AI microservice | High | ✅ Resolved |
| BUG-03 | React ES module import in server.js crashed Node | Critical | ✅ Resolved |
| BUG-04 | expertRoutes.js silently written empty by zsh heredoc | High | ✅ Resolved |
| BUG-05 | Market prices ECONNREFUSED — backend not running | High | ✅ Resolved |
| BUG-06 | Disease detection 400 — multer file filter rejecting blobs | High | ✅ Resolved |
| BUG-07 | uvicorn started in wrong directory | High | ✅ Resolved |
| BUG-08 | TensorFlow incompatible with Python 3.13 | Critical | ⚠️ Partial (venv311 created) |
| BUG-09 | FarmerLayout.tsx import order error | Medium | ✅ Resolved |
| BUG-10 | Market prices polling every 10 seconds | Low | ✅ Resolved (changed to 2hr) |






## 📄 License

This project is submitted as a Final Year Project for **CS6P05NT** at Itahari International College / London Metropolitan University.

© 2026 Alson Raj Bhandari. All rights reserved.

---

<div align="center">

**Made with ❤️ for Nepalese farmers**

🌿 Smart AGRO — *Empowering farmers with technology, insights, and community*

</div>
