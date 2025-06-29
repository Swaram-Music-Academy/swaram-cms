import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "@/auth/SessionContext";

const AuthProtectedRoute = () => {
  const { session } = useSession();
  if (!session) {
    return <Navigate to="/login" />;
  }
  return <Outlet />;
};

export default AuthProtectedRoute;
