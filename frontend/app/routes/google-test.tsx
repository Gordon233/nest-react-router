import { useEffect, useState } from "react";

export default function GoogleTest() {
  const [idToken, setIdToken] = useState<string>("");
  const [userInfo, setUserInfo] = useState<any>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // 加载 Google Identity Services 库
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      // @ts-ignore
      window.google.accounts.id.initialize({
        client_id: "459719688968-ti5g56cbip6561kcfbhq3ohs0d0ugjmm.apps.googleusercontent.com", // 替换成你的
        callback: handleCredentialResponse,
      });

      // @ts-ignore
      window.google.accounts.id.renderButton(
        document.getElementById("googleSignInButton"),
        { 
          theme: "outline", 
          size: "large",
          text: "signin_with",
          width: 250
        }
      );
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCredentialResponse = (response: any) => {
    console.log("Encoded JWT ID token: " + response.credential);
    setIdToken(response.credential);
    setError("");
  };

  const testBackendLogin = async () => {
    if (!idToken) {
      setError("请先通过Google登录获取idToken");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // 重要：允许cookie
        body: JSON.stringify({
          idToken: idToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUserInfo(data);
      setError("");
      console.log("登录成功:", data);
    } catch (err) {
      setError(`后端调用失败: ${err instanceof Error ? err.message : "未知错误"}`);
      console.error("Error:", err);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Google OAuth 测试页面</h1>
      
      <div className="space-y-6">
        {/* Step 1: Google 登录按钮 */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">Step 1: 点击Google登录</h2>
          <div id="googleSignInButton"></div>
        </div>

        {/* Step 2: 显示 ID Token */}
        {idToken && (
          <div className="border rounded-lg p-6 bg-green-50">
            <h2 className="text-xl font-semibold mb-4 text-green-800">
              Step 2: 获取到 ID Token ✓
            </h2>
            <div className="bg-white p-4 rounded border border-green-200">
              <p className="text-sm font-mono break-all">{idToken.substring(0, 50)}...</p>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Token 长度: {idToken.length} 字符
            </p>
          </div>
        )}

        {/* Step 3: 测试后端 */}
        {idToken && (
          <div className="border rounded-lg p-6 bg-blue-50">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">
              Step 3: 测试后端接口
            </h2>
            <button
              onClick={testBackendLogin}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              调用后端 /auth/google
            </button>
          </div>
        )}

        {/* 显示错误 */}
        {error && (
          <div className="border rounded-lg p-6 bg-red-50">
            <h3 className="text-lg font-semibold text-red-800 mb-2">错误</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* 显示用户信息 */}
        {userInfo && (
          <div className="border rounded-lg p-6 bg-purple-50">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">
              登录成功！用户信息：
            </h3>
            <pre className="bg-white p-4 rounded border border-purple-200 overflow-auto">
              {JSON.stringify(userInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}