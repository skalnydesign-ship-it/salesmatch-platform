# SalesMatch Pro - Mini App Frontend

Modern React TypeScript frontend for the SalesMatch Pro Telegram Mini App.

## 🚀 Features

- **Telegram Mini App Integration** - Full SDK support with native UI
- **Modern React 19** - Latest React with TypeScript
- **Vite Build System** - Fast development and optimized builds
- **Responsive Design** - Mobile-first design optimized for Telegram
- **Dark/Light Theme** - Automatic theme detection from Telegram
- **Real-time API** - Connected to backend API with proxy

## 📱 Pages

- **Auth** - Telegram authentication and onboarding
- **Profile** - User profile management and editing
- **Matching** - Swipe-based matching interface
- **Matches** - List of mutual matches
- **Messages** - Conversation list and chat interface

## 🛠️ Development

### Prerequisites

- Node.js 18+
- Backend API running on port 3000

### Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Available Scripts

- `npm run dev` - Start development server (port 3001)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=SalesMatch Pro
VITE_DEBUG=true
```

## 🏗️ Architecture

```
src/
├── components/          # Reusable UI components
│   └── Layout/         # Header, Navigation, etc.
├── contexts/           # React contexts (Auth, etc.)
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # API service layer
├── types/              # TypeScript type definitions
└── App.tsx             # Main app component
```

## 🎨 Styling

- **CSS Variables** - Telegram theme integration
- **Mobile-first** - Responsive design
- **Dark mode** - Automatic theme detection
- **Smooth animations** - Native-like feel

## 📡 API Integration

The frontend connects to the backend API through:

- **Proxy configuration** - Vite dev server proxies `/api/*` to backend
- **Axios client** - Centralized API service
- **Type safety** - Full TypeScript integration
- **Error handling** - Global error management

## 🚀 Deployment

### Production Build

```bash
npm run build
```

Output will be in `dist/` directory.

### Telegram Mini App

1. Build the frontend
2. Deploy to your hosting (Vercel, Netlify, etc.)
3. Update `WEBAPP_URL` in backend `.env`
4. Configure bot with Mini App URL

## 🔧 Configuration

### Vite Config

- **Port**: 3001 (development)
- **Proxy**: `/api/*` → `http://localhost:3000`
- **Build**: Optimized for production
- **Source maps**: Enabled for debugging

### Telegram Integration

- **SDK**: `@twa-dev/sdk` for WebApp features
- **Theme**: Automatic detection and application
- **Haptic feedback**: Native-like interactions
- **Back button**: Proper navigation handling

## 📱 Mobile Optimization

- **Touch-friendly** - Large tap targets
- **Swipe gestures** - Native swipe interactions
- **Safe areas** - iPhone notch support
- **Performance** - Optimized for mobile devices

## 🧪 Testing

Currently no tests configured. To add testing:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
```

## 📄 License

MIT License - see main project LICENSE file.