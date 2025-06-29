import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/auth/SessionContext";
import { CgSpinner } from "react-icons/cg";
import { useTheme } from "@/providers/theme-provider";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();

  const { toast } = useToast();

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
    <div className="w-screen h-screen overflow-hidden flex items-center justify-center flex-col gap-4">
      <img
        src={
          theme === "dark"
            ? "/swaram-logo-full-dark.png"
            : "/swaram-logo-full.png"
        }
        draggable="false"
        className="w-72 mb-8"
      />
      <Card className="py-6 md:px-6 w-[90%] max-w-[500px]">
        <CardTitle className="text-xl md:text-2xl text-center mb-8">
          Sign in to your account
        </CardTitle>
        <CardContent>
          <form onSubmit={loginUser} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="email" className="mb-2 block">
                Email
              </Label>
              <Input
                type="email"
                id="email"
                placeholder="Email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password" className="mb-2 block">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="mt-4" disabled={isLoading}>
              {isLoading ? <CgSpinner className="animate-spin" /> : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
