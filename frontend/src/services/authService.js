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
        // return whatever shape backend provides. Common: { accessToken, user } or { accessToken }
        return res.data;
    },

    signOut: async () => {
        // no request body, pass withCredentials in config
        const res = await api.post("/auth/signout", null, { withCredentials: true });
        console.log("[authService.signOut] res.data:", res.data);
        return res.data;
    },

    fetchMe: async () => {
        const res = await api.get("/users/me", { withCredentials: true });
        console.log("[authService.fetchMe] res.data:", res.data);
        // adjust according to backend: if backend returns { user }, keep res.data.user
        return res.data.user ?? res.data;
    },

    refresh: async () => {
        // no body, pass config as third arg
        const res = await api.post("/auth/refresh", null, { withCredentials: true });
        console.log("[authService.refresh] res.data:", res.data);
        return res.data.accessToken ?? res.data;
    },
};

export default authService;
