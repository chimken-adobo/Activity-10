# Event Registration Backend

Backend API for Event Registration & Ticket QR Scanner system built with NestJS, TypeScript, and SQLite.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
# On Windows (PowerShell)
Copy-Item .env.example .env

# On Linux/Mac
cp .env.example .env
```

3. Update the `.env` file with your configuration. See `.env.example` for detailed documentation of all available options.

**Required Environment Variables:**
- `JWT_SECRET` - Secret key for signing JWT tokens (IMPORTANT: Change this in production!)
- `SMTP_HOST` - SMTP server hostname (e.g., smtp.gmail.com)
- `SMTP_PORT` - SMTP server port (e.g., 587)
- `SMTP_USER` - SMTP authentication username/email
- `SMTP_PASS` - SMTP authentication password (for Gmail, use an App Password)

**Optional Environment Variables:**
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode: `development` or `production` (default: development)
  - In development: database auto-sync enabled, logging enabled
  - In production: database auto-sync disabled, logging disabled
- `DB_PATH` - SQLite database file path (default: database.sqlite at project root)
- `JWT_EXPIRES_IN` - JWT token expiration time (default: 7d)
- `SMTP_FROM` - Default sender email address (default: noreply@events.com)

4. The database file (`database.sqlite`) will be created automatically at the project root (or path specified in `DB_PATH`).

5. Start the development server:
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

**Note:** An admin user is automatically seeded on startup if it doesn't exist. Check the seed script for default credentials.

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
  - Body: `{ email, password, name, company? }`
  - Returns: `{ message, user }`
- `POST /auth/login` - Login
  - Body: `{ email, password }`
  - Returns: `{ access_token, user }`

### Events
- `GET /events` - Get all events (with optional filters)
  - Query params: `search`, `organizerId`, `isActive` (true/false)
  - Returns: Array of events
- `GET /events/:id` - Get event details
  - Returns: Event object with organizer and ticket count
- `POST /events` - Create event (Admin/Organizer only)
  - Body: `{ title, description, location, startDate, endDate, capacity, imageUrl? }`
  - Returns: Created event
- `PATCH /events/:id` - Update event
  - Body: Partial event data
  - Organizers can only update their own events
  - Returns: Updated event
- `POST /events/:id/cancel` - Cancel event
  - Sends cancellation emails to all registered attendees
  - Event is automatically deleted after 1 hour
  - Returns: `{ message: 'Event cancelled and deleted successfully' }`
- `DELETE /events/:id` - Delete event
  - Only works if event has no registrations
  - Returns: `{ message: 'Event deleted successfully' }`

### Tickets
- `POST /tickets/register` - Register for an event
  - Body: `{ eventId }`
  - Requires authentication
  - Generates QR code and sends confirmation email
  - Returns: Created ticket with QR code
- `GET /tickets` - Get tickets (filtered by role)
  - Query params: `eventId`, `attendeeId`, `status` (PENDING, CONFIRMED, CANCELLED, CHECKED_IN)
  - Attendees only see their own tickets
  - Admin/Organizer see all tickets
  - Returns: Array of tickets
- `GET /tickets/my-tickets` - Get current user's tickets
  - Returns: Array of user's tickets
- `GET /tickets/:id` - Get ticket details
  - Returns: Ticket object with event and attendee details
- `POST /tickets/verify/:ticketId` - Verify/check-in ticket (Admin/Organizer only)
  - Marks ticket as checked in
  - Returns: Updated ticket
- `PATCH /tickets/:id/cancel` - Cancel ticket
  - Requires authentication
  - Users can only cancel their own tickets
  - Returns: Updated ticket

### Users
- `GET /users/profile` - Get current user profile
  - Requires authentication
  - Returns: Current user object (without password)
- `POST /users` - Create user (Admin only)
  - Body: `{ email, password, name, company?, role }`
  - Returns: Created user (without password)
- `GET /users` - Get all users (Admin only)
  - Returns: Array of all users
- `GET /users/attendees` - Get all attendees (Admin/Organizer only)
  - Returns: Array of attendee users
- `GET /users/:id` - Get user details (Admin only)
  - Returns: User object
- `PATCH /users/:id` - Update user (Admin only)
  - Body: Partial user data
  - Returns: Updated user
- `PATCH /users/:id/toggle-active` - Toggle user active status (Admin only)
  - Returns: Updated user with toggled `isActive` status
- `DELETE /users/:id` - Delete user (Admin only)
  - Returns: `{ message: 'User deleted successfully' }`

## Features

- **Authentication**: JWT-based authentication with role-based access control
- **Email Notifications**: 
  - Ticket confirmation emails with QR codes
  - Event cancellation emails
  - Announcement emails
- **QR Code Generation**: Unique QR codes generated for each ticket
- **Automatic Cleanup**: Cancelled events are automatically deleted after 1 hour
- **Admin Seeding**: Admin user is automatically created on startup if it doesn't exist
- **CORS**: Configured to accept requests from frontend apps (ports 3001, 3002, 3003)
- **Body Size Limit**: Increased to 50MB to support base64-encoded images
- **Validation**: Global validation pipe with automatic type conversion

## Database

- **Type**: SQLite
- **Location**: `database.sqlite` at project root (or path specified in `DB_PATH`)
- **Schema Sync**: Automatic in development mode, disabled in production
- **Entities**: User, Event, Ticket

## Development Scripts

- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start:prod` - Start production server (requires build first)
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage

## Security Notes

- **JWT Secret**: Always use a strong, random secret in production
- **Password Hashing**: Passwords are hashed using bcrypt
- **Token Expiration**: Default is 7 days (configurable via `JWT_EXPIRES_IN`)
- **Email Passwords**: For Gmail, use App Passwords, not your regular password
- **Database**: In production, disable auto-sync and use migrations

## Email Configuration

For Gmail:
1. Enable 2-Step Verification
2. Generate an App Password at: https://myaccount.google.com/apppasswords
3. Use the App Password in `SMTP_PASS`

For other email providers, check their SMTP settings documentation.
