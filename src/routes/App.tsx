import AppLayout from "@/layout/AppLayout";
import { Outlet } from "react-router-dom";

export default function App() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
