# Earth Carbon Registry — Frontend

A Next.js 14 web application for the Earth Carbon Registry. Users register carbon-reducing actions (solar panels, biogas plants, tree planting, etc.), pay a ₹199 registration fee via Razorpay, and receive a unique registry ID with a QR code and SHA-256 digital signature. Admins verify actions and manage the registry.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Auth**: Firebase Authentication (Google Sign-In)
- **Database**: Firestore (`asia-pacific` region)
- **Payments**: Razorpay (dual mode: simulation + real)
- **Styling**: Tailwind CSS v4
- **Forms**: Formik + Yup
- **Maps**: Google Maps API

## Getting Started

### Prerequisites

- Node.js 18.x
- Firebase project with Firestore and Auth enabled
- Razorpay account (for real payments)
- Google Maps API key

### Setup

```bash
# Clone and install
git clone <repo-url>
cd registry-frontend
npm install

# Copy environment file
cp .env.example .env.local
# Fill in all values in .env.local

# Start dev server
npm run dev
```

### Initial Firestore Document

Create a `meta/registryCounter` document in Firestore with:
```json
{ "count": 0 }
```
This is used for sequential registry ID generation (`ECF-0001`, `ECF-0002`, ...).

### Making a User Admin

1. Go to Firestore Console → `users` collection
2. Find the user document by UID
3. Set `role` field to `"admin"`
4. The user must sign out and sign back in for the session cookie to update

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase client API key |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `RAZORPAY_KEY_ID` | Razorpay key ID (server-only) |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret (server-only, **never expose to client**) |
| `RAZORPAY_SIMULATION_MODE` | Set to `true` to bypass real payments |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Base64-encoded Firebase Admin service account key |

## Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Protected routes (profile, register, admin)
│   ├── (public)/           # Public pages (about, pricing, etc.)
│   ├── api/                # API routes (payment, eligibility, storage-proxy)
│   └── verify/[id]/        # Public verification page
├── components/             # React components
│   ├── forms/              # Form sections
│   ├── svg/                # SVG icon components
│   └── ui/                 # Reusable UI primitives
├── context/                # AuthContext
├── hooks/                  # Custom React hooks
├── lib/                    # Service layer, Firebase config, utilities
│   ├── firestoreService.ts # Centralized Firestore operations
│   ├── firebaseConfig.ts   # Client Firebase SDK init
│   ├── firebaseAdmin.ts    # Admin SDK init (server-only)
│   ├── razorpay.ts         # Razorpay order/verification
│   ├── co2eCalculation.ts  # CO₂e calculation formulas
│   └── hashUtils.ts        # SHA-256 hashing
└── types/                  # TypeScript interfaces
```

### Key Design Decisions

- **Service Layer**: All Firestore operations go through `lib/firestoreService.ts`. No direct Firestore imports in components or hooks.
- **Payment Pipeline**: Actions are created only after successful payment verification. The API route `/api/payment/verify` generates registry ID, CO₂e, Atmanirbhar %, and SHA-256 hash atomically.
- **Admin Auth**: Enforced at both middleware level (session cookie role check) and page level (useUserProfile hook).
- **Simulation Mode**: Controlled by `RAZORPAY_SIMULATION_MODE` env var. When `true`, the payment creation API returns a simulated order and the client skips Razorpay checkout.

## Scripts

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
```
