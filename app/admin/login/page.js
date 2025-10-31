"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";

export default function AdminLogin() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showBotControl, setShowBotControl] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!firstName || !accessCode) {
      setError("Please enter name and access code.");
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.post("/api/auth/login", {
        first_name: firstName,
        access_code: accessCode,
      });

      if (response.data) {
        const data = response.data;
        localStorage.setItem("token", data.access_token ?? "demo-token");
        localStorage.setItem("first_name", data.first_name ?? firstName);
        localStorage.setItem("is_super_admin", data.is_super_admin ?? false);
        
        // Redirect based on option selected
        if (showBotControl) {
          router.push("/gcsj-tracker"); // Bot control page
        } else {
          router.push("/admin");
        }
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.detail || "Invalid credentials. Please try again.");
      } else if (err.request) {
        setError("Cannot connect to server. Please check your connection.");
      } else {
        setError("An error occurred. Please try again.");
      }
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/70 backdrop-blur rounded-2xl p-8 shadow-lg">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Admin Access</h1>
          <p className="text-sm text-gray-600">Enter your credentials to continue</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
            <input 
              value={firstName} 
              onChange={(e) => setFirstName(e.target.value)} 
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
              placeholder="Enter your first name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Access code</label>
            <input 
              type="password" 
              value={accessCode} 
              onChange={(e) => setAccessCode(e.target.value)} 
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
              placeholder="Enter your access code"
            />
          </div>

          {/* Bot Control Option */}
          <div className="flex items-center space-x-2 p-3 bg-indigo-50 rounded-lg">
            <input
              type="checkbox"
              id="botControl"
              checked={showBotControl}
              onChange={(e) => setShowBotControl(e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="botControl" className="text-sm text-gray-700 cursor-pointer">
              🤖 Access Bot Control Panel
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-3 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition disabled:bg-indigo-400"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Need access? Contact your administrator</p>
        </div>
      </div>
    </div>
  );
}
