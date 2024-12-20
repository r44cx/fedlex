# Swiss Law Explorer

A modern web application for exploring the Swiss law database. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Search through Swiss laws by text
- Filter by year (1848-2024)
- Filter by language (German, French, Italian, Romansh, English)
- Modern, responsive UI
- Fast and efficient search
- Direct links to full law texts

## Prerequisites

- Node.js 18.x or later
- npm or yarn

## Setup

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Run the development server:
```bash
npm run dev
# or
yarn dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `/src/app`: Next.js app router pages and API routes
- `/src/components`: React components
- `/src/types`: TypeScript type definitions
- `/public`: Static assets

## API Routes

- `GET /api/laws/search`: Search laws with query parameters:
  - `q`: Search query (text)
  - `year`: Filter by year
  - `lang`: Filter by language code (de, fr, it, rm, en)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
