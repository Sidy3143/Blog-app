# Blog API

RESTful blog API built with Express, Prisma, and PostgreSQL.

## Features

- **JWT Authentication** — Signup and login. All protected routes require `Authorization: Bearer <token>`.
- **Role-based access** — Two roles: `USER` (default on signup) and `ADMIN`. Admins manage posts; users manage their own comments.
- **Posts** — Admins can create, update, and delete posts. Posts have a `published` flag (drafts are hidden until published). Public URLs use a unique slug; write operations use the stable numeric id so slugs can be freely renamed without breaking anything.
- **Comments** — Authenticated users can comment on any post and edit or delete their own comments. Admins can delete any comment.
- **Validation** — Inputs are validated on signup (email format, password length, confirmation match) and login (credentials checked against the database before issuing a token).
- **Cascading deletes** — Deleting a post removes all its comments. Deleting a user removes all their comments.

## Endpoints

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/blog/signup` | — |
| POST | `/blog/login` | — |
| GET | `/blog/posts` | — |
| GET | `/blog/posts/:slug` | — |
| POST | `/blog/posts` | Admin |
| PUT | `/blog/posts/:id` | Admin |
| DELETE | `/blog/posts/:id` | Admin |
| GET | `/blog/posts/:slug/comments` | — |
| POST | `/blog/posts/:slug/newComment` | User |
| PUT | `/blog/posts/:slug/comments/:commentId` | Owner |
| DELETE | `/blog/posts/:slug/comments/:commentId` | Owner / Admin |
