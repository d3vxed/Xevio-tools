import { Link } from "react-router-dom";
import { Button } from "../components/ui";

export default function NotFound() {
  return (
    <div className="fade-in flex flex-col items-center justify-center py-24 text-center">
      <div className="text-6xl font-semibold tracking-tighter bg-gradient-to-b from-[#E8E1D5] to-[#91887D] bg-clip-text text-transparent">
        404
      </div>
      <h1 className="mt-2 text-xl font-medium">Page not found</h1>
      <p className="mt-2 text-sm text-[#91887D] max-w-sm">
        The page you're looking for doesn't exist or has moved.
      </p>
      <div className="mt-6 flex gap-2">
        <Link to="/">
          <Button>Go home</Button>
        </Link>
        <Link to="/tools/json-formatter">
          <Button variant="outline">Try JSON Formatter</Button>
        </Link>
      </div>
    </div>
  );
}
