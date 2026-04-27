# BobbaExpress - Development Guide

## Quick Start

### Option 1: Production Mode
```bash
# Double-click or run:
start.bat
```

### Option 2: Development Mode (Recommended)
```bash
# Double-click or run:
start-dev.bat
```

### Option 3: Stop All Servers
```bash
# Double-click or run:
stop.bat
```

## Manual Start

### Backend Server (Port 5000)
```bash
cd D:\Bobba Express\server
npm run dev    # Development with auto-restart
# OR
node src/server.js  # Production
```

### Frontend Server (Port 8080)
```bash
cd D:\Bobba Express\client
npm run dev
```

## Access Points

- **Frontend Application**: http://localhost:8080
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

## User Accounts

### Default Admin
- **Email**: admin@bobbaexpress.com
- **Password**: admin123
- **Role**: Admin

### Test Agent
- **Email**: agent@bobbaexpress.com  
- **Password**: agent123
- **Role**: Agent

### Test Staff
- **Email**: staff@bobbaexpress.com
- **Password**: staff123
- **Role**: Staff

## Features

### Agent Dashboard (/agent)
- Mobile-first design
- GPS location capture
- Pickup status updates
- Parcel logging
- Real-time notifications

### Admin Dashboard (/dashboard)
- User management
- Agent assignment
- Analytics charts
- Customer management
- Pickup and parcel tracking

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Token refresh

#### Users
- `GET /api/users?role=agent` - Get agents
- `GET /api/users/me` - Current user profile

#### Pickups
- `GET /api/pickups?onlyMine=true` - Agent's pickups
- `PUT /api/pickups/:id/assign` - Assign agent
- `PATCH /api/pickups/:id/status` - Update status

#### Parcels
- `GET /api/parcels` - List parcels
- `POST /api/parcels` - Create parcel

## Development Tools

### Hot Reload
- **Frontend**: Vite auto-reload on file changes
- **Backend**: Nodemon restart on file changes (dev mode)

### Debugging
- **Browser DevTools**: F12 in browser
- **Network Tab**: Monitor API calls
- **Console**: Error logging and debugging
- **React DevTools**: Component inspection

### Database
- **MongoDB**: Local MongoDB instance
- **Connection**: Automatically connects on startup

## Troubleshooting

### Port Already in Use
```bash
# Stop all Node.js processes
stop.bat

# Or manually:
taskkill /f /im node.exe
```

### Frontend Not Loading
1. Check if backend is running on port 5000
2. Verify MongoDB is accessible
3. Check browser console for errors

### API Errors
1. Verify backend server is running
2. Check API endpoint URLs
3. Verify authentication tokens

## Project Structure

```
Bobba Express/
├── client/                 # React frontend
│   ├── src/
│   │   ├── api/           # API calls
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   └── store/         # Redux store
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Auth middleware
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   └── server.js      # Server entry
│   └── package.json
├── start.bat              # Quick start script
├── start-dev.bat          # Development start script
├── stop.bat               # Stop all servers
└── README-DEVELOPMENT.md   # This file
```

## Technology Stack

### Frontend
- **React 19** - UI framework
- **Redux Toolkit** - State management
- **React Router** - Navigation
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

### Backend
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Joi** - Validation

## Production Deployment

### Environment Variables
Create `.env` files in both `client` and `server` directories:

#### Server/.env
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bobbaexpress
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:8080
```

#### Client/.env
```
VITE_API_BASE_URL=http://localhost:5000/api
```

### Build Commands
```bash
# Frontend build
cd client
npm run build

# Backend production start
cd server
npm start
```

## Support

For issues or questions:
1. Check the troubleshooting section
2. Verify all servers are running
3. Check browser console for errors
4. Review API responses in Network tab

---

**BobbaExpress Logistics Platform** - Complete logistics management solution
