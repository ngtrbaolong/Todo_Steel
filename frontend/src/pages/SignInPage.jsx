import { SigninForm } from "@/components/auth/signin-form";

const SignInPage = () => {
    return (
        <div
            className="flex min-h-svh flex-col items-center justify-center p-6 md:p-10 absolute inset-0 z-0"
            style={{
                backgroundImage: `
                    radial-gradient(circle at 30% 70%, rgba(173, 216, 230, 0.35), transparent 60%),
                    radial-gradient(circle at 70% 30%, rgba(255, 182, 193, 0.4), transparent 60%)
                `,
            }}
        >
            <div className="w-full max-w-sm md:max-w-4xl relative z-10">
                <SigninForm />
            </div>
        </div>
    );
};

export default SignInPage;