# 🌍 MTA Planner – AI-Powered Travel Planning Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-mytripadvisior.co.in-blue?style=for-the-badge&logo=googlechrome)](https://mytripadvisior.co.in/)
[![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=for-the-badge&logo=postgresql)](https://supabase.com/)

**MTA Planner** is a state-of-the-art, AI-powered full-stack travel planning platform built to help travelers create personalized, intelligent, and cost-optimized trip itineraries. Leveraging cutting-edge AI models (OpenAI & Perplexity), real-time weather forecasts, interactive maps, dynamic currency exchange rates, custom wishlists, and PDF exports, MTA Planner turns complex travel planning into a seamless, stress-free experience.

🔗 **Live Website:** [https://mytripadvisior.co.in/](https://mytripadvisior.co.in/)

---

## 🌟 Comprehensive Features Guide

### 🧠 1. AI-Powered Itinerary Generation
- **Tailored Day-by-Day Itineraries**: Instant generation of structured travel itineraries based on destination, travel dates, trip duration, party size, and age group breakdown (children, adults, seniors).
- **Multiple AI Models**: Powered by OpenAI (`GPT-4o`/`GPT-3.5-Turbo`) and Perplexity API for rich, context-aware destination insights and up-to-date travel recommendations.
- **Budget Tiers**: Choose between *Budget-Friendly*, *Moderate*, *Luxury*, or *No Limit* to receive realistic cost estimations and activity recommendations matching your spending power.
- **Pacing & Activity Levels**: Tailor schedule intensity (*Relaxed*, *Moderate*, *Active*, *Very Active*) to ensure comfortable travel pacing.
- **Dietary & Accessibility Customization**: Support for dietary restrictions (Vegan, Vegetarian, Gluten-Free, Halal, Kosher, etc.) and accessibility needs (Wheelchair accessible, Low mobility, Step-free routes).
- **Niche & Theme Interests**: Select travel preferences such as Adventure, Culture, Historical Sites, Foodie & Dining, Nature, Nightlife, Shopping, or Relaxation.

### 🗺️ 2. Interactive Maps & Route Visualization
- **Leaflet & React-Leaflet Map Integration**: View attraction markers, daily itineraries, and route paths on interactive responsive maps.
- **Geocoding & Location Validation**: Built-in location validation engine covering 190+ countries and global cities with automatic spatial mapping.

### 🌦️ 3. Real-Time Weather & Historical Climate Preview
- **Multi-Day Weather Forecast**: Live weather widgets displaying temperature, humidity, wind speed, precipitation, and conditions for chosen travel dates.
- **Historical Climate Insights**: Preview historical climate data per month to plan ideal travel seasons for any global destination.
- **Smart Packing Suggestions**: Automated recommendations on clothing and gear tailored to forecasted weather conditions.

### 💰 4. Trip Cost Estimator & Live Exchange Rates
- **Categorized Cost Breakdown**: Granular cost estimates broken down by Accommodation, Dining, Activities, Transport, and Miscellaneous expenses.
- **Multi-Currency Support**: Real-time currency conversions powered by live exchange rate APIs.
- **Customizable Expense Budgeting**: Adjust daily spend limits and visualize total cost variances instantly.

### 🏨 5. Smart Hotel & Accommodation Suggestions
- **Proximity-Based Recommendations**: Hotel recommendations matching daily itinerary locations.
- **Filter by Budget & Party Size**: Automated suggestions sorted by rating, price point, amenities, and room availability suitability.

### 📋 6. Wishlist & Saved Trips Management
- **Custom Wishlists**: Group saved itineraries into custom collections (e.g., "Summer 2025", "Weekend Getaways", "Europe Tour").
- **Personal Notes & Annotations**: Add private notes, travel reminders, or custom budget notes to wishlist items.
- **Public & Private Modes**: Toggle wishlist visibility between private personal collections or public shareable links.

### 🔗 7. Public Token Sharing & Group Collaboration
- **Secure Token-Based Share Links**: Generate unique, public sharing tokens (`/share/[token]`) for any trip or wishlist.
- **Read-Only Shared Views**: Enable friends, family, or travel groups to view detailed day-by-day itineraries, maps, cost breakdowns, and hotel suggestions without requiring account creation.

### 📄 8. Offline PDF Exporting
- **Client-Side & Server PDF Generation**: Powered by `@react-pdf/renderer` and `react-pdf`.
- **Printable Travel Guides**: Download sleek, beautifully styled PDF trip documents complete with daily activity schedules, emergency contacts, hotel info, and travel notes for offline access.

### 🔔 9. Comprehensive Notification System
- **Multi-Category Notifications**: In-app alerts for Trip Status Updates, Price Drop Alerts, Smart Recommendations, Social Collaboration, and Reminders.
- **Priority Queues**: Notifications classified into `URGENT`, `HIGH`, `NORMAL`, and `LOW` priority levels with visual indicators and badge counts.
- **Quiet Hours Scheduling**: Set preferred quiet hours (e.g., 10:00 PM – 8:00 AM) to silence non-urgent alerts.
- **Multi-Channel Delivery Preferences**: Customize delivery options across In-App Notification Bell, Email (Nodemailer / Resend), Push Notifications, and SMS.

### 🏷️ 10. Target Price Alerts
- **Price Drop Monitoring**: Set target budget thresholds for saved itineraries and receive automated notifications when estimated trip costs drop.

### 🔐 11. Authentication & Security
- **Email OTP Verification**: Secure sign-up and login using One-Time Passwords sent via email with auto-expiry and resend rate-limiting.
- **NextAuth Integration**: Authentication with credentials provider (Bcrypt password hashing) and Google OAuth integration.
- **Role-Based Access Control (RBAC)**: Distinct permissions for standard Users and System Administrators.
- **Rate-Limiting & Security**: Built-in API rate limiting, CORS controls, and security headers protecting API endpoints.

### 🛠️ 12. System Administrator Dashboard (`/admin`)
- **Admin Credential Authentication**: Dedicated secure login flow for system administrators.
- **User Management**: View, verify, search, and manage registered user accounts.
- **Trip Analytics**: Track itinerary creation metrics, popular destinations, and trip status distributions.
- **Content & Destination Management**: Manage featured destinations, recommended travel guides, and hotel listings.
- **Blog & Content Publishing**: Admin tools for managing travel blogs and destination articles.

### 🎨 13. Modern UI/UX & Dark/Light Mode
- **Tailwind CSS v4 & HeroUI / Radix UI**: High-performance, accessible, and responsive component design system.
- **Framer Motion Micro-Animations**: Smooth page transitions, collapsible daily accordions, interactive modals, and dynamic sliders.
- **Theme Support**: Seamless Dark Mode and Light Mode switching powered by `next-themes`.

---

## 🛠️ Tech Stack Architecture

| Layer | Technologies Used |
| :--- | :--- |
| **Framework** | [Next.js 15+](https://nextjs.org/) (App Router, Server Actions, API Routes) |
| **Language** | [TypeScript 6](https://www.typescriptlang.org/) |
| **Frontend Library** | [React 19](https://react.dev/) |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/), [@heroui/react](https://heroui.com/), [Radix UI](https://www.radix-ui.com/), [Framer Motion](https://www.framer.com/motion/) |
| **Icons & Assets** | [Lucide React](https://lucide.dev/) |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/) |
| **Database & ORM** | [PostgreSQL (Supabase)](https://supabase.com/), [Prisma ORM 5.22](https://www.prisma.io/) |
| **Authentication** | [NextAuth.js (v5 Beta)](https://next-auth.js.org/), [BcryptJS](https://github.com/dcodeIO/bcrypt.js), Email OTP Verification |
| **AI Integration** | [OpenAI API](https://platform.openai.com/), [Perplexity API](https://www.perplexity.ai/) |
| **Maps & Geolocation** | [Leaflet](https://leafletjs.com/), [React-Leaflet](https://react-leaflet.js.org/) |
| **PDF Generation** | [@react-pdf/renderer](https://react-pdf.org/), [react-pdf](https://github.com/wojtekmaj/react-pdf) |
| **Email Services** | [Resend API](https://resend.com/), [Nodemailer](https://nodemailer.com/) |
| **Form Validation** | [React Hook Form](https://react-hook-form.com/), [Zod 4](https://zod.dev/) |
| **Testing** | [Vitest](https://vitest.dev/), [@vitest/coverage-v8](https://vitest.dev/) |

---

## 🗄️ Database Schema Overview

Powered by **Prisma ORM** connecting to **PostgreSQL**, the system manages the following core entities:

- **`User`**: Account info, profile, authentication status, admin flags, and user relations.
- **`AdminCredential`**: Secure admin authentication store for system dashboard management.
- **`Otp`**: One-Time Passwords with purpose tags (`ACCOUNT_CREATION`, `PASSWORD_RESET`, `GENERAL`), expiry timestamps, and usage flags.
- **`Itinerary`**: Full trip records, destination, start/end dates, budget level, party size, dietary/accessibility options, share tokens, public status, and rich JSONB itinerary data.
- **`Wishlist`**: User-curated trip collections with custom titles, descriptions, public/private toggles, and unique share tokens.
- **`WishlistItem`**: Junction table mapping itineraries to wishlists with custom user notes.
- **`PriceAlert`**: Active price targets monitoring itinerary cost shifts for notification triggers.
- **`Notification`**: User notification queue storing message type, priority level (`LOW`, `NORMAL`, `HIGH`, `URGENT`), metadata JSON, and read status.
- **`NotificationPreferences`**: Granular notification toggle settings per user (category preferences, channel toggles, and quiet hours).

---

## 📡 API Endpoint Directory

### 🔐 Auth & OTP
- `POST /api/auth/register` – User registration
- `POST /api/auth/[...nextauth]` – NextAuth handlers (Credentials & Google OAuth)
- `POST /api/otp/send` – Generate and send email OTP
- `POST /api/otp/verify` – Verify email OTP code

### ✈️ Itineraries & Trips
- `POST /api/itinerary/generate` – AI itinerary generation endpoint
- `GET /api/itinerary/[id]` – Fetch single itinerary by ID
- `DELETE /api/itinerary/[id]` – Soft delete / remove itinerary
- `GET /api/itinerary/share/[token]` – Fetch public itinerary by token
- `GET /api/trips` – List logged-in user's trips & itineraries

### 📋 Wishlists & Price Alerts
- `GET /POST /api/wishlist` – Fetch or create custom wishlists
- `POST /api/wishlist/item` – Add/remove itinerary to wishlist with notes
- `GET /api/wishlist/share/[token]` – Access shared wishlist publicly
- `POST /api/price-alerts` – Create target price alert monitors

### 🌤️ Travel Intelligence & Utilities
- `GET /api/weather` – Retrieve live forecast & climate preview for destination
- `POST /api/cost-estimate` – Compute trip expense estimates across categories
- `GET /api/exchange-rate` – Fetch current currency conversion rates
- `GET /api/hotels` – Search proximity hotel suggestions for itineraries
- `GET /api/location` – Location autocomplete & city validation

### 🔔 Notifications & Profile
- `GET /PUT /api/notifications` – Fetch user notifications & mark read/unread
- `GET /PUT /api/notifications/preferences` – Update notification preferences & quiet hours
- `GET /PUT /api/profile` – Fetch and update user profile data

### 🛠️ Admin Management
- `POST /api/admin/login` – Admin portal authentication
- `GET /api/admin/metrics` – Fetch system-wide usage metrics & analytics
- `GET /api/admin/users` – Admin user directory management
- `GET /api/admin/trips` – System trip overview and content moderation

---

## ⚙️ Environment Variables Configuration

Create a `.env` or `.env.local` file in the root directory:

```env
# Server & Database
DATABASE_URL="postgresql://user:password@localhost:5432/mta_db?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/mta_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret_key"

# AI Services
OPENAI_API_KEY="your_openai_api_key"
PERPLEXITY_API_KEY="your_perplexity_api_key"

# Media & Images
UNSPLASH_ACCESS_KEY="your_unsplash_access_key"

# Email Services (Resend & Nodemailer)
RESEND_API_KEY="re_123456789"
NODEMAILER_EMAIL="your_email@example.com"
NODEMAILER_PASSWORD="your_email_app_password"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

---

## 🚀 Installation & Local Development Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/rajsingh9898/MTA.git
cd MTA
```

### 2️⃣ Install Dependencies
```bash
pnpm install
```

### 3️⃣ Setup Database Schema
```bash
# Generate Prisma Client
pnpm prisma generate

# Run Database Migrations
pnpm prisma migrate dev
```

### 4️⃣ Run the Development Server
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to explore the platform.

### 5️⃣ Run Tests & Linting
```bash
# Run unit tests
pnpm test

# Run type check
pnpm typecheck

# Run linter
pnpm lint
```

---

## 📦 Production Build

To test or deploy the production build locally:

```bash
pnpm build
pnpm start
```

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 👨‍💻 Author & Maintainer

**Raj Singh**  
*AI & Full-Stack Developer*  
🔗 Website: [mytripadvisior.co.in](https://mytripadvisior.co.in/)  
🐙 GitHub: [@rajsingh9898](https://github.com/rajsingh9898)

---

⭐ **If you find MTA Planner helpful, please give this repository a star on GitHub!**
