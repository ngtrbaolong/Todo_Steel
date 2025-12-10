// src/services/authService.js
import api from "@/lib/axios";

export const authService = {
    signUp: async (username, password, email, firstName, lastName) => {
        const res = await api.post(
            "/auth/signup",
            { username, password, email, firstName, lastName },
            { withCredentials: true }
        );
        console.log("[authService.signUp] res.data:", res.data);
        return res.data;
    },

    signIn: async (username, password) => {
        const res = await api.post(
            "/auth/signin",
            { username, password },
            { withCredentials: true }
        );
        console.log("[authService.signIn] res.data:", res.data);

        // backend trả: { accessToken, user }
        return {
            accessToken: res.data.accessToken,
            user: res.data.user ?? null,
        };
    },

    signOut: async () => {
        await api.post("/auth/signout", null, { withCredentials: true });
        console.log("[authService.signOut] OK (204)");
        return true;
    },

    fetchMe: async () => {
        const res = await api.get("/users/me", { withCredentials: true });
        console.log("[authService.fetchMe] res.data:", res.data);

        // backend trả: { user }
        return res.data.user;
    },

    refresh: async () => {
        const res = await api.post("/auth/refresh", null, { withCredentials: true });
        console.log("[authService.refresh] res.data:", res.data);

        // backend trả: { accessToken }
        return res.data.accessToken;
    },
};

export default authService;
