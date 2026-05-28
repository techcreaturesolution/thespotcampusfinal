# The Spot Campus Final - AI Powered Campus Placement Platform

A comprehensive AI-powered campus placement platform with advanced exam proctoring, Job Description-based exam generation, and a Flutter student mobile app.

## Key Features

### AI-Powered Exam Generation
- Generate MCQ exam papers automatically from Job Descriptions using OpenAI GPT-4o-mini
- Questions are tailored to skills, technologies, and requirements mentioned in the JD
- Configurable difficulty distribution (Easy/Medium/Hard)

### Advanced Exam Proctoring
- **Tab Lock**: Detects and records tab switching attempts
- **Camera Monitoring**: Periodic snapshots with face detection tracking
- **Full-Screen Mode**: Forces full-screen during exam
- **Copy/Paste Prevention**: Blocks clipboard operations
- **Right-Click Disabled**: Prevents context menu access
- **Screenshot Blocking**: Blocks PrintScreen and DevTools
- **Trust Score**: Real-time score (0-100) based on violations
- **Auto-Submit**: Automatically submits exam when max violations exceeded

### Multi-Role Access
- **Admin**: Full platform management
- **University**: Manage colleges, degrees, branches
- **College**: Handle student placements
- **TPO (Training & Placement Officer)**: Coordinate recruitment
- **Company**: Post jobs, create AI exams from JD, view proctoring results
- **Student**: Apply for jobs, take proctored exams

### Flutter Student Mobile App
- Native mobile experience for students
- Browse and apply for jobs
- Take proctored exams with app lifecycle monitoring
- Track application status
- View profile and results

## Tech Stack

### Backend
- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose**
- **OpenAI API** (GPT-4o-mini) for exam generation
- **Socket.IO** for real-time proctoring
- **JWT** authentication with HTTP-only cookies
- **Cloudinary** for file/image uploads
- **Razorpay** for payments

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for modern UI
- **React Router v6** for SPA routing
- **TanStack React Query** for data fetching
- **Recharts** for analytics
- **Socket.IO Client** for real-time features

### Mobile
- **Flutter 3** (Dart)
- **Provider** for state management
- **Camera** integration for proctoring
- **Material 3** design
- **Secure Storage** for tokens

## Project Structure

```
thespotcampusfinal/
├── backend/
│   ├── controllers/      # Business logic (14 controllers)
│   ├── models/            # Mongoose schemas (14 models)
│   ├── routes/            # Express routes (19 route files)
│   ├── middleware/        # Auth, validation, error handling, multer
│   ├── utils/             # AI generation, password hashing, JWT
│   ├── errors/            # Custom error classes
│   ├── server.js          # Main server with Socket.IO
│   └── package.json
├── client/
│   ├── src/
│   │   ├── pages/         # React pages (20+ pages)
│   │   ├── utils/         # API client, helpers
│   │   ├── App.jsx        # Router configuration
│   │   └── index.css      # Tailwind CSS
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── flutter_student_app/
│   ├── lib/
│   │   ├── screens/       # Flutter screens (8 screens)
│   │   ├── services/      # API & Auth services
│   │   ├── utils/         # Constants
│   │   └── main.dart      # App entry point
│   └── pubspec.yaml
└── README.md
```

## Setup

### Prerequisites
- Node.js 18+
- MongoDB
- OpenAI API key
- Cloudinary account
- Razorpay account (for payments)
- Flutter SDK 3+ (for mobile app)

### Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
npm run dev
```

### Frontend Setup
```bash
cd client
npm install
npm run dev
```

### Flutter App Setup
```bash
cd flutter_student_app
# Update baseUrl in lib/utils/constants.dart
flutter pub get
flutter run
```

### Environment Variables
```
PORT=5000
MONGO_URL=mongodb://localhost:27017/thespotcampus
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
NODE_ENV=development
CLOUD_NAME=your_cloudinary_name
CLOUD_API_KEY=your_cloudinary_key
CLOUD_API_SECRET=your_cloudinary_secret
OPENAI_API_KEY=your_openai_api_key
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
CLIENT_URL=http://localhost:5173
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Admin registration
- `POST /api/v1/auth/login` - Admin login
- `POST /api/v1/login` - Multi-role user login
- `GET /api/v1/login/logout` - Logout

### Exam (with JD Generation & Proctoring)
- `POST /api/v1/exam` - Create exam with AI-generated MCQs
- `POST /api/v1/exam/from-jd` - Generate exam from Job Description
- `PATCH /api/v1/exam/:id/proctoring` - Update proctoring settings

### Paper & Proctoring
- `POST /api/v1/paper/session/:examId` - Start proctored exam session
- `POST /api/v1/paper/:paperId/violation` - Record proctoring violation
- `POST /api/v1/paper/:paperId/snapshot` - Save camera snapshot
- `POST /api/v1/paper/:paperId/auto-submit` - Auto-submit on max violations
- `GET /api/v1/paper/:paperId/proctoring` - Get proctoring details

### Jobs & Applications
- `GET /api/v1/jobs/student` - Browse available jobs
- `POST /api/v1/application/:jobId` - Apply for a job

## Developed by
**Tech Creature Solution** - AI-powered educational technology solutions
