import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "recharts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/providers/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/auth/SessionContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { CgSpinner } from "react-icons/cg";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const { session } = useSession();
  if (session) return <Navigate to="/" />;

  async function loginUser(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Error occurred. Please try again",
        description: error.message,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center dark:bg-neutral-950 bg-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#ff0f7b4a] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#f89b294a] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        </div>

        <Card className="backdrop-blur-sm bg-card shadow-2xl relative overflow-hidden">
          {/* Top gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff0f7b] to-[#f89b29]"></div>

          <CardHeader className="text-center pb-4">
            {/* Logo */}
            <div className="mx-auto w-60 h-32 relative rounded-lg">
              <img
                src={
                  theme === "dark"
                    ? "/swaram-logo-full-dark.png"
                    : "/swaram-logo-full.png"
                }
                draggable="false"
                alt="Company Logo"
                className="w-full h-full object-contain p-2"
              />
            </div>

            <CardTitle className="text-3xl font-bold bg-gradient-to-r">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={loginUser} className="flex flex-col gap-4">
              <div className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label className="text-gray-700 font-semibold">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="px-4"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label className="text-gray-700 font-semibold">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="px-4"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full text-white font-semibold rounded-lg shadow-lg disabled:transform-none"
                >
                  {isLoading ? <CgSpinner className="animate-spin" /> : "Login"}
                </Button>
              </div>
            </form>
            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-neutral-500 text-xs">
                &copy; 2025 Swaram Music Academy. All rights reserved.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
