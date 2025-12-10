import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function LoginButton() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  if (loading) {
    return <div className="text-gray-600 text-sm dark:text-gray-300">Laddar...</div>;
  }

  if (!user) {
    return (
      <button
        onClick={signInWithGoogle}
        className="px-4 py-2 rounded-lg bg-yellow-400 text-gray-900 font-semibold shadow-sm hover:bg-yellow-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2"
      >
        Logga in
      </button>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const initials = (user.user_metadata?.full_name || user.email || "P")[0]?.toUpperCase() || "P";

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown((prev) => !prev)}
        className="flex items-center justify-center rounded-full border border-gray-200 bg-white p-1 shadow-sm transition-colors hover:border-yellow-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-yellow-400"
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatarUrl} alt="Profil" />
          <AvatarFallback className="bg-yellow-400 text-gray-900 font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </button>

      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-52 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Inloggad som</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{user.email}</p>
          </div>
          <button
            onClick={() => {
              setShowDropdown(false);
              navigate("/account");
            }}
            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-gray-900 font-semibold transition-colors dark:text-gray-100 dark:hover:bg-gray-800"
          >
            Mina uppgifter
          </button>
          <button
            onClick={() => {
              setShowDropdown(false);
              navigate("/orders");
            }}
            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-gray-900 font-semibold transition-colors dark:text-gray-100 dark:hover:bg-gray-800"
          >
            Mina bestallningar
          </button>
          <button
            onClick={() => {
              setShowDropdown(false);
              signOut();
            }}
            className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 flex items-center gap-2 font-semibold transition-colors dark:hover:bg-red-950"
          >
            <LogOut className="w-4 h-4" />
            Logga ut
          </button>
        </div>
      )}
    </div>
  );
}
