import { useTheme } from "@/providers/theme-provider";
import { Link } from "react-router-dom";

export default function HeroBrand() {
  const { theme } = useTheme();
  return (
    <Link to="/">
      <div className="p-2 flex gap-4 items-center">
        <img
          src={theme === "dark" ? "/logo-dark.png" : "/logo.png"}
          alt="Logo"
          className="object-contain h-8 w-8"
        />
        <p className="text-lg font-medium text-black dark:text-white">
          Swaram CMS
        </p>
      </div>
    </Link>
  );
}
