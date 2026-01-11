# Event Registration & Ticket QR Scanner

A full-stack event registration system with QR code ticket generation and scanning capabilities.

## Project Structure

```
activity_10/
├── backend/              # NestJS + TypeScript + SQLite Backend
├── frontend-admin/       # React Admin Web App (Port 3001)
├── frontend-organizer/  # React Organizer Web App (Port 3002)
└── frontend-attendee/   # React Attendee Web App (Port 3003)
```

## Features

### Backend (NestJS)
- ✅ User authentication with JWT
- ✅ Role-based access control (Admin, Organizer, Attendee)
- ✅ Event CRUD operations
- ✅ Event cancellation with automatic cleanup
- ✅ Ticket registration with unique QR code generation
- ✅ Duplicate registration prevention
- ✅ Capacity limit enforcement
- ✅ Ticket verification/check-in API
- ✅ Email notifications with QR codes
- ✅ Automatic cleanup of cancelled events (after 1 hour)
- ✅ Admin user auto-seeding on startup

### Frontend - Admin App
- ✅ Dashboard with statistics
- ✅ Events list with search & filter
- ✅ Event details, edit, and delete
- ✅ Organizer dashboard for event creation
- ✅ User management (create, activate/deactivate, delete)
- ✅ Reports & CSV export
- ✅ My Tickets view

### Frontend - Organizer App
- ✅ Event creation and management
- ✅ View registered attendees
- ✅ QR code scanner for check-in
- ✅ Search attendees
- ✅ Export attendee list to CSV

### Frontend - Attendee App
- ✅ Event discovery and search
- ✅ Event registration
- ✅ View event details
- ✅ My Tickets with QR codes
- ✅ Cancel tickets
- ✅ Email notifications

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
# On Windows (PowerShell)
Copy-Item .env.example .env

# On Linux/Mac
cp .env.example .env
```

4. Update the `.env` file with your configuration. See `backend/.env.example` for all available options:

**Required Configuration:**
- `JWT_SECRET` - Secret key for JWT tokens (change in production!)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email server configuration

**Optional Configuration:**
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode: `development` or `production` (default: development)
- `DB_PATH` - SQLite database path (default: database.sqlite at project root)
- `JWT_EXPIRES_IN` - JWT token expiration (default: 7d)
- `SMTP_FROM` - Default sender email address (default: noreply@events.com)

5. Start the development server:
```bash
npm run start:dev
```

The backend API will be available at `http://localhost:3000`

**Note:** An admin user is automatically seeded on startup if it doesn't exist. Default credentials are typically set in the seed script.

### Frontend Setup

All frontend applications use Vite and run on different ports. Each frontend connects to the backend API at `http://localhost:3000`.

#### Admin App (Port 3001)

1. Navigate to frontend-admin:
```bash
cd frontend-admin
npm install
npm run dev
```

The app will be available at `http://localhost:3001`

#### Organizer App (Port 3002)

1. Navigate to frontend-organizer:
```bash
cd frontend-organizer
npm install
npm run dev
```

The app will be available at `http://localhost:3002`

#### Attendee App (Port 3003)

1. Navigate to frontend-attendee:
```bash
cd frontend-attendee
npm install
npm run dev
```

The app will be available at `http://localhost:3003`

## Database Schema

The application uses TypeORM with automatic schema synchronization in development mode. The main entities are:

- **User**: Users with roles (admin, organizer, attendee)
  - Fields: id, email, password (hashed), name, company, role, isActive, createdAt, updatedAt
- **Event**: Events created by organizers
  - Fields: id, title, description, location, startDate, endDate, capacity, imageUrl, organizerId, isActive, createdAt, updatedAt
- **Ticket**: Tickets with QR codes for event registrations
  - Fields: id, ticketId (unique), eventId, attendeeId, qrCode (base64), status, checkedInAt, createdAt, updatedAt

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user (public)
- `POST /auth/login` - Login (public)

### Events
- `GET /events` - Get all events (with optional filters: search, organizerId, isActive)
- `GET /events/:id` - Get event details
- `POST /events` - Create event (Admin/Organizer only)
- `PATCH /events/:id` - Update event (requires authentication, organizer can only update own events)
- `POST /events/:id/cancel` - Cancel event (sends cancellation emails, auto-deletes after 1 hour)
- `DELETE /events/:id` - Delete event (only if no registrations exist)

### Tickets
- `POST /tickets/register` - Register for an event (requires authentication)
- `GET /tickets` - Get tickets (filtered by role and optional filters: eventId, attendeeId, status)
- `GET /tickets/my-tickets` - Get current user's tickets
- `GET /tickets/:id` - Get ticket details
- `POST /tickets/verify/:ticketId` - Verify/check-in ticket (Admin/Organizer only)
- `PATCH /tickets/:id/cancel` - Cancel ticket

### Users
- `GET /users/profile` - Get current user profile (requires authentication)
- `POST /users` - Create user (Admin only)
- `GET /users` - Get all users (Admin only)
- `GET /users/attendees` - Get all attendees (Admin/Organizer only)
- `GET /users/:id` - Get user details (Admin only)
- `PATCH /users/:id` - Update user (Admin only)
- `PATCH /users/:id/toggle-active` - Toggle user active status (Admin only)
- `DELETE /users/:id` - Delete user (Admin only)

## Usage

1. **Start the Backend**: Run `npm run start:dev` in the backend directory
2. **Start Frontend Apps**: Run `npm run dev` in each frontend directory
3. **Access Applications**:
   - Admin: http://localhost:3001
   - Organizer: http://localhost:3002
   - Attendee: http://localhost:3003
4. **Create Accounts**: Use the registration endpoints or admin interface
5. **Create Events**: Organizers can create and manage their events
6. **Register for Events**: Attendees can browse events and register
7. **Check-in**: Organizers can scan QR codes at the venue to check in attendees

## Technologies Used

- **Backend**: NestJS, TypeScript, TypeORM, SQLite, JWT, QRCode, Nodemailer
- **Frontend**: React, TypeScript, Vite, React Router, TanStack Query, Axios
- **QR Scanner**: html5-qrcode (for organizer app)

## Important Notes

- **Email Configuration**: Email functionality requires SMTP configuration. For Gmail, you'll need an App Password (not your regular password). Generate one at: https://myaccount.google.com/apppasswords
- **QR Codes**: QR codes are generated as base64 data URLs and stored in the database. They're also sent via email as inline images.
- **Security**: 
  - All API endpoints require authentication except registration and login
  - JWT tokens expire after 7 days by default (configurable via `JWT_EXPIRES_IN`)
  - Passwords are hashed using bcrypt
- **Event Cancellation**: When an event is cancelled:
  - All registered attendees receive cancellation emails
  - The event is marked as cancelled and automatically deleted after 1 hour
  - This prevents accidental deletions while allowing cleanup
- **Capacity Limits**: The system prevents duplicate registrations and enforces capacity limits
- **CORS**: Backend is configured to accept requests from frontend apps on ports 3001, 3002, and 3003
- **Body Size Limit**: Increased to 50MB to support base64-encoded images

## Development

### Backend Scripts
- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests

### Database
- The SQLite database file is created automatically at the project root (or path specified in `DB_PATH`)
- In development mode, TypeORM automatically synchronizes the schema
- In production mode, auto-sync is disabled for safety
