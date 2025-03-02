# Mental Wellness API

A simple, secure, and terminal-friendly API for tracking moods and journaling. Built with Node.js, Express, and Vercel Postgres, this API allows users to log their daily moods and journal entries, retrieve statistics, and manage their data with ease.

## Features
- **User Registration**: Create a unique username and API key for authentication.
- **Mood Tracking**: Log moods with optional notes and feelings; retrieve entries by user or date.
- **Journaling**: Write journal entries with tags and automatic sentiment analysis; view stats like average sentiment and top tags.
- **Public Read Access**: Anyone can view mood and journal entries for a username (GET requests).
- **Private Write Access**: Only the owner (via API key) can create or delete entries.
- **Pagination**: Retrieve large datasets efficiently with `page` and `limit` query parameters.
- **Rate Limiting**: Protects against abuse with 100 requests per 15 minutes per IP.
- **Input Validation**: Ensures data integrity with robust validation.
- **API Documentation**: Available via `curl` or web browser at `/api/docs`.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/) 

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/notyourdoraemon/mental-wellness-api.git
   cd mental-wellness-api
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server locally (on `main` branch for SQLite, port 3000, or `vercel-deployment` branch for Vercel Postgres, port 3000):
   ```bash
   npm start
   ```
   - For local SQLite development (on `main`): Use port 3000 (update `server.js` in `main` if needed).
   - For Vercel testing (on `vercel-deployment`): Use port 3000.

## Usage

### Register a User
- **Local (SQLite, `main` branch, port 3000)**:
  ```bash
  curl -X POST -H "Content-Type: application/json" -d '{"username":"aditya"}' http://localhost:3000/api/register
  ```
- **Vercel (Postgres, `vercel-deployment` branch, port 3000)**:
  ```bash
  curl -X POST -H "Content-Type: application/json" -d '{"username":"aditya"}' https://mental-wellness-api.vercel.app/api/register
  ```
Response:
```json
{
  "username": "aditya",
  "api_key": "550e8400-e29b-41d4-a716-446655440000"
}
```
Save the `api_key` for authenticated requests.

### Post a Mood
- **Local**:
  ```bash
  curl -X POST -H "X-API-Key: <your-api-key>" -H "Content-Type: application/json" -d '{"mood":"happy","feeling":"excited","notes":"Great day!"}' http://localhost:3000/api/moods
  ```
- **Vercel**:
  ```bash
  curl -X POST -H "X-API-Key: <your-api-key>" -H "Content-Type: application/json" -d '{"mood":"happy","feeling":"excited","notes":"Great day!"}' https://mental-wellness-api.vercel.app/api/moods
  ```

### Get Moods with Pagination
- **Local**:
  ```bash
  curl "http://localhost:3000/api/moods/aditya?page=1&limit=5"
  ```
- **Vercel**:
  ```bash
  curl "https://mental-wellness-api.vercel.app/api/moods/aditya?page=1&limit=5"
  ```

### Post a Journal Entry
- **Local**:
  ```bash
  curl -X POST -H "X-API-Key: <your-api-key>" -H "Content-Type: application/json" -d '{"title":"Day Reflection","content":"I had a great day","tags":"friends, positivity"}' http://localhost:3000/api/journal
  ```
- **Vercel**:
  ```bash
  curl -X POST -H "X-API-Key: <your-api-key>" -H "Content-Type: application/json" -d '{"title":"Day Reflection","content":"I had a great day","tags":"friends, positivity"}' https://mental-wellness-api.vercel.app/api/journal
  ```

### Get Journal Stats
- **Local**:
  ```bash
  curl http://localhost:3000/api/journal/stats/aditya
  ```
- **Vercel**:
  ```bash
  curl https://mental-wellness-api.vercel.app/api/journal/stats/aditya
  ```

### Fetch API Documentation
- **Via `curl`**:
  - Local:
    ```bash
    curl http://localhost:3000/api/docs
    ```
  - Vercel:
    ```bash
    curl https://mental-wellness-api.vercel.app/api/docs
    ```
  Response: JSON version of the OpenAPI spec (see `docs/openapi.yaml` for structure).
- **Via Web Browser**:
  - Local: Visit `http://localhost:3000/api/docs`.
  - Vercel: Visit `https://mental-wellness-api.vercel.app/api/docs` to see a formatted HTML page with the API spec.

## API Reference

The API documentation is available via `curl` (JSON) or in a browser (HTML) at `/api/docs`. The raw spec is also in `docs/openapi.yaml`. Below is a summary table and detailed reference with examples.

### Available Endpoints
| Method | Endpoint                     | Description                          | Auth Required |
|--------|------------------------------|--------------------------------------|---------------|
| POST   | `/api/register`             | Register a new user                  | No            |
| POST   | `/api/moods`                | Add a mood entry                     | Yes           |
| GET    | `/api/moods/:username`      | Get all mood entries                 | No            |
| GET    | `/api/moods/date/:username/:date` | Get mood entries for a date | No            |
| GET    | `/api/stats/:username`      | Get mood statistics                  | No            |
| DELETE | `/api/moods/:id`            | Delete a mood entry                  | Yes           |
| POST   | `/api/journal`              | Add a journal entry                  | Yes           |
| GET    | `/api/journal/:username`    | Get all journal entries              | No            |
| GET    | `/api/journal/stats/:username` | Get journal statistics           | No            |
| DELETE | `/api/journal/:id`          | Delete a journal entry               | Yes           |
| GET    | `/api/docs`                 | Get API documentation                | No            |

### Authentication
- **Header**: `X-API-Key: <your-api-key>`
- Required for all POST and DELETE requests.

### Detailed Endpoints
### Detailed Endpoints

#### **POST /api/register**
- **Description**: Register a new user and get an API key.
- **Request Body**:
  ```json
  {
    "username": "aditya"
  }
  ```
- **Response** (201):
  ```json
  {
    "username": "aditya",
    "api_key": "550e8400-e29b-41d4-a716-446655440000"
  }
  ```

#### **POST /api/moods**
- **Description**: Add a mood entry (requires authentication).
- **Request Body**:
  ```json
  {
    "mood": "happy",          // Required
    "feeling": "excited",     // Optional
    "notes": "Great day!"     // Optional
  }
  ```
- **Response** (201):
  ```json
  {
    "id": 1,
    "mood": "happy",
    "feeling": "excited",
    "notes": "Great day!"
  }
  ```

#### **GET /api/moods/:username**
- **Description**: Get all mood entries for a user (public).
- **Path Parameters**:
  - `username`: The user's username (e.g., "aditya").
- **Query Parameters**:
  - `page`: Page number (default: 1).
  - `limit`: Entries per page (default: 10, max: 100).
- **Example**:
  ```bash
  curl "http://localhost:3000/api/moods/aditya?page=1&limit=5"
  ```
- **Response** (200):
  ```json
  {
    "entries": [
      {
        "id": 1,
        "mood": "happy",
        "feeling": "excited",
        "notes": "Great day!",
        "created_at": "2025-03-02T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 5,
      "total": 25,
      "pages": 5
    }
  }
  ```

#### **GET /api/moods/date/:username/:date**
- **Description**: Get mood entries for a specific date (public).
- **Path Parameters**:
  - `username`: The user's username (e.g., "aditya").
  - `date`: Date in YYYY-MM-DD format (e.g., "2025-03-02").
- **Example**:
  ```bash
  curl http://localhost:3000/api/moods/date/aditya/2025-03-02
  ```
- **Response** (200):
  ```json
  [
    {
      "id": 1,
      "mood": "happy",
      "feeling": "excited",
      "notes": "Great day!",
      "created_at": "2025-03-02T10:00:00Z"
    }
  ]
  ```

#### **GET /api/stats/:username**
- **Description**: Get mood statistics for a user (public).
- **Path Parameters**:
  - `username`: The user's username (e.g., "aditya").
- **Example**:
  ```bash
  curl http://localhost:3000/api/stats/aditya
  ```
- **Response** (200):
  ```json
  {
    "topMoods": [
      { "mood": "happy", "count": 5 },
      { "mood": "calm", "count": 3 }
    ],
    "topFeelings": [
      { "feeling": "excited", "count": 3 },
      { "feeling": "relaxed", "count": 2 }
    ]
  }
  ```

#### **DELETE /api/moods/:id**
- **Description**: Delete a mood entry (requires authentication).
- **Path Parameters**:
  - `id`: The mood entry ID (e.g., 1).
- **Example**:
  ```bash
  curl -X DELETE -H "X-API-Key: <your-api-key>" http://localhost:3000/api/moods/1
  ```
- **Response** (200):
  ```json
  {
    "message": "Mood entry deleted"
  }
  ```

#### **POST /api/journal**
- **Description**: Add a journal entry (requires authentication).
- **Request Body**:
  ```json
  {
    "title": "Day Reflection",   // Required
    "content": "I had a great day", // Required
    "tags": "friends, positivity"   // Optional
  }
  ```
- **Response** (201):
  ```json
  {
    "id": 1,
    "title": "Day Reflection",
    "content": "I had a great day",
    "tags": "friends, positivity",
    "sentiment_score": 0.2
  }
  ```

#### **GET /api/journal/:username**
- **Description**: Get all journal entries for a user (public).
- **Path Parameters**:
  - `username`: The user's username (e.g., "aditya").
- **Query Parameters**:
  - `page`: Page number (default: 1).
  - `limit`: Entries per page (default: 10, max: 100).
- **Example**:
  ```bash
  curl "http://localhost:3000/api/journal/aditya?page=1&limit=5"
  ```
- **Response** (200):
  ```json
  {
    "entries": [
      {
        "id": 1,
        "title": "Day Reflection",
        "content": "I had a great day",
        "tags": "friends, positivity",
        "sentiment_score": 0.2,
        "created_at": "2025-03-02T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 5,
      "total": 15,
      "pages": 3
    }
  }
  ```

#### **GET /api/journal/stats/:username**
- **Description**: Get journal statistics for a user (public).
- **Path Parameters**:
  - `username`: The user's username (e.g., "aditya").
- **Example**:
  ```bash
  curl http://localhost:3000/api/journal/stats/aditya
  ```
- **Response** (200):
  ```json
  {
    "average_sentiment": 0.15,
    "top_tags": [
      { "tags": "friends, positivity", "count": 3 },
      { "tags": "work", "count": 2 }
    ]
  }
  ```

#### **DELETE /api/journal/:id**
- **Description**: Delete a journal entry (requires authentication).
- **Path Parameters**:
  - `id`: The journal entry ID (e.g., 1).
- **Example**:
  ```bash
  curl -X DELETE -H "X-API-Key: <your-api-key>" http://localhost:3000/api/journal/1
  ```
- **Response** (200):
  ```json
  {
    "message": "Journal entry deleted"
  }
  ```

## Hosting
To host this API on Vercel using the `vercel-deployment` branch:
1. **Link to Vercel**:
   - Go to [vercel.com](https://vercel.com) and sign in with GitHub.
   - Click “New Project” > “Import Git Repository,” and select your `mental-wellness-api` repo under `notyourdoraemon`.
   - Choose the `vercel-deployment` branch.
2. **Configure Project**:
   - Vercel will detect Node.js and use `vercel.json`.
   - Set the `POSTGRES_URL` environment variable in the Vercel dashboard:
     - Go to your project settings > Environment Variables.
     - Add `POSTGRES_URL` with the value provided by Vercel Postgres (set up a Vercel Postgres database in your project).
3. **Deploy**:
   - Click “Deploy.” Vercel will build and deploy your project using port 3000 (managed automatically).
   - Once deployed, you’ll get a URL (e.g., `mental-wellness-api.vercel.app`).

## Contributing
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.