/**
 * 语言检测中间件 Demo
 * 根据浏览器的 Accept-Language 头判断用户语言偏好
 * 自动重定向到对应的语言页面
 */

export function middleware(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 如果已经在语言路径下，不再重定向（避免无限循环）
  if (pathname.startsWith('/zh') || pathname.startsWith('/en')) {
    return;
  }

  // 获取浏览器语言偏好
  const acceptLanguage = request.headers.get('accept-language') || '';
  
  console.log('🌐 Accept-Language:', acceptLanguage);
  console.log('📍 Current path:', pathname);

  // 解析语言优先级
  const preferredLanguage = detectLanguage(acceptLanguage);
  
  console.log('✅ Detected language:', preferredLanguage);

  // 根据检测到的语言重定向
  let redirectPath = '/en'; // 默认英文
  
  if (preferredLanguage === 'zh') {
    redirectPath = '/zh';
  }

  // 保留原始查询参数
  const searchParams = url.search;
  const finalUrl = `${redirectPath}${searchParams}`;

  console.log('🔀 Redirecting to:', finalUrl);

  // 执行重定向
  return Response.redirect(new URL(finalUrl, request.url), 302);
}

/**
 * 检测用户的首选语言
 * @param acceptLanguage - Accept-Language 请求头的值
 * @returns 'zh' | 'en'
 */
function detectLanguage(acceptLanguage: string): 'zh' | 'en' {
  if (!acceptLanguage) {
    return 'en'; // 默认英文
  }

  // Accept-Language 格式示例:
  // "zh-CN,zh;q=0.9,en;q=0.8,en-US;q=0.7"
  // "en-US,en;q=0.9"
  // "en,zh-CN;q=0.9,zh;q=0.8" ← en 优先级最高(1.0)
  
  const languages = acceptLanguage
    .toLowerCase()
    .split(',')
    .map(lang => {
      const [code, qValue] = lang.trim().split(';');
      const quality = qValue ? parseFloat(qValue.split('=')[1]) : 1.0;
      return { code: code.trim(), quality };
    })
    .sort((a, b) => b.quality - a.quality); // 按优先级排序

  console.log('🔤 Parsed languages:', languages);

  // 按优先级顺序检查语言
  for (const lang of languages) {
    // 检查中文（包括 zh, zh-CN, zh-TW 等）
    if (lang.code.startsWith('zh')) {
      console.log(`  ✓ Found Chinese with quality ${lang.quality}`);
      return 'zh';
    }
    // 检查英文（包括 en, en-US, en-GB 等）
    if (lang.code.startsWith('en')) {
      console.log(`  ✓ Found English with quality ${lang.quality}`);
      return 'en';
    }
  }

  // 如果都没匹配到，默认返回英文
  console.log('  → Using default: en');
  return 'en';
}

export const config = {
  runtime: 'nodejs',
  matcher: [
    '/', // 只在首页执行重定向
    // 如果要匹配更多路径，可以添加:
    // '/about',
    // '/contact',
  ],
}
