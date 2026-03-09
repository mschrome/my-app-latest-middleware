export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-xl max-w-2xl">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">
          🏠 Home Page
        </h1>
        <p className="text-lg text-gray-700 mb-6">
          Welcome to the demo application
        </p>
        <div className="bg-gray-100 p-4 rounded-md mb-6">
          <p className="text-sm text-gray-600">
            Current path: <strong>/home</strong>
          </p>
        </div>
        
        <div className="space-y-3">
          <div>
            <a 
              href="/en" 
              className="inline-block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              🇺🇸 English Page
            </a>
          </div>
          
          <div>
            <a 
              href="/zh" 
              className="inline-block w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              🇨🇳 Chinese Page
            </a>
          </div>
          
          <div>
            <a 
              href="/server-action-demo" 
              className="inline-block w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              ⚡ Server Actions Demo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
