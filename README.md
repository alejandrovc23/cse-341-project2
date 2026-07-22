# CSE 341 Project 2 — Library API

A REST API for managing books and authors in MongoDB. The project implements complete CRUD operations, request validation, centralized error handling, OpenAPI documentation, and deployment configuration for Render.

- Live API: <https://project2-vxz5.onrender.com>
- Swagger UI: <https://project2-vxz5.onrender.com/api-docs>

## Data model

The API uses the `library_api` database and two collections:

- `authors`: first name, last name, birth date, nationality, biography, website, and timestamps.
- `books`: title, ISBN, genre, publication year, publisher, language, page count, availability, description, author reference, and timestamps.

Each `books.authorId` is stored as a MongoDB `ObjectId` that references an existing author. An author cannot be deleted until all books that reference it have been deleted or reassigned.

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
| GET | `/authors` | List all authors |
| GET | `/authors/:id` | Get an author |
| POST | `/authors` | Create an author |
| PUT | `/authors/:id` | Replace an author |
| DELETE | `/authors/:id` | Delete an unreferenced author |
| GET | `/books` | List all books |
| GET | `/books?authorId=:authorId` | Filter books by author |
| GET | `/books/:id` | Get a book |
| POST | `/books` | Create a book |
| PUT | `/books/:id` | Replace a book |
| DELETE | `/books/:id` | Delete a book |

Successful creation returns `201` and the new resource ID. Successful updates and deletions return `204`. Invalid input returns `400`, missing resources return `404`, uniqueness or relationship conflicts return `409`, and unexpected failures return `500`.

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
```

Use `npm install` as the build command and `npm start` as the start command. After Render assigns the final URL, update the production server URL in `swagger.js`, run `npm run swagger`, and commit the regenerated `swagger.json`.

## Week 4 preparation

OAuth authentication will be added in Week 4. The intended security policy is to keep GET routes public and require an authenticated user for POST, PUT, and DELETE operations.
