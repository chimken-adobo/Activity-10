# Setup Instructions - Copy & Paste Ready

## Prerequisites Check

```bash
# Check Node.js version (should be v18 or higher)
node --version

# Check npm version
npm --version
```

---

## Backend Setup

### Step 1: Navigate to Backend Directory

```bash
cd backend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Create Environment File

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Linux/Mac:**
```bash
cp .env.example .env
```

### Step 4: Edit Environment File

Open `.env` file and update the following required values:

```
JWT_SECRET=your-secret-key-change-this-to-random-string
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Note:** For Gmail, you need to generate an App Password at: https://myaccount.google.com/apppasswords

### Step 5: Start Backend Server

```bash
npm run start:dev
```

**Expected Output:** `Application is running on: http://localhost:3000`

**Keep this terminal window open!**

---

## Frontend Setup

Open **3 new terminal windows** (one for each frontend app).

### Frontend Admin App (Terminal 1)

```bash
cd frontend-admin
npm install
npm run dev
```

**Expected Output:** App running on `http://localhost:3001`

**Keep this terminal window open!**

---

### Frontend Organizer App (Terminal 2)

```bash
cd frontend-organizer
npm install
npm run dev
```

**Expected Output:** App running on `http://localhost:3002`

**Keep this terminal window open!**

---

### Frontend Attendee App (Terminal 3)

```bash
cd frontend-attendee
npm install
npm run dev
```

**Expected Output:** App running on `http://localhost:3003`

**Keep this terminal window open!**

---

## Access the Applications

Once all servers are running, access the applications at:

- **Backend API:** http://localhost:3000
- **Admin App:** http://localhost:3001
- **Organizer App:** http://localhost:3002
- **Attendee App:** http://localhost:3003

---

## Quick Start (All-in-One Commands)

### Windows PowerShell (Run from project root)

```powershell
# Backend
cd backend
npm install
Copy-Item .env.example .env
# Edit .env file with your SMTP credentials
npm run start:dev

# In new terminal - Admin App
cd frontend-admin
npm install
npm run dev

# In new terminal - Organizer App
cd frontend-organizer
npm install
npm run dev

# In new terminal - Attendee App
cd frontend-attendee
npm install
npm run dev
```

### Linux/Mac (Run from project root)

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env file with your SMTP credentials
npm run start:dev

# In new terminal - Admin App
cd frontend-admin
npm install
npm run dev

# In new terminal - Organizer App
cd frontend-organizer
npm install
npm run dev

# In new terminal - Attendee App
cd frontend-attendee
npm install
npm run dev
```

---

## Troubleshooting

### Port Already in Use

If you get "port already in use" error:

```bash
# Windows - Find and kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac - Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database Not Found

The database file (`database.sqlite`) will be created automatically on first run. No manual setup needed.

### Email Not Working

- Make sure SMTP credentials are correct in `.env`
- For Gmail: Use App Password, not regular password
- Check that 2-Step Verification is enabled on Gmail

### Module Not Found Errors

```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

---

## Stopping the Servers

Press `Ctrl + C` in each terminal window to stop the servers.

---

## Development Notes

- Backend auto-reloads on file changes (watch mode)
- Frontend apps auto-reload on file changes (Vite HMR)
- Database auto-syncs in development mode
- Admin user is auto-seeded on backend startup
