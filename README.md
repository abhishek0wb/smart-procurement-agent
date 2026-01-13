# Agentic RFP Management System

An AI-powered Request for Proposal (RFP) management system that automates the communication loop between procurement teams and vendors. It allows users to create RFPs, automatically dispatch them to vendors via email, process replies using an inbox listener, and leverage AI to extract proposal details and recommend the best vendor.

## Tech Stack

-   **Frontend**: React (Vite, TypeScript, TailwindCSS)
-   **Backend**: Node.js (Express, TypeScript)
-   **Database**: PostgreSQL with Prisma ORM
-   **AI Engine**: Groq (Llama 3.3 70B Versatile)
-   **Email**: Nodemailer (Sending) & IMAPFlow (Receiving)
-   **Containerization**: Docker & Docker Compose

##  Architecture & Design Decisions

### Why Groq (Llama 3.3)?
I have utilized **Groq** as our inference engine instead of OpenAI.
-   **Reasoning**: Groq offers near-instantaneous inference speeds (hundreds of token/s), which is crucial for a responsive user experience when parsing large email bodies or generating real-time comparisons. It also provides a free tier that is excellent for high-performance demos.

### Why IMAP Polling?
The system uses **IMAPFlow** to poll the inbox for replies rather than using Webhooks (e.g., Gmail API Push Notifications).
-   **Reasoning**: This architectural choice allows the application to function entirely in a **local development environment** (localhost) without needing public internet exposure, reverse proxies (ngrok), or complex cloud verification steps for webhooks.

### Why JSONB in PostgreSQL?
I have store RFP requirements in a `structuredData` **JSONB** column.
-   **Reasoning**: Procurement needs vary wildly—buying laptops requires different specs (RAM, CPU) than buying office chairs (Material, Ergonomics). A rigid SQL schema would fail here. JSONB gives us the flexibility of NoSQL within a robust relational database.

### Statutory Logic: The `[RFP-REF]` Tag
-   **Decision**: I have append a unique tag like `[RFP-REF: <ID>]` to the email subject.
-   **Reasoning**: This serves as a **stateless correlation ID**. It eliminates the need for maintaining complex email thread history in the database. As long as the vendor replies to the thread, the system deterministically links the proposal to the correct RFP.

## Project Setup

### Prerequisites
-   Docker & Docker Compose
-   Node.js v18+ (for local dev without Docker)
-   A Gmail account with **App Password** enabled (for email features).

### 1. Services Configuration
Create a `.env` file in the `backend` directory:

```env
DATABASE_URL="postgresql://user:password@db:5432/rfp_management?schema=public"
PORT=5000

# Gmail Configuration (Required for Email Features)
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-app-password" 

# AI Configuration
GROQ_API_KEY="gsk_..." 
```

### 2. Run with Docker
The entire stack (Frontend, Backend, Database) is containerized.

```bash
docker-compose up --build
```

-   **Frontend**: http://localhost:3000
-   **Backend**: http://localhost:5000

## How to Test

1.  **Create an RFP**: Use the specific "AI Analysis" feature to generate structured requirements from a prompt.
2.  **Send to Vendors**: Select vendors and click "Send RFP". Check the vendor's inbox.
3.  **Reply as Vendor**: Reply to the email with a quote (Price, Timeline, Terms). **Do not change the subject line.**
4.  **Sync**: Click "Sync Emails" in the app. The reply will be parsed and appear as a proposal.
5.  **AI Compare**: Click "AI Compare" to let the LLM rank the proposals and pick a winner.

##  Assumptions & Limitations

-   **Email Threading**: The system assumes vendors reply to the original email subject containing the reference tag.
-   **Attachment Parsing**: Currently, the AI parses the email **body text**. Parsing PDF/Excel attachments is a planned future enhancement.
-   **Security**: Ensure `GMAIL_APP_PASSWORD` is kept secure and never committed to git.
