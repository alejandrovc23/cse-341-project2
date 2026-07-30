# CSE 341 Project 2 — Library API

A REST API for managing books and authors in MongoDB. The project implements complete CRUD operations, GitHub OAuth authentication, MongoDB-backed sessions, request validation, centralized error handling, OpenAPI documentation, and deployment configuration for Render.

- Live API: <https://project2-vxz5.onrender.com>
- Swagger UI: <https://project2-vxz5.onrender.com/api-docs>

## Data model

The API uses the `library_api` database and these application collections:

- `authors`: first name, last name, birth date, nationality, biography, website, and timestamps.
- `books`: title, ISBN, genre, publication year, publisher, language, page count, availability, description, author reference, and timestamps.
- `users`: the safe GitHub profile fields used to identify authenticated users. A record is automatically created on the first successful OAuth login.

Each `books.authorId` is stored as a MongoDB `ObjectId` that references an existing author. An author cannot be deleted until all books that reference it have been deleted or reassigned.

Sessions are stored separately in the `sessions` collection and expire after 24 hours. GitHub access tokens and passwords are never stored.

## Requirements

- Node.js 22
- MongoDB Atlas or another MongoDB deployment
- npm

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and replace the placeholder connection string:

   ```env
   MONGODB_URL=<your MongoDB connection string>
   MONGODB_DATABASE=library_api
   PORT=3000
   BASE_URL=http://localhost:3000
   SESSION_SECRET=<a long random value>
   GITHUB_CLIENT_ID=<your GitHub OAuth app client ID>
   GITHUB_CLIENT_SECRET=<your GitHub OAuth app client secret>
   ```

3. Start the API:

   ```bash
   npm start
   ```

4. Open the Swagger UI at `http://localhost:3000/api-docs`.

The `.env` file is ignored by Git and must never be committed.

## Commands

| Command | Purpose |
| --- | --- |
| `npm start` | Start the API |
| `npm run dev` | Start with Node watch mode |
| `npm run swagger` | Regenerate `swagger.json` from `swagger.js` |
| `npm test` | Run validation tests |
| `npm run test:integration` | Run temporary CRUD operations against the configured database and clean them up |

## Endpoints

| Method | Route | Description |
| --- | --- | --- |
| GET | `/` | API information |
| GET | `/health` | Health check |
| GET | `/api-docs` | Interactive Swagger UI |
| GET | `/swagger.json` | Raw OpenAPI document |
| GET | `/auth/github` | Start GitHub login and provision a user account |
| GET | `/auth/github/callback` | Complete GitHub OAuth |
| GET | `/auth/status` | Show the current login state and safe user profile |
| POST | `/auth/logout` | Destroy the authenticated session |
| GET | `/authors` | List all authors |
| GET | `/authors/:id` | Get an author |
| POST | `/authors` | Create an author (protected) |
| PUT | `/authors/:id` | Replace an author (protected) |
| DELETE | `/authors/:id` | Delete an unreferenced author (protected) |
| GET | `/books` | List all books |
| GET | `/books?authorId=:authorId` | Filter books by author |
| GET | `/books/:id` | Get a book |
| POST | `/books` | Create a book (protected) |
| PUT | `/books/:id` | Replace a book (protected) |
| DELETE | `/books/:id` | Delete a book (protected) |

Successful creation returns `201` and the new resource ID. Successful updates and deletions return `204`. Unauthenticated protected requests return `401`, invalid input returns `400`, missing resources return `404`, uniqueness or relationship conflicts return `409`, and unexpected failures return `500`.

## Authentication

All GET data routes are public. Every POST, PUT, and DELETE route for authors and books requires an authenticated GitHub session.

1. Open `/auth/github` in the same browser as Swagger UI.
2. Authorize the GitHub OAuth application.
3. The callback creates or updates the `users` record, establishes a session, and redirects to `/api-docs`.
4. Run `/auth/status` to demonstrate the authenticated user.
5. Use Swagger's **Try it out** controls on protected routes. The HTTP-only `library.sid` cookie is sent automatically.
6. Run `POST /auth/logout`, then retry a protected route to demonstrate the `401` response.

The Swagger **Authorize** dialog does not need a manually entered cookie. Browsers do not allow JavaScript to read an HTTP-only session cookie; logging in through `/auth/github` is the secure authorization step.

## Validation

- Request bodies must be JSON objects and cannot contain unknown fields.
- All documented author and book fields are required for POST and PUT.
- Dates, URLs, ISBN formats, integers, booleans, lengths, and MongoDB ObjectIds are validated.
- A book can reference only an existing author.
- ISBN values are normalized and protected by a unique MongoDB index.
- Malformed JSON and unknown routes return structured error responses.

Use `routes.rest` with the VS Code REST Client extension to exercise every route. Create an author first, copy the returned ID into `authorId`, and then create a book.

## Render deployment

The included `render.yaml` describes the service. Whether using the blueprint or the Render dashboard, configure these environment variables:

```env
MONGODB_URL=<the secret Atlas connection string>
MONGODB_DATABASE=library_api
NODE_ENV=production
BASE_URL=https://project2-vxz5.onrender.com
SESSION_SECRET=<a long random value>
GITHUB_CLIENT_ID=<your GitHub OAuth app client ID>
GITHUB_CLIENT_SECRET=<your GitHub OAuth app client secret>
```

Create a [GitHub OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app) with these production values:

```text
Homepage URL: https://project2-vxz5.onrender.com
Authorization callback URL: https://project2-vxz5.onrender.com/auth/github/callback
```

Copy its client ID and client secret into Render; never commit either value. The included `render.yaml` declares all required variables and generates `SESSION_SECRET` when a new Blueprint service is created.

Use `npm install` as the build command and `npm start` as the start command. After Render assigns the final URL, update `BASE_URL`, the GitHub callback URL, and the production server URL in `swagger.js`; then run `npm run swagger` and commit the regenerated `swagger.json`.

## Week 4 demonstration checklist

- Follow the timed [video demonstration script](VIDEO_DEMO.md) to cover every rubric item in 5–8 minutes.
- Show `/auth/status` before and after GitHub login.
- Show the new `users` document and existing `authors` and `books` collections in MongoDB Compass.
- Show at least one protected route returning `401` while logged out.
- While logged in, use Swagger to demonstrate GET, POST, PUT, and DELETE plus invalid POST and PUT bodies returning `400`.
- Log out and show that protected routes are unavailable again.
- Keep the rubric video between 5 and 8 minutes.
