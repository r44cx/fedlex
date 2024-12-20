import { LawBrowser } from '@/components/LawBrowser';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Swiss Law Explorer
        </h1>
        <LawBrowser />
      </div>
    </main>
  );
}
