import { CgSpinner } from "react-icons/cg";

export default function Loader() {
  return (
    <div className="h-full flex items-center justify-center">
      <CgSpinner className="h-8 w-8 animate-spin" />
    </div>
  );
}
