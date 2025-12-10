// src/components/ProtectedRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";

const LoadingScreen = () => (
    <div className="flex h-screen items-center justify-center">
        <div className="text-center">
            <div className="mb-3 animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto" />
            <div className="text-sm text-gray-600">Đang tải trang...</div>
        </div>
    </div>
);

const ProtectedRoute = () => {
    // selectors để hạn chế re-render
    const accessToken = useAuthStore((s) => s.accessToken);
    const user = useAuthStore((s) => s.user);
    const loading = useAuthStore((s) => s.loading);

    // lấy các hàm (hàm từ zustand thường stable, nhưng vẫn đưa vào deps)
    const refresh = useAuthStore((s) => s.refresh);
    const fetchMe = useAuthStore((s) => s.fetchMe);

    const [initializing, setInitializing] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            try {
                // Nếu đã có user thì không cần làm gì
                if (useAuthStore.getState().user) {
                    if (!cancelled) setInitializing(false);
                    return;
                }

                // Nếu không có token: cố gắng refresh (server có thể dùng refresh cookie)
                if (!useAuthStore.getState().accessToken) {
                    await refresh();
                }

                // Sau refresh, nếu có accessToken nhưng chưa có user thì fetchMe
                const currentToken = useAuthStore.getState().accessToken;
                const currentUser = useAuthStore.getState().user;

                if (currentToken && !currentUser) {
                    await fetchMe();
                }
            } catch (err) {
                // error handled inside store (toast + clearState)
                console.error("ProtectedRoute init error:", err);
            } finally {
                if (!cancelled) setInitializing(false);
            }
        };

        init();

        return () => {
            cancelled = true;
        };
        // intentionally include functions; accessToken/user not included to avoid double triggering —
        // we read latest state inside the effect via useAuthStore.getState()
    }, [refresh, fetchMe]);

    // show loading while initializing OR global loading flag true
    if (initializing || loading) return <LoadingScreen />;

    // nếu không có token/user -> redirect to signin
    const currentAccessToken = useAuthStore.getState().accessToken;
    if (!currentAccessToken) {
        return <Navigate to="/signin" replace />;
    }

    // đã xác thực -> render nested routes
    return <Outlet />;
};

export default ProtectedRoute;
