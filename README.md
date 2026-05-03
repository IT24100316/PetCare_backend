# 🐾 PawCare Backend

A comprehensive **Node.js/Express REST API** for the PawCare pet care management platform. This backend powers a full-featured pet care application including pet profiles, veterinary bookings, grooming & boarding services, an online pet shop, medical records, real-time chat, and AI-powered assistance.

---

## 🚀 Tech Stack

| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **MongoDB + Mongoose** | Database & ODM |
| **JWT** | Authentication |
| **bcrypt** | Password hashing |
| **Cloudinary + Multer** | Image upload & storage |
| **node-cron** | Scheduled tasks |
| **CORS** | Cross-origin resource sharing |

---

## 📁 Project Structure

```
PetCare_backend/
├── config/                 # Database & Cloudinary config
├── controllers/            # Route handlers (business logic)
├── middleware/             # Auth & upload middleware
├── models/                 # Mongoose schemas
├── routes/                 # API route definitions
├── utils/                  # Cron jobs, token generation, notifications
├── server.js               # Entry point
└── package.json
```

---

## ✨ Features

### 🔐 Authentication & Users
- JWT-based user authentication
- Role-based access control (User / Admin)
- Secure password hashing with bcrypt

### 🐶 Pet Profiles
- Create, read, update, delete pet profiles
- Store species, breed, age, birth date, medical notes
- Pet image upload via Cloudinary

### 🏥 Medical Records
- Vaccination & medical history tracking
- Soft-delete support for records
- Per-pet medical record retrieval

### 📅 Booking Services
- **Veterinary appointments**
- **Grooming services**
- **Pet boarding/sitting**
- User booking management

### 🛒 Pet Shop
- Product catalog with categories
- Order placement & management
- Cart functionality support

### 💬 Chat System
- Real-time messaging between users
- Message history storage

### 🤖 AI Assistant
- AI-powered pet care recommendations
- Integrated tool support

### ⭐ Feedback & Reviews
- User feedback & rating system
- Review management

### 👤 Admin Dashboard
- User management
- Booking oversight
- Product & order management
- Feedback moderation

### 📤 File Uploads
- Cloudinary integration for images
- Secure file handling with Multer

### 🔔 Notifications
- Automated cron jobs for reminders
- Notification service integration

---

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- [Cloudinary](https://cloudinary.com/) account (for image uploads)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/IT24100316/PetCare_backend.git
   cd PetCare_backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**

   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Start the server**
   ```bash
   # Development mode (with auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Verify**
   
   Visit: `http://localhost:5000/api/health`
   
   Response:
   ```json
   {
     "status": "success",
     "message": "API is healthy"
   }
   ```

---

## 📡 API Endpoints

| Route | Description |
|-------|-------------|
| `POST /api/auth/register` | User registration |
| `POST /api/auth/login` | User login |
| `GET/POST /api/pets` | Pet profile management |
| `GET/POST /api/medical-records` | Medical/vaccination records |
| `GET/POST /api/bookings/vet` | Vet appointments |
| `GET/POST /api/bookings/grooming` | Grooming bookings |
| `GET/POST /api/bookings/boarding` | Boarding bookings |
| `GET/POST /api/products` | Pet shop products |
| `GET/POST /api/orders` | Orders |
| `GET/POST /api/feedbacks` | Feedback & reviews |
| `GET/POST /api/chats` | Chat messages |
| `GET/POST /api/ai` | AI assistant |
| `GET/POST /api/admin` | Admin operations |
| `POST /api/upload/image` | Image upload |

> 🔒 **Protected routes** require a valid JWT token in the `Authorization` header.

---

## 👥 Team

Developed by **Team AI-01-G07** as part of the Pet Care Management System project.

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
