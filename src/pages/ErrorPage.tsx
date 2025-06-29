import { Link } from "react-router-dom";

const NotFoundPage: React.FC = () => {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center text-center bg-gradient-to-b from-primary/10 to-transparent">
      <h1 className="text-9xl">404</h1>
      <h4 className="text-neutral-600 dark:text-neutral-300 text-3xl mb-4">
        Page not found!
      </h4>
      <p className="text-neutral-500 dark:text-neutral-400 mb-10">
        The page you have been looking for doesn't exist or has been removed.
      </p>
      <Link to="/" className="hover:text-primary">
        Go back to Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
