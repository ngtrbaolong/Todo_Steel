// src/stores/useAuthStore.js
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { toast } from "sonner";
import { authService } from "@/services/authService";

export const useAuthStore = create(
    devtools(
        persist(
            (set, get) => ({
                accessToken: null,
                user: null,
                loading: false,

                setAccessToken: (accessToken) => {
                    set({ accessToken });
                },

                clearState: () => {
                    set({ accessToken: null, user: null, loading: false });
                },

                signUp: async (username, password, email, firstName, lastName) => {
                    try {
                        set({ loading: true });
                        await authService.signUp(username, password, email, firstName, lastName);
                        toast.success("Đăng ký thành công! Bạn sẽ được chuyển sang trang đăng nhập.");
                    } catch (error) {
                        console.error(error);
                        toast.error("Đăng ký không thành công");
                    } finally {
                        set({ loading: false });
                    }
                },

                signIn: async (username, password) => {
                    try {
                        set({ loading: true });

                        // backend trả { accessToken, user }
                        const res = await authService.signIn(username, password);
                        const { accessToken, user } = res;

                        // lưu accessToken
                        get().setAccessToken(accessToken);

                        // ⭐ LƯU user trực tiếp
                        if (user) {
                            set({ user });
                        } else {
                            // fallback nếu backend không trả user
                            await get().fetchMe();
                        }

                        toast.success("Chào mừng bạn quay lại với Steel 🎉");
                    } catch (error) {
                        console.error(error);
                        toast.error("Đăng nhập không thành công!");
                    } finally {
                        set({ loading: false });
                    }
                },

                signOut: async () => {
                    try {
                        get().clearState();
                        await authService.signOut();
                        toast.success("Logout thành công!");
                    } catch (error) {
                        console.error(error);
                        toast.error("Lỗi xảy ra khi logout. Hãy thử lại!");
                    }
                },

                fetchMe: async () => {
                    try {
                        set({ loading: true });
                        const user = await authService.fetchMe();
                        set({ user });
                    } catch (error) {
                        console.error(error);
                        set({ user: null, accessToken: null });
                        toast.error("Lỗi xảy ra khi lấy dữ liệu người dùng. Hãy thử lại!");
                    } finally {
                        set({ loading: false });
                    }
                },

                refresh: async () => {
                    try {
                        set({ loading: true });

                        const accessToken = await authService.refresh();
                        if (accessToken) {
                            get().setAccessToken(accessToken);

                            if (!get().user) {
                                await get().fetchMe();
                            }
                        } else {
                            get().clearState();
                        }
                    } catch (error) {
                        console.error(error);
                        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
                        get().clearState();
                    } finally {
                        set({ loading: false });
                    }
                },
            }),
            {
                name: "todo-steel-auth",
                partialize: (state) => ({ accessToken: state.accessToken }),
            }
        )
    )
);
