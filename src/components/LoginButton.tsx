import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User } from 'lucide-react';

export function LoginButton() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  if (loading) {
    return <div className="text-gray-600 text-sm">Laddar...</div>;
  }

  if (!user) {
    return (
      <button
        onClick={signInWithGoogle}
        className="px-4 py-2 bg-yellow-400 text-gray-900 rounded font-semibold hover:bg-yellow-500 transition-colors"
      >
        Logga in
      </button>
    );
  }

  // User is logged in
  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 text-gray-900 hover:bg-gray-100 rounded transition-colors"
      >
        <User className="w-5 h-5" />
        <span className="text-sm font-semibold">{user.email?.split('@')[0] || 'Profil'}</span>
      </button>

      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-50">
          <div className="p-4 border-b border-gray-200">
            <p className="text-xs text-gray-600">Inloggad som</p>
            <p className="font-semibold text-gray-900 truncate">{user.email}</p>
          </div>
          <button
            onClick={() => {
              setShowDropdown(false);
              signOut();
            }}
            className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 flex items-center gap-2 font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logga ut
          </button>
        </div>
      )}
    </div>
  );
}
