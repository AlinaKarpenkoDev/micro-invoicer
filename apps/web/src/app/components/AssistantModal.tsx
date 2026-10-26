"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  assistants: { id: string; email: string }[];
  onSuccess: () => void;
}

export default function AssistantModal({
  isOpen,
  onClose,
  assistants,
  onSuccess,
}: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  async function handleCreateAssistant(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Пароль має містити мінімум 6 символів");
      return;
    }
    const getToken = localStorage.getItem("token") as string;
    if (!getToken) return router.replace("/login");

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/auth/assistants",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        },
      );
      if (response.ok) {
        toast.success("Асистента успішно додано!");
        setEmail("");
        setPassword("");
        setShowAddForm(false);
        onClose();
        onSuccess();
      } else {
        toast.error("Користувач з таким email вже існує або сталася помилка");
      }
    } catch {
      toast.error("Помилка з'єднання з сервером");
    }
  }

  async function handleDeleteAssistant(id: string) {
    const getToken = localStorage.getItem("token") as string;
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + `/auth/assistants/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${getToken}` },
        },
      );
      if (response.ok) {
        toast.success("Асистента видалено!");
        onClose();
        onSuccess();
      } else {
        toast.error("Помилка при видаленні");
      }
    } catch {
      toast.error("Помилка з'єднання з сервером");
    }
  }

  if (!isOpen) return null;

  if (assistants && assistants.length > 0 && !showAddForm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4">
        <div className="box-border w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <h3 className="text-lg font-bold text-gray-900">Ваш асистент</h3>
          <p className="mb-4 mt-1 text-sm text-gray-500">
            Користувачі, які мають доступ до ваших інвойсів:
          </p>
          <div className="space-y-3">
            {assistants.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
              >
                <span className="truncate pr-3 text-sm font-medium text-gray-900">
                  {a.email}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteAssistant(a.id)}
                  className="cursor-pointer rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 border-none outline-none"
                >
                  Видалити
                </button>
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 cursor-pointer rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200 border-none outline-none"
            >
              Закрити
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="flex-1 cursor-pointer rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zinc-800 border-none outline-none"
            >
              + Асистент
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4">
      <div className="box-border w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">Додати асистента</h3>
        <p className="mb-5 mt-1 text-sm text-gray-500">
          Асистент зможе переглядати інвойси, завантажувати PDF та змінювати
          статус.
        </p>
        <form onSubmit={handleCreateAssistant} className="space-y-4">
          <div>
            <input
              type="email"
              required
              placeholder="Email асистента"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="box-border block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
            />
          </div>
          <div>
            <input
              type="password"
              required
              placeholder="Пароль (мінімум 6 символів)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="box-border block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
            />
          </div>
          <div className="mt-6 flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                onClose();
              }}
              className="flex-1 cursor-pointer rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200 border-none outline-none"
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="flex-1 cursor-pointer rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zinc-800 border-none outline-none"
            >
              Додати
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
