# BLDR - Agentic World

A community and course platform with a Netflix-style UI, built for Hebrew-speaking audiences. BLDR provides an immersive learning experience with dark glassmorphism design, RTL layout, and a comprehensive admin panel.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI:** React 19, TypeScript, inline styles
- **Database:** Drizzle ORM
- **Design:** Dark theme with glassmorphism, RTL Hebrew interface

## Page Structure

### Platform (User-Facing)

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/dashboard` | Main overview with activity feed and next event banner |
| Courses | `/courses` | Netflix-style course catalog |
| Course Detail | `/courses/[courseId]` | Individual course with lesson list |
| Lesson | `/courses/[courseId]/lessons/[lessonId]` | Lesson player |
| Notebook | `/notebook` | Personal notes |
| Calendar | `/calendar` | Events and scheduling |
| Profile | `/profile` | User profile |
| Q&A | `/qa` | Community questions and answers |
| Chat | `/chat` | Messaging |

### Admin Panel

| Page | Path | Description |
|------|------|-------------|
| Admin Dashboard | `/admin` | Admin overview |
| Manage Courses | `/admin/courses` | Course CRUD |
| Manage Users | `/admin/users` | User management |
| Manage Q&A | `/admin/qa` | Moderate questions |
| Activity Feed | `/admin/activity-feed` | Activity management |
| Theme | `/admin/theme` | Theme customization |
| API Docs | `/admin/api-docs` | API documentation |

### Auth

- `/login` — Login page
- `/register` — Registration page

### API Routes

- `GET/POST /api/courses`
- `GET/POST /api/notes`
- `GET/POST /api/users`
- `GET/POST /api/activity-feed`
- `GET/POST /api/events`
- `GET/POST /api/questions`

## UI Components

Reusable components in `src/components/ui/`: Banner, Card, Progress, Avatar, Spotlight, Badge, Button, Input.

Layout components in `src/components/layout/`: Sidebar, Next Event Banner.

## Getting Started

```bash
# Install dependencies
npm install

# Run development server (port 3005)
npm run dev
```

Open [http://localhost:3005](http://localhost:3005) in your browser.

## License

Private
