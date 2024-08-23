# GymDiary Backend

The GymDiary backend provides the API endpoints needed to support the GymDiary frontend. It is built with Node.js and Express.js and is deployed on Vercel.

## Features

- **User Authentication**: Secure endpoints with token-based authentication.
- **Metrics Management**: Endpoints to manage and track user metrics (weight, muscle mass, body fat).
- **Meals and Exercises**: Endpoints for logging and managing meals and exercises.

## Technologies

- **Node.js**: JavaScript runtime for server-side operations.
- **Express.js**: Web framework for Node.js.
- **MongoDB**: NoSQL database for storing user data (account info, metrics, meals, exercises).

## Getting Started

To set up the backend locally, follow these steps:

### Prerequisites

- **Node.js** (LTS version recommended)
- **npm** (Node Package Manager)
- **MongoDB** (local installation or cloud-based MongoDB service)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/alexsilvaa9/GymDiaryBackNode.git
   ```

2. Navigate into the project directory:

   ```bash
   cd GymDiaryBackNode
   ```

3. Install the dependencies:

   ```bash
   npm install
   ```

### Running the Application

To start the server in development mode:

```bash
vercel dev
```

The server will be available at `http://localhost:3000` (or another port if configured).

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
MONGO_URI=mongodb://localhost:27017/gymdiary
SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_secret_key
```

### Deployment

For deployment instructions, refer to the Vercel documentation or the provided deployment scripts in the repository.

## Contributing

If you'd like to contribute to the GymDiary backend, please fork the repository and create a pull request with your proposed changes. Ensure to follow coding standards and include tests for any new features.

For any questions or feedback, please contact:

- [Alex Silva](mailto:alexsilvaebg9@gmail.com)
- GitHub: [https://github.com/alexsilvaa9](https://github.com/alexsilvaa9)
