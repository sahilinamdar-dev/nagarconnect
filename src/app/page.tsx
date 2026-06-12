import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">Nagarsevak Connect</h1>
        <p className="text-gray-600 text-sm">
          नागरिक तक्रार व्यवस्थापन · Civic complaint management for municipal wards.
        </p>
        <div className="space-y-2">
          <Link href="/w/prabhag-14" className="block rounded-xl bg-teal-700 text-white py-3 font-semibold">
            तक्रार नोंदवा (डेमो) · Demo complaint form
          </Link>
          <Link href="/status" className="block rounded-xl border py-3 font-semibold">
            स्थिती तपासा · Check status
          </Link>
          <Link href="/admin" className="block text-sm underline text-gray-500">
            कार्यालय लॉगिन · Office login
          </Link>
        </div>
      </div>
    </main>
  );
}
