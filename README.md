# Event Registration & Ticket QR Scanner

A full-stack event registration system with QR code ticket generation and scanning capabilities.

## Project Structure

```
activity_10/
├── backend/              # NestJS + TypeScript + MySQL Backend
├── frontend-admin/       # React Admin Web App (Port 3001)
├── frontend-organizer/  # React Organizer Web App (Port 3002)
└── frontend-attendee/   # React Attendee Web App (Port 3003)
```

## Features

### Backend (NestJS)
- ✅ User authentication with JWT
- ✅ Role-based access control (Admin, Organizer, Attendee)
- ✅ Event CRUD operations
- ✅ Ticket registration with unique QR code generation
- ✅ Duplicate registration prevention
- ✅ Capacity limit enforcement
- ✅ Ticket verification/check-in API
- ✅ Email notifications with QR codes

### Frontend - Admin App
- ✅ Dashboard with statistics
- ✅ Events list with search & filter
- ✅ Event details, edit, and delete
- ✅ Organizer dashboard for event creation
- ✅ User management (activate/deactivate, delete)
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
- MySQL (v8 or higher)
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

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your database credentials:
```
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=event_registration

JWT_SECRET=your-secret-key-change-this
JWT_EXPIRES_IN=7d

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@events.com

PORT=3000
NODE_ENV=development
```

5. Start the backend server:
```bash
npm run start:dev
```

The backend API will be available at `http://localhost:3000`

### Frontend Setup

#### Admin App (Port 3001)

1. Navigate to frontend-admin:
```bash
cd frontend-admin
npm install
npm run dev
```

#### Organizer App (Port 3002)

1. Navigate to frontend-organizer:
```bash
cd frontend-organizer
npm install
npm run dev
```

#### Attendee App (Port 3003)

1. Navigate to frontend-attendee:
```bash
cd frontend-attendee
npm install
npm run dev
```

## Database Schema

The application uses TypeORM with automatic schema synchronization in development mode. The main entities are:

- **User**: Users with roles (admin, organizer, attendee)
- **Event**: Events created by organizers
- **Ticket**: Tickets with QR codes for event registrations

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login

### Events
- `GET /events` - Get all events (with filters)
- `GET /events/:id` - Get event details
- `POST /events` - Create event (Admin/Organizer)
- `PATCH /events/:id` - Update event
- `DELETE /events/:id` - Delete event

### Tickets
- `POST /tickets/register` - Register for event
- `GET /tickets` - Get tickets (filtered by role)
- `GET /tickets/my-tickets` - Get current user's tickets
- `POST /tickets/verify/:ticketId` - Verify/check-in ticket (Admin/Organizer)
- `PATCH /tickets/:id/cancel` - Cancel ticket

### Users
- `GET /users/profile` - Get current user profile
- `GET /users` - Get all users (Admin only)
- `PATCH /users/:id` - Update user (Admin only)
- `PATCH /users/:id/toggle-active` - Toggle user status (Admin only)
- `DELETE /users/:id` - Delete user (Admin only)

## Usage

1. **Create an Admin Account**: Use the registration endpoint or create directly in the database with role 'admin'
2. **Create Organizer Accounts**: Admin can create organizer accounts through the user management interface
3. **Organizers Create Events**: Organizers can create and manage their events
4. **Attendees Register**: Attendees can browse events and register
5. **Check-in**: Organizers can scan QR codes at the venue to check in attendees

## Technologies Used

- **Backend**: NestJS, TypeScript, TypeORM, MySQL, JWT, QRCode, Nodemailer
- **Frontend**: React, TypeScript, Vite, React Router, TanStack Query, Axios
- **QR Scanner**: html5-qrcode (for organizer app)

## Notes

- Email functionality requires SMTP configuration. For Gmail, you'll need an App Password.
- QR codes are generated as base64 data URLs and stored in the database.
- The system prevents duplicate registrations and enforces capacity limits.
- All API endpoints require authentication except registration and login.

