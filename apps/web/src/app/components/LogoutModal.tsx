import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface Props{
isOpen:boolean; 
onClose:()=> void
}

export default function LogoutModal({isOpen, onClose}:Props) {
  const router = useRouter();
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
    toast.success("Ви вийшли з аккаунту!");
  };

  return (
    <div>
      {!isOpen && null}
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">Вийти з акаунта?</h3>
        <p className="mt-2 text-sm text-gray-500">
          Вам доведеться ввести пароль знову для входу.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 border-none outline-none cursor-pointer"
          >
            Скасувати
          </button>
          <button
            onClick={handleLogout}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-800 border-none outline-none cursor-pointer"
          >
            Вийти
          </button>
        </div>
      </div>
    </div>
    </div>
    
  );
}
