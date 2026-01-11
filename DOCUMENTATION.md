# Event Registration System - Documentation

## Overview

Full-stack event registration system with QR code ticket generation and scanning. Three separate React applications (Admin, Organizer, Attendee) connected to a NestJS backend API.

**Tech Stack:**
- Backend: NestJS, TypeScript, SQLite, TypeORM, JWT
- Frontend: React, TypeScript, Vite, React Router, TanStack Query
- Ports: Backend (3000), Admin (3001), Organizer (3002), Attendee (3003)

---

## Frontend Applications

### Admin App (Port 3001)

**Access:** Admin role only

#### Pages

1. **Login** (`/login`)
   
   Authentication page for admin users to access the admin dashboard. Validates credentials and stores JWT token for session management.
   - Admin authentication

2. **Dashboard** (`/`)
   
   Central hub displaying system-wide statistics including total events, users, and tickets. Provides quick overview of platform activity and navigation to key sections.
   - System statistics (total events, users, tickets)
   - Recent activity overview
   - Quick access to key sections

3. **Events List** (`/events`)
   
   Comprehensive view of all events in the system with advanced search and filtering capabilities. Admins can filter by organizer or active status and navigate to detailed event pages.
   - View all events with search and filters
   - Filter by organizer, active status
   - Navigate to event details

4. **Event Details** (`/events/:id`)
   
   Detailed view of a specific event with full information display. Admins can edit event details, delete events, and view all registered attendees for the event.
   - View complete event information
   - Edit event details
   - Delete events
   - View registered attendees

5. **Organizer Dashboard** (`/organizer-dashboard`)
   
   Event creation interface allowing admins to create new events on behalf of organizers. Includes form fields for title, description, location, dates, capacity, and image upload.
   - Create new events
   - Form for event creation (title, description, location, dates, capacity, image)

6. **User Management** (`/users`)
   
   Complete user administration panel for managing all system users across all roles. Admins can create, edit, activate/deactivate, and delete users with full control over user accounts.
   - View all users (admin, organizer, attendee)
   - Create new users
   - Activate/deactivate users
   - Delete users
   - Edit user details

7. **Reports** (`/reports`)
   
   Analytics and reporting dashboard providing system-wide insights. Features data visualization, event registration statistics, and CSV export functionality for data analysis.
   - System-wide analytics
   - Export data to CSV
   - Event registration statistics

8. **My Tickets** (`/my-tickets`)
   
   Personal ticket management page for admins to view their own registered event tickets. Displays QR codes for each ticket and allows ticket cancellation.
   - View admin's registered tickets
   - QR code display
   - Ticket cancellation

---

### Organizer App (Port 3002)

**Access:** Organizer role only

#### Pages

1. **Login** (`/login`)
   
   Authentication page for organizer users to access the organizer dashboard. Validates credentials and establishes authenticated session.
   - Organizer authentication

2. **Dashboard** (`/`)
   
   Organizer's personal dashboard showing statistics for their own events including total events created, registrations received, and check-ins completed. Provides quick navigation to event management tools.
   - Organizer's event statistics
   - Total events, registrations, check-ins
   - Quick links to event management

3. **Event Management** (`/events`)
   
   Central event management interface where organizers can create, edit, and manage all their events. Supports full CRUD operations with image upload functionality for event branding.
   - Create, edit, and manage events
   - View all organizer's events
   - Event CRUD operations
   - Image upload support

4. **Attendees List** (`/attendees/:eventId`)
   
   Detailed attendee management page for a specific event. Organizers can view all registered attendees, search through the list, export to CSV, and see check-in status for each attendee.
   - View attendees for specific event
   - Search attendees
   - Export attendee list to CSV
   - Check-in status

5. **All Attendees** (`/attendees`)
   
   Comprehensive view of all attendees across all events managed by the organizer. Includes search and filter functionality to quickly find specific attendees.
   - View all attendees across all events
   - Search and filter functionality

6. **QR Scanner** (`/scanner/:eventId`)
   
   Real-time QR code scanning interface for event check-in. Uses device camera to scan ticket QR codes, verifies tickets, and updates check-in status instantly for efficient event entry management.
   - Real-time QR code scanning
   - Ticket verification/check-in
   - Check-in status updates

---

### Attendee App (Port 3003)

**Access:** Public (some pages), Attendee role (protected pages)

#### Pages

1. **Landing** (`/`)
   
   Public-facing homepage showcasing featured events and platform highlights. Designed to attract visitors with event previews and clear call-to-action buttons for registration and login.
   - Public landing page
   - Event highlights
   - Call-to-action for registration

2. **Login** (`/login`)
   
   User authentication interface for attendees to access their accounts. Features modal-based login for seamless user experience without full page navigation.
   - Attendee authentication
   - Modal-based authentication

3. **Register** (`/register`)
   
   New user registration page allowing attendees to create accounts. Collects essential information including email, password, name, and optional company details for account setup.
   - New user registration
   - Account creation form

4. **Events List** (`/events`)
   
   Browseable catalog of all available events with search and filter capabilities. Displays events as cards with key information and registration status indicators to help users find and register for events.
   - Browse all available events
   - Search and filter events
   - Event cards with key information
   - Registration status indicators

5. **Event Details** (`/events/:id`)
   
   Comprehensive event information page displaying full details including description, location, dates, capacity, and availability. Features a prominent registration button for users to sign up for the event.
   - Complete event information
   - Register for event button
   - Event description, location, dates
   - Capacity and availability

6. **My Tickets** (`/my-tickets`)
   
   Personal ticket management page where attendees can view all their registered event tickets. Displays QR codes for each ticket, allows ticket cancellation, and provides links to associated event information.
   - View registered tickets
   - Display QR codes
   - Cancel tickets
   - Event information linked to tickets

---

## Backend API Endpoints

Base URL: `http://localhost:3000`

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | Public | Register new user (email, password, name, company) |
| POST | `/auth/login` | Public | Login (email, password) |

### Events

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/events` | Optional | Any | Get all events (query: `search`, `organizerId`, `isActive`) |
| GET | `/events/:id` | Optional | Any | Get event details |
| POST | `/events` | Required | Admin, Organizer | Create event |
| PATCH | `/events/:id` | Required | Admin, Organizer* | Update event (*own events only) |
| POST | `/events/:id/cancel` | Required | Admin, Organizer* | Cancel event (sends emails, auto-deletes after 1h) |
| DELETE | `/events/:id` | Required | Admin, Organizer* | Delete event (only if no registrations) |

### Tickets

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/tickets/register` | Required | Attendee | Register for event (body: `eventId`) |
| GET | `/tickets` | Required | Any | Get tickets (query: `eventId`, `attendeeId`, `status`) |
| GET | `/tickets/my-tickets` | Required | Any | Get current user's tickets |
| GET | `/tickets/:id` | Required | Any | Get ticket details |
| POST | `/tickets/verify/:ticketId` | Required | Admin, Organizer | Verify/check-in ticket |
| PATCH | `/tickets/:id/cancel` | Required | Attendee* | Cancel ticket (*own tickets only) |

### Users

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/users/profile` | Required | Any | Get current user profile |
| POST | `/users` | Required | Admin | Create user |
| GET | `/users` | Required | Admin | Get all users |
| GET | `/users/attendees` | Required | Admin, Organizer | Get all attendees |
| GET | `/users/:id` | Required | Admin | Get user details |
| PATCH | `/users/:id` | Required | Admin | Update user |
| PATCH | `/users/:id/toggle-active` | Required | Admin | Toggle user active status |
| DELETE | `/users/:id` | Required | Admin | Delete user |

---

## Key Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Organizer, Attendee)
- Token expiration: 7 days (configurable)
- Password hashing with bcrypt

### Events Management
- CRUD operations for events
- Image upload support (base64 encoded)
- Capacity management
- Event cancellation with email notifications
- Automatic cleanup of cancelled events (after 1 hour)

### Ticket System
- Unique QR code generation per ticket
- Duplicate registration prevention
- Capacity limit enforcement
- Ticket verification/check-in
- Email confirmation with QR code attachment

### Email Notifications
- Ticket confirmation emails
- Event cancellation emails
- Announcement emails
- QR codes embedded as inline images

### Data Management
- SQLite database with TypeORM
- Automatic schema synchronization (development)
- Admin user auto-seeding
- CSV export functionality

---

## Database Schema

### User
- `id`, `email`, `password` (hashed), `name`, `company`, `role`, `isActive`, `createdAt`, `updatedAt`

### Event
- `id`, `title`, `description`, `location`, `startDate`, `endDate`, `capacity`, `imageUrl`, `organizerId`, `isActive`, `createdAt`, `updatedAt`

### Ticket
- `id`, `ticketId` (unique), `eventId`, `attendeeId`, `qrCode` (base64), `status`, `checkedInAt`, `createdAt`, `updatedAt`

---

## Environment Variables

See `backend/.env.example` for complete configuration:

**Required:**
- `JWT_SECRET` - JWT signing secret
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email configuration

**Optional:**
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (default: development)
- `DB_PATH` - Database path (default: database.sqlite)
- `JWT_EXPIRES_IN` - Token expiration (default: 7d)
- `SMTP_FROM` - Sender email (default: noreply@events.com)

---

## Setup Quick Start

1. **Backend:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run start:dev
   ```

2. **Frontend Apps:**
   ```bash
   cd frontend-admin (or frontend-organizer/frontend-attendee)
   npm install
   npm run dev
   ```

---

## Notes

- All API endpoints require authentication except `/auth/register` and `/auth/login`
- CORS enabled for ports 3001, 3002, 3003
- Body size limit: 50MB (for image uploads)
- QR codes stored as base64 data URLs
- Event cancellation triggers email to all registered attendees
- Cancelled events auto-delete after 1 hour
