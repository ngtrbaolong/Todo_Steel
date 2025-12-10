import React from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

const Logout = () => {
    const signOut = useAuthStore((s) => s.signOut);
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();  // store đã try/catch + toast sẵn
        navigate("/signin");
    };

    return (
        <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-gray-600 hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
            aria-label="Đăng xuất"
            title="Đăng Xuất"
        >
            <LogOut className="w-4 h-4" />
            Đăng Xuất
        </Button>
    );
};

export default Logout;
