"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Workspace {
  workspace_id: string;
  workspace_name: string;
  owner_email: string;
  is_pro: boolean;
  owner_id: string;
}

export default function AdminPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const router = useRouter();

  useEffect(() => {
    const getToken = localStorage.getItem("token") as string;

    if (!getToken) {
      router.push("/login");
      return;
    }

    async function fetchWorkspaces() {
      try {
        const payload = JSON.parse(atob(getToken.split(".")[1]));

        if (!payload.role || payload.role !== "ADMIN") {
          toast.error("Доступ заборонено");
          router.push("/");
          return;
        }

        const response = await fetch(
          "http://localhost:4000/invoices/admin/workspaces",
          {
            method: "GET",
            headers: { Authorization: `Bearer ${getToken}` },
          },
        );

        if (response.ok) {
          const data = await response.json();
          setWorkspaces(data);
        } else {
          localStorage.removeItem("token");
          router.push("/login");
        }
      } catch {
        toast.error("Помилка з'єднання з сервером.");
      }
    }

    fetchWorkspaces();
  }, [router]);

  async function handleImpersonate(targetUserId: string) {
    const getToken = localStorage.getItem("token") as string;
    try {
      const response = await fetch("http://localhost:4000/auth/impersonate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetUserId: targetUserId }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("admin_token", getToken);
        localStorage.setItem("token", data.access_token);
        toast.success("Сесію змінено!");
        router.push("/");
      } else {
        toast.error("На жаль, не вдалося виконати дію..");
      }
    } catch {
      toast.error("Помилка з'єднання з сервером");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Панель Адміністратора
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Керування просторами та користувачами
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow cursor-pointer"
          >
            На сайт
          </button>
        </div>

        <>
          {/* ДЕСКТОП: Таблиця */}
          <div className="hidden w-full overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm sm:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Власник
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Простір
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Тариф
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Дії
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {workspaces.map((ws) => (
                  <tr
                    key={ws.workspace_id}
                    className="group transition-colors hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {ws.owner_email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {ws.workspace_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ws.is_pro ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"}`}
                      >
                        {ws.is_pro ? "Pro" : "Free"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <button
                        onClick={() => handleImpersonate(ws.owner_id)}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow focus:outline-none focus:ring-2 focus:ring-gray-200 cursor-pointer"
                      >
                        Увійти як
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 sm:hidden">
            {workspaces.map((ws) => (
              <div
                key={ws.workspace_id}
                className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex w-3/4 flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Акаунт
                    </span>
                    <span className="truncate text-base font-bold text-gray-900">
                      {ws.owner_email}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase ${ws.is_pro ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"}`}
                  >
                    {ws.is_pro ? "Pro" : "Free"}
                  </span>
                </div>
                <div className="mb-5 flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Простір
                  </span>
                  <span className="text-sm font-medium text-gray-600">
                    {ws.workspace_name}
                  </span>
                </div>
                <button
                  onClick={() => handleImpersonate(ws.owner_id)}
                  className="w-full rounded-xl bg-zinc-900 py-3.5 text-sm font-bold text-white transition-all hover:bg-zinc-800 border-none outline-none cursor-pointer"
                >
                  Увійти в акаунт
                </button>
              </div>
            ))}
          </div>
        </>
      </div>
    </div>
  );
}
