# NourishTrack

NourishTrack is a Progressive Web App (PWA) designed to help nursing mothers log and track their breastfeeding and pumping sessions with ease. The application provides a simple, intuitive interface for recording feeding details and viewing past sessions.

## Features

- **Feeding Log Form**: Record breastfeeding sessions with details such as:
  - Date and time entries (multiple entries per session)
  - Duration
  - Breast used (left/right)
  - Unlatch reason
  - Notes for feeding and pumping

- **Progressive Web App**: Install on iOS devices for offline access
- **Responsive Design**: Works on all device sizes
- **Daily Motivational Quotes**: A new quote each day to inspire and encourage

## Tech Stack

- **Framework**: Next.js (App Router)
- **UI Components**: ShadCN UI
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation
- **Notifications**: Sonner for toast notifications

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Add the required PWA icon files to the `public/icons/` directory (see README in that directory)

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### PWA Installation (iOS)

To install as a PWA on iOS:

1. Open the application in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Confirm by tapping "Add"

## Deployment

The application can be deployed to any hosting platform that supports Next.js applications. For the PWA functionality to work properly, the application must be served over HTTPS.
