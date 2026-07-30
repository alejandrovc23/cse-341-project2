# Week 4 video demonstration

Target duration: **6–7 minutes**. Keep the final recording between 5 and 8 minutes.

Before recording:

- Open the deployed Swagger UI: <https://project2-vxz5.onrender.com/api-docs>
- Open MongoDB Compass on the `library_api` database.
- Log out through `POST /auth/logout` if a session is already active.
- Prepare a unique 13-digit ISBN so the book creation does not conflict with an existing record.
- Do not show `.env`, connection strings, client secrets, or Render secret values.

## 0:00–0:35 — Published application

1. Show the GitHub repository URL.
2. Show the Render Swagger URL, not localhost.
3. Briefly point out the Authentication, Authors, and Books sections.

Say that the API has two main collections, complete CRUD, validation, centralized error handling, and GitHub OAuth.

## 0:35–1:20 — Logged-out protection

1. Execute `GET /auth/status` and show:

   ```json
   {
     "authenticated": false,
     "user": null
   }
   ```

2. Execute `POST /authors` while logged out.
3. Show the `401 Authentication required` response.

This proves a protected route cannot be accessed before authentication.

## 1:20–2:00 — OAuth login and account creation

1. Open <https://project2-vxz5.onrender.com/auth/github> directly in the same browser.
2. Complete GitHub authorization.
3. After the redirect to Swagger, execute `GET /auth/status`.
4. Show `authenticated: true` and the safe GitHub profile fields.
5. In MongoDB Compass, show the automatically created or updated document in `users`.

Explain that passwords and GitHub access tokens are not stored.

## 2:00–3:35 — Authors CRUD and validation

1. Execute `GET /authors`.
2. Execute `POST /authors` with an invalid body, such as an empty `firstName`, and show `400`.
3. Execute the valid POST example and show `201`. Copy the returned author ID.
4. Execute `GET /authors/{id}` with that ID.
5. Execute `PUT /authors/{id}` with an invalid `website` and show `400`.
6. Execute the valid PUT and show `204`.
7. Show the author document in MongoDB Compass.

Keep the author until the related book has been deleted.

## 3:35–5:35 — Books CRUD and validation

1. Execute `GET /books`.
2. Execute `POST /books` with an invalid `pageCount` or `authorId` and show `400`.
3. Execute a valid POST using the copied author ID and the unique ISBN. Show `201` and copy the book ID.
4. Execute `GET /books/{id}`.
5. Execute `PUT /books/{id}` with `available` as a string and show `400`.
6. Execute the valid PUT with `available: false` and show `204`.
7. Show the book document and its updated value in MongoDB Compass.

## 5:35–6:25 — DELETE and database updates

1. Try `DELETE /authors/{id}` while the book still references it and show `409`.
2. Execute `DELETE /books/{id}` and show `204`.
3. Execute `DELETE /authors/{id}` and show `204`.
4. Refresh Compass and show that both temporary documents were removed.

This demonstrates DELETE, relationship error handling, database updates, and correct status codes.

## 6:25–7:00 — Logout

1. Execute `POST /auth/logout` and show `204`.
2. Execute `GET /auth/status` and show `authenticated: false`.
3. Retry a protected POST, PUT, or DELETE and show `401`.

Finish by showing these three submission links:

- GitHub: <https://github.com/alejandrovc23/cse-341-project2>
- Render API contracts: <https://project2-vxz5.onrender.com/api-docs>
- YouTube: add the public or unlisted video URL after uploading
