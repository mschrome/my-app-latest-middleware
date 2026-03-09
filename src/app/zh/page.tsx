export default function ChinesePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-yellow-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-xl">
        <h1 className="text-4xl font-bold text-red-600 mb-4">
          🇨🇳 欢迎访问中文页面
        </h1>
        <p className="text-lg text-gray-700 mb-6">
          您的浏览器语言设置为中文，已自动跳转到中文页面
        </p>
        <div className="bg-gray-100 p-4 rounded-md">
          <p className="text-sm text-gray-600">
            检测到浏览器语言: <strong>zh-CN / zh</strong>
          </p>
          <p className="text-sm text-gray-600 mt-2">
            当前路径: <strong>/zh</strong>
          </p>
        </div>
        <div className="mt-6">
          <a 
            href="/en" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            切换到英文页面 →
          </a>
        </div>
      </div>
    </div>
  );
}
