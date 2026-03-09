export default function EnglishPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-xl">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">
          🇺🇸 Welcome to English Page
        </h1>
        <p className="text-lg text-gray-700 mb-6">
          Your browser language is set to English, redirected to English page automatically
        </p>
        <div className="bg-gray-100 p-4 rounded-md">
          <p className="text-sm text-gray-600">
            Detected browser language: <strong>en / en-US</strong>
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Current path: <strong>/en</strong>
          </p>
        </div>
        <div className="mt-6">
          <a 
            href="/zh" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Switch to Chinese page →
          </a>
        </div>
      </div>
    </div>
  );
}
