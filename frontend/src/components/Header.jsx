import React, { useCallback } from "react";
import { LogIn, UserPlus, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import Logout from "@/components/auth/Logout";

/**
 * Normalize Vietnamese (or other accented) characters to plain ASCII.
 * e.g. "Đặng Thế" -> "Dang The"
 */
function stripDiacritics(str = "") {
  return str
    .normalize?.("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove combining diacritics
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

const getInitials = (user) => {
  if (!user) return "U";

  // Prefer explicit firstName / lastName
  const firstName = user.firstName?.trim();
  const lastName = user.lastName?.trim();

  if (firstName || lastName) {
    // take first char of firstName and first char of lastName (if exists)
    const a = stripDiacritics(firstName || "").charAt(0) || "";
    const b = stripDiacritics(lastName || "").charAt(0) || "";
    const initials = (a + b).toUpperCase();
    return initials || (stripDiacritics(user.username || user.email || "U").slice(0, 2).toUpperCase());
  }

  // fallback to username (first two chars) or email initial
  if (user.username) return stripDiacritics(user.username).slice(0, 2).toUpperCase();
  if (user.email) return stripDiacritics(user.email).charAt(0).toUpperCase();
  return "U";
};

const buildDisplayName = (user) => {
  if (!user) return "";
  const parts = [];
  if (user.firstName) parts.push(user.firstName.trim());
  if (user.lastName) parts.push(user.lastName.trim());
  if (parts.length) return parts.join(" ");
  if (user.username) return user.username;
  if (user.email) return user.email.split("@")[0];
  return "";
};

export const Header = React.memo(function Header() {
  const navigate = useNavigate();
  // select only user to minimize re-renders; if you need loading, select it separately
  const user = useAuthStore((s) => s.user);

  const handleSignIn = useCallback(() => navigate("/signin"), [navigate]);
  const handleSignUp = useCallback(() => navigate("/signup"), [navigate]);
  const handleProfile = useCallback(() => navigate("/profile"), [navigate]);

  const initials = getInitials(user);
  const displayName = buildDisplayName(user);

  return (
    <header className="relative w-full">
      {/* Auth buttons cố định góc phải màn hình */}
      <div className="fixed top-4 right-4 md:top-6 md:right-8 flex items-center gap-3 z-50">
        {user ? (
          <>
            {/* Avatar + tên (hộp giống mẫu) */}
            <div className="flex items-center gap-3 mr-2">
              <div
                className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-purple-100 shadow-sm"
                title={displayName || "Người dùng"}
              >
                <div
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm shadow-md"
                  aria-hidden="true"
                >
                  {initials || "U"}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {displayName || "Người dùng"}
                </span>
              </div>
            </div>

            {/* Hồ Sơ */}
            <Button
              variant="secondary"
              onClick={handleProfile}
              className="bg-white/80 backdrop-blur-sm border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 shadow-sm flex items-center gap-2"
              aria-label="Xem hồ sơ"
              title="Hồ Sơ"
            >
              <UserIcon className="w-4 h-4 mr-2" />
              Hồ Sơ
            </Button>

            {/* Logout component: đảm bảo component này gọi signOut */}
            <Logout />
          </>
        ) : (
          <>
            {/* Sign In — giữ phong cách tím */}
            <Button
              variant="ghost"
              onClick={handleSignIn}
              className="flex items-center gap-2 text-purple-700 hover:bg-purple-100"
              aria-label="Đăng nhập"
              title="Đăng Nhập"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Đăng Nhập
            </Button>

            {/* Sign Up — giữ màu filled */}
            <Button
              variant="primary"
              onClick={handleSignUp}
              className="bg-purple-600 hover:bg-purple-700 shadow-md flex items-center gap-2"
              aria-label="Đăng ký"
              title="Đăng Ký"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Đăng Ký
            </Button>
          </>
        )}
      </div>

      {/* Tiêu đề chính (giữ nguyên) */}
      <div className="space-y-2 text-center py-6">
        <h1 className="text-4xl md:text-5xl font-bold text-purple-600 tracking-tight">
          TodoSteel
        </h1>
        <p className="text-gray-500">
          Đá đi lâu cũng mòn, sắt mài lâu cũng sắc <span className="text-xl">💪</span>
        </p>
      </div>
    </header>
  );
});

export default Header;
