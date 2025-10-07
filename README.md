<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Community Workers Job Quizzes

An interactive career exploration quiz app for elementary school students. Students take a photo, answer questions, and receive personalized career recommendations with AI-generated portraits.

## 🎯 Features

- 📸 **Camera Integration**: iPad camera support for student photos
- 🎨 **Interactive Quiz**: Engaging questions to discover career interests
- 🤖 **AI-Powered**: Gemini API generates personalized career guidance
- 🖼️ **Image Processing**: n8n workflow automation with AI portrait generation
- ☁️ **Cloud Storage**: Cloudinary for photo hosting
- 📊 **Data Management**: Airtable database with real-time status tracking

## 🏗️ Architecture

**Monorepo Single-Service (Express + React)**

```
Development:
  Frontend (Vite)         Backend (Express)
      ↓                        ↓
  Port 3000              Port 4000
      ↓ Proxy /api/*            ↓
  React SPA              API Routes

Production:
  Express Server (Port 4000)
      ├── Static Files: dist/ (Frontend)
      └── API Routes: /api/* (Backend)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Airtable account
- Cloudinary account
- Google Gemini API key
- n8n instance (optional, for image processing)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Community-Workers-Job-Quizzes
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create `.env.local` in the project root:
   ```bash
   # Frontend (Vite build-time variables)
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   VITE_CLOUDINARY_UPLOAD_PRESET=your_preset

   # Backend (Runtime variables)
   NODE_ENV=development
   PORT=4000
   AIRTABLE_API_KEY=your_api_key
   AIRTABLE_BASE_ID=your_base_id
   AIRTABLE_TABLE_NAME=Students
   GEMINI_API_KEY=your_gemini_key
   N8N_WEBHOOK_URL=your_n8n_webhook
   ```

4. **Run the app**
   ```bash
   npm run dev
   ```
   - Frontend: http://localhost:3000
   - Backend: http://localhost:4000

## 📦 Deployment

### Zeabur (Recommended)

This project is configured for single-service deployment on Zeabur.

1. **Connect GitHub repository**
   - Select `development` branch

2. **Set environment variables** in Zeabur dashboard:
   - All `VITE_*` variables (frontend build-time)
   - All backend runtime variables
   - See [ZEABUR-DEPLOYMENT-GUIDE.md](ZEABUR-DEPLOYMENT-GUIDE.md) for details

3. **Deploy**
   - Zeabur will automatically:
     - Run `npm run build` (builds frontend)
     - Run `npm start` (starts Express server)
     - Express serves both static files and API

📖 **Full deployment guide**: [ZEABUR-DEPLOYMENT-GUIDE.md](ZEABUR-DEPLOYMENT-GUIDE.md)

## 📁 Project Structure

```
Community-Workers-Job-Quizzes/
├── components/           # React components
│   ├── StartScreen.tsx   # Name/class input + camera
│   ├── QuizScreen.tsx    # Quiz questions
│   ├── ResultsScreen.tsx # Results + AI description
│   └── ProcessingStatus.tsx # Status polling + result photo
├── server/               # Backend Express server
│   ├── index.ts          # Server entry + static file serving
│   └── routes/           # API endpoints
│       ├── upload.ts     # Photo upload
│       ├── questionnaire.ts # Quiz submission
│       ├── status.ts     # Status polling
│       └── gemini.ts     # 🔒 AI description (secure)
├── utils/                # Utility functions
│   ├── api.ts            # API client
│   └── scoring.ts        # Quiz scoring algorithm
├── config/               # Configuration
│   └── api.ts            # API URL config (Monorepo)
└── dist/                 # Production build output
```

## 🔐 Security

- ✅ **API Keys protected**: Gemini API calls are made from backend only
- ✅ **Environment variables**: All secrets in `.env.local` (gitignored)
- ✅ **Secure architecture**: No API keys exposed in frontend bundle
- ✅ **CORS configured**: Backend validates request origins

## 🛠️ Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite 6
- TailwindCSS (CDN)

**Backend:**
- Express 5 + TypeScript
- Airtable (database)
- Google Gemini API (AI)

**Infrastructure:**
- Cloudinary (image storage)
- n8n (workflow automation)
- Zeabur (deployment)

## 📚 Documentation

- [ZEABUR-DEPLOYMENT-GUIDE.md](ZEABUR-DEPLOYMENT-GUIDE.md) - Complete deployment guide
- [CLAUDE.md](CLAUDE.md) - Development rules and guidelines
- [README_SETUP.md](README_SETUP.md) - Detailed setup instructions

## 🔄 Workflow

1. **Student takes photo** → Uploaded to Cloudinary
2. **Photo URL saved to Airtable** → Record created
3. **Student completes quiz** → Answers submitted to backend
4. **Backend triggers n8n webhook** → Image processing starts
5. **n8n workflow**:
   - Calls Gemini API for portrait generation
   - Uploads result to Cloudinary
   - Updates Airtable with result URL
6. **Frontend polls status** → Shows result when ready

## 🤝 Contributing

This project follows strict development guidelines defined in [CLAUDE.md](CLAUDE.md):

- Use `development` branch for all work
- Commit frequently with descriptive messages
- No duplicate files or technical debt
- Update documentation when making changes

## 📄 License

This project is for educational purposes.

---

**Built with ❤️ for elementary school students**
