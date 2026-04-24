# Bobba Express - Logistics Management Platform

A comprehensive logistics management system built with Node.js, Express, MongoDB, React, and Redux.

## 🚀 Features

### Authentication System
- ✅ JWT-based authentication with refresh tokens
- ✅ Role-based access control (Admin, Operations Manager, Center Staff, Hub Staff, Field Agent)
- ✅ Secure password hashing with bcrypt
- ✅ HttpOnly cookies for refresh token storage
- ✅ Modern authentication UI with React

### Core Logistics Features
- 📦 **Pickup Management**: Create and manage pickup requests
- 📋 **Parcel Management**: Track parcels through the logistics chain
- 🚚 **Shipment Management**: Manage shipments between locations
- 📍 **Tracking System**: Real-time tracking with status updates
- 👥 **Customer Management**: Customer data and relationship management

### Technology Stack

#### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Joi** - Input validation

#### Frontend
- **React** - UI framework
- **Redux Toolkit** - State management
- **React Router** - Navigation
- **Axios** - HTTP client
- **Vite** - Build tool

## 📁 Project Structure

```
Bobba Express/
├── client/                 # React frontend
│   ├── src/
│   │   ├── api/           # API integration
│   │   ├── pages/         # React components
│   │   ├── store/         # Redux store
│   │   └── lib/           # Utilities
│   ├── package.json
│   └── vite.config.js
├── server/                # Node.js backend
│   ├── controllers/       # Route controllers
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── src/              # Server configuration
│   └── package.json
├── docs/                 # Documentation
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (running locally)
- Git

### Backend Setup
```bash
cd server
npm install
cp .env.example .env  # Configure your environment variables
npm start
```

### Frontend Setup
```bash
cd client
npm install
npm run dev
```

### Environment Variables

#### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bobba-express
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRES_IN=7d
```

#### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:5000/api
```

## 🔐 Authentication Flow

1. **Registration**: Users register with email, password, and role
2. **Login**: Credentials verified, JWT tokens issued
3. **Access Token**: Short-lived (15 minutes) for API requests
4. **Refresh Token**: Long-lived (7 days) stored in HttpOnly cookies
5. **Token Refresh**: Automatic token refresh via API interceptors

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Logistics
- `GET/POST /api/pickups` - Pickup management
- `GET/POST /api/parcels` - Parcel management
- `GET/POST /api/shipments` - Shipment management
- `GET/POST /api/tracking` - Tracking information
- `GET/POST /api/customers` - Customer management

## 🎯 Usage

1. Start both backend and frontend servers
2. Open http://localhost:8080 (or configured port)
3. Register a new user or login with existing credentials
4. Access the dashboard and logistics features based on user role

## 🔧 Development

### Running Tests
```bash
# Backend tests
cd server && npm test

# Frontend tests
cd client && npm test
```

### Code Style
- ESLint configured for both frontend and backend
- Prettier for code formatting
- Git hooks for pre-commit validation

## 🚀 Deployment

### Backend Deployment
```bash
cd server
npm run build
npm start
```

### Frontend Deployment
```bash
cd client
npm run build
# Deploy dist/ folder to your hosting service
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions, please open an issue in the GitHub repository.

---

**Built with ❤️ for the logistics industry**
