import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

import HomePage from "./pages/HomePage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import NotFound from "./pages/NotFound";

import { useAuthStore } from "@/stores/useAuthStore";

export default function App() {
  const refresh = useAuthStore((s) => s.refresh);

  // 🔥 Khi app khởi động, tự kiểm tra phiên đăng nhập
  useEffect(() => {
    refresh();  // gọi API /auth/refresh (nếu có cookie refresh token)
  }, [refresh]);

  return (
    <>
      <Toaster richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
