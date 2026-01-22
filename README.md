# TimeForge

TimeForge is a full-stack web application that helps you turn your available time into a realistic plan. You add what you want to work on (activities), set how much time you actually have, and TimeForge generates a schedule that fits your day instead of overloading it.

## Why I Built This

As someone managing multiple priorities—job search, side projects, learning, and personal goals—I constantly struggled with unrealistic to-do lists. I'd plan 8 hours of work when I only had 3 hours free, leading to constant feelings of falling behind.

TimeForge solves this by forcing you to confront your actual time budget. You define your available hours per day, create activities with estimated durations, and the app generates a schedule that respects your real constraints. No more planning to do everything—just what actually fits.

## Current Status

**✅ MVP Complete** - Full-stack application with authentication, persistent data, and core scheduling functionality.

## Features

### 🔐 Authentication
- Secure sign up and login with JWT-based sessions
- Cookie-based authentication for seamless user experience
- Protected routes - all data is user-specific

### 📅 Weekly Availability
- Set available hours and minutes for each day of the week
- Persistent storage - your availability is saved to the database
- Visual weekly overview of your time budget

### 🎯 Activity Management
- Create activities with tier-based prioritization:
  - **Main Quest** - Critical, high-impact work
  - **Side Quest** - Important but not urgent
  - **Bonus Round** - Nice-to-have tasks
  - **Free Play** - Low priority, flexible tasks
- Set priority levels (High, Medium, Low) within each tier
- Estimate time required for each activity
- Activities persist across sessions

### 📊 Smart Schedule Generation
- **Generate Today** - Schedule activities for today only
- **Generate Full Week** - Distribute activities across all available days
- Activities are automatically scheduled based on tier and priority
- Respects your daily time budget constraints

### ✏️ Manual Schedule Control
- **Add activities manually** to specific days via dropdown
- **Remove activities** from any day with one click
- **Clear entire schedule** to start fresh
- **Time overage warnings** - Get notified before exceeding your available time
- **Visual indicators** - Red borders and warnings when over budget

### 🎨 Calendar-Style Interface
- 7-day grid view showing your entire week at a glance
- Color-coded activities by tier (yellow = Main Quest, blue = Side Quest, etc.)
- Real-time time budget tracking (used/available per day)
- Clean, modern UI built with Tailwind CSS and shadcn/ui

### 💾 Data Persistence
- All data stored in SQLite database
- Schedules, activities, and availability persist across sessions
- Automatic data loading on page refresh

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for styling
- **shadcn/ui** for component library
- **React Router** for navigation
- **Axios** for API requests

### Backend
- **FastAPI** (Python) for high-performance REST API
- **SQLAlchemy** ORM for database interactions
- **SQLite** database (easily swappable to PostgreSQL)
- **JWT** authentication with secure cookies
- **Pydantic** for data validation

### Architecture
- RESTful API design
- JWT-based authentication
- Protected routes with user-specific data
- Abstract time budget model (cumulative minute tracking)

## Project Structure

```
timeforge/
├── frontend/               # React + TypeScript frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components (Dashboard, Activities, etc.)
│   │   ├── context/       # React context (AuthContext)
│   │   └── api.ts         # API client and type definitions
│   └── package.json
│
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── routers/       # API endpoints (auth, schedule, activities, etc.)
│   │   ├── models.py      # SQLAlchemy database models
│   │   ├── schemas.py     # Pydantic schemas for validation
│   │   ├── database.py    # Database configuration
│   │   └── main.py        # FastAPI app initialization
│   └── requirements.txt
│
└── README.md
```

## Setup Instructions

### Prerequisites
- **Python 3.9+** (for backend)
- **Node.js 18+** and npm (for frontend)
- **Git** (to clone the repository)

### 1. Clone the Repository

```bash
git clone https://github.com/mward3505/timeforge.git
cd timeforge
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
# On Mac/Linux:
python3 -m venv venv
source venv/bin/activate

# On Windows:
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload
```

The backend will run at `http://127.0.0.1:8000`

**API Documentation:** Visit `http://127.0.0.1:8000/docs` for interactive API docs (Swagger UI)

### 3. Frontend Setup

Open a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run at `http://localhost:5173` (or another port if 5173 is busy)

### 4. Use the Application

1. Open your browser to `http://localhost:5173`
2. Sign up for a new account
3. Set your weekly availability (hours per day)
4. Create some activities with tiers and priorities
5. Generate a schedule or manually add activities to specific days
6. Enjoy your realistic, time-budget-constrained schedule!

## How It Works

### The Time Budget Model

TimeForge uses an **abstract time budget** approach rather than clock-based scheduling:

- You set **available hours per day** (e.g., "4 hours available on Monday")
- Activities are allocated using **cumulative minute tracking**
- `start_minute` and `end_minute` track budget allocation, not actual clock times
- This allows flexibility—you decide when to actually do the work

### Scheduling Algorithm

When you click "Generate Schedule," TimeForge:

1. Sorts activities by tier (Main Quest > Side Quest > Bonus Round > Free Play)
2. Within each tier, sorts by priority (High > Medium > Low)
3. For each day with available time, allocates activities in order
4. Stops when the day's time budget is full
5. Moves to the next day and repeats

### Manual Control

You maintain full control:
- Remove auto-generated activities you don't want
- Manually add activities to specific days
- Get warned if you exceed your time budget
- Override warnings if needed

## API Endpoints

### Authentication
- `POST /auth/signup` - Create new user account
- `POST /auth/login` - Login and receive JWT token
- `POST /auth/logout` - Clear authentication cookie
- `GET /auth/me` - Get current user info

### Activities
- `GET /activities` - List all user activities
- `POST /activities` - Create new activity
- `DELETE /activities/{id}` - Delete activity

### Availability
- `GET /availability` - Get user's weekly availability
- `POST /availability` - Set weekly availability (upsert)

### Schedule Items
- `GET /schedule-items` - List all scheduled items
- `POST /schedule-items` - Manually add activity to a day
- `DELETE /schedule-items/{id}` - Remove activity from schedule

### Schedule Generation
- `POST /schedule/generate-today` - Generate schedule for today only
- `POST /schedule/generate-week` - Generate schedule for entire week

## Database Schema

### Users
- `id`, `username`, `email`, `hashed_password`

### Activities
- `id`, `user_id`, `name`, `tier`, `priority`, `estimated_minutes`

### Availability
- `id`, `user_id`, `day_of_week` (0-6), `available_minutes`

### ScheduleItems
- `id`, `user_id`, `activity_id`, `day_of_week`, `start_minute`, `end_minute`

## Deployment

### Backend (Railway/Render)
1. Create new project on Railway or Render
2. Connect your GitHub repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables if needed
6. Deploy!

### Frontend (Vercel/Netlify)
1. Create new project on Vercel or Netlify
2. Connect your GitHub repository
3. Set root directory to `frontend/`
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy!

The frontend automatically detects production vs local environments and uses the correct API URL.

## Key Learning Outcomes

Building TimeForge taught me:

### Full-Stack Development
- Designing RESTful APIs with FastAPI
- Building responsive UIs with React and TypeScript
- Managing application state with React hooks and Context API
- Implementing authentication flows with JWT

### Database & Backend
- ORM relationships with SQLAlchemy
- Data validation with Pydantic schemas
- Database migrations and schema design
- Secure authentication with password hashing and tokens

### Frontend Architecture
- Component composition and reusability
- API integration with Axios and TypeScript
- Form handling and user input validation
- Optimistic UI updates for better UX

### Product Thinking
- Solving a real problem I personally experienced
- Iterating based on user feedback (my own!)
- Balancing feature completeness with MVP scope
- Focusing on UX polish (warnings, visual feedback, clear messaging)

## Future Enhancements

While the MVP is complete, potential improvements include:

- **Drag-and-drop reordering** of activities within a day
- **Week-over-week tracking** to see what you actually accomplished
- **Activity templates** for recurring tasks
- **Time blocking with actual clock times** (optional mode)
- **Export schedule** to calendar apps (Google Calendar, iCal)
- **Mobile-responsive design** improvements
- **Dark/light theme toggle**
- **PostgreSQL** migration for production scalability

## License

MIT License - Feel free to use this project as a reference or starting point for your own work!

## Contact

**Matt Ward**
- GitHub: [@mward3505](https://github.com/mward3505)
- Project Link: [https://github.com/mward3505/timeforge](https://github.com/mward3505/timeforge)

---

Built as a capstone project to demonstrate full-stack development skills and solve a real personal problem.
