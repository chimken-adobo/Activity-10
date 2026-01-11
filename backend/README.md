# Event Registration Backend

Backend API for Event Registration & Ticket QR Scanner system built with NestJS, TypeScript, and MySQL.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your database credentials and other settings.

4. Start the development server:
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login

### Events
- `GET /events` - Get all events (with optional filters)
- `GET /events/:id` - Get event details
- `POST /events` - Create event (Admin/Organizer only)
- `PATCH /events/:id` - Update event
- `DELETE /events/:id` - Delete event

### Tickets
- `POST /tickets/register` - Register for an event
- `GET /tickets` - Get tickets (filtered by role)
- `GET /tickets/my-tickets` - Get current user's tickets
- `GET /tickets/:id` - Get ticket details
- `POST /tickets/verify/:ticketId` - Verify/check-in ticket (Admin/Organizer only)
- `PATCH /tickets/:id/cancel` - Cancel ticket

### Users
- `GET /users/profile` - Get current user profile
- `GET /users` - Get all users (Admin only)
- `GET /users/:id` - Get user details (Admin only)
- `PATCH /users/:id` - Update user (Admin only)
- `PATCH /users/:id/toggle-active` - Toggle user active status (Admin only)
- `DELETE /users/:id` - Delete user (Admin only)

