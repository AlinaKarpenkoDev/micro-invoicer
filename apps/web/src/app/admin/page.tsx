"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import LogoutModal from "../components/LogoutModal";
import LoadingSpinner from "../components/LoadingSpinner";
import ServerDownError from "../components/ServerDownError";

interface Workspace {
  workspace_id: string;
  workspace_name: string;
  owner_email: string;
  is_pro: boolean;
  owner_id: string;
  pro_requested: boolean;
}

export default function AdminPage() {
  const [filter, setFilter] = useState<"ALL" | "PRO" | "REQUESTED">("ALL");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isServerDown, setIsServerDown] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();

  const fetchWorkspaces = useCallback(async () => {
    const getToken = localStorage.getItem("token") as string;
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/invoices/admin/workspaces",
        {
          method: "GET",
          headers: { Authorization: `Bearer ${getToken}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setWorkspaces(data);
        setIsServerDown(false);
      } else if (response.status === 401) {
        toast.error("Сесія застаріла, введіть логін повторно");
        localStorage.removeItem("token");
        router.replace("/login");
      } else {
        throw new Error("Server error");
      }
    } catch {
      setIsServerDown(true);
      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const getToken = localStorage.getItem("token") as string;
    if (!getToken) {
      router.replace("/login");
      return;
    }
    try {
      const payload = JSON.parse(atob(getToken.split(".")[1]));
      if (!payload.role || payload.role !== "ADMIN") {
        toast.error("Доступ заборонено");
        router.replace("/");
        return;
      }
    } catch {
      router.replace("/login");
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    if (isServerDown) {
      timeoutId = setTimeout(() => {
        setRetryCount((prev) => prev + 1);
      }, 3000);
    } else {
      void (async () => {
        await fetchWorkspaces();
      })();
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [router, fetchWorkspaces, retryCount, isServerDown]);

  async function handlePlanChange(
    targetUserId: string,
    endpoint: "upgrade" | "reject-upgrade",
  ) {
    const getToken = localStorage.getItem("token") as string;
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + `/invoices/${endpoint}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ targetUserId }),
        },
      );
      if (response.ok) {
        toast.success("Статус успішно змінено!");
        fetchWorkspaces();
      } else if (response.status === 401) {
        toast.error("Сесія застаріла, введіть логін повторно");
        localStorage.removeItem("token");
        router.replace("/login");
      } else {
        toast.error("На жаль, не вдалося виконати дію..");
      }
    } catch {
      toast.error("Помилка з'єднання з сервером");
    }
  }

  async function handleImpersonate(targetUserId: string) {
    const getToken = localStorage.getItem("token") as string;
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/auth/impersonate",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ targetUserId }),
        },
      );
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("admin_token", getToken);
        localStorage.setItem("token", data.access_token);
        toast.success("Сесію змінено!");
        router.push("/");
      } else if (response.status === 401) {
        toast.error("Сесія застаріла, введіть логін повторно");
        localStorage.removeItem("token");
        router.replace("/login");
      } else {
        toast.error("На жаль, не вдалося виконати дію..");
      }
    } catch {
      toast.error("Помилка з'єднання з сервером");
    }
  }

  const totalUsers = workspaces.length;
  const proUsers = workspaces.filter((item) => item.is_pro == true);
  const pendingRequests = workspaces.filter(
    (item) => item.pro_requested === true && !item.is_pro,
  );

  const filteredWorkspaces =
    (filter === "PRO" && proUsers) ||
    (filter === "REQUESTED" && pendingRequests) ||
    workspaces;

  return (
    <div>
      {isServerDown && <ServerDownError />}
      <div className="min-h-screen bg-gray-50 p-8 font-sans">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
                Панель Адміністратора
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Керування користувачами та тарифами
              </p>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 border-none outline-none cursor-pointer"
            >
              Вийти
            </button>
          </div>
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div
                  onClick={() => setFilter("ALL")}
                  className={`cursor-pointer transition-all flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ${filter === "ALL" ? "ring-2 ring-gray-300" : ""}`}
                >
                  <span className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                    Всього користувачів
                  </span>
                  <span className="mt-2 text-4xl font-black text-gray-900">
                    {totalUsers}
                  </span>
                </div>
                <div
                  onClick={() => setFilter("PRO")}
                  className={`cursor-pointer transition-all flex flex-col rounded-2xl border border-purple-200 bg-purple-50 p-6 shadow-sm ${filter === "PRO" ? "ring-2 ring-purple-600" : ""}`}
                >
                  <span className="text-sm font-semibold uppercase tracking-wider text-purple-600">
                    Pro-акаунти
                  </span>
                  <span className="mt-2 text-4xl font-black text-purple-900">
                    {proUsers.length}
                  </span>
                </div>
                <div
                  onClick={() => setFilter("REQUESTED")}
                  className={`cursor-pointer transition-all flex flex-col rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm ${filter === "REQUESTED" ? "ring-2 ring-amber-500" : ""}`}
                >
                  <span className="text-sm font-semibold uppercase tracking-wider text-amber-600">
                    Запити на Pro
                  </span>
                  <span className="mt-2 text-4xl font-black text-amber-900">
                    {pendingRequests.length}
                  </span>
                </div>
              </div>
              <div className="hidden w-full overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm sm:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 w-[30%]">
                        Власник
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 w-[30%]">
                        Організація
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Тариф
                      </th>
                      <th className="px-6 py-4 w-[1%]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredWorkspaces.map((ws) => (
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
                          <div className="flex items-center gap-3">
                            <span
                              className={`inline-flex w-12 items-center justify-center rounded-full py-0.5 text-xs font-medium ${ws.is_pro ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"}`}
                            >
                              {ws.is_pro ? "Pro" : "Free"}
                            </span>
                            {!ws.is_pro && ws.pro_requested && (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                                  Запит на Pro
                                </span>
                                <button
                                  onClick={() =>
                                    handlePlanChange(ws.owner_id, "upgrade")
                                  }
                                  className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white shadow-sm transition-all hover:bg-emerald-700 cursor-pointer border-none"
                                >
                                  Схвалити
                                </button>
                                <button
                                  onClick={() =>
                                    handlePlanChange(
                                      ws.owner_id,
                                      "reject-upgrade",
                                    )
                                  }
                                  className="inline-flex items-center justify-center rounded-md bg-red-50 px-3 py-1 text-xs font-medium text-red-700 transition-all hover:bg-red-100 cursor-pointer border-none"
                                >
                                  Відхилити
                                </button>
                              </div>
                            )}
                            {!ws.is_pro && !ws.pro_requested && (
                              <button
                                onClick={() =>
                                  handlePlanChange(ws.owner_id, "upgrade")
                                }
                                className="inline-flex w-32 items-center justify-center rounded-md bg-purple-600 py-1 text-xs font-medium text-white shadow-sm transition-all hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 border-none cursor-pointer"
                              >
                                Upgrade to Pro
                              </button>
                            )}
                            {ws.is_pro && (
                              <button
                                onClick={() =>
                                  handlePlanChange(
                                    ws.owner_id,
                                    "reject-upgrade",
                                  )
                                }
                                className="inline-flex w-32 items-center justify-center rounded-md bg-yellow-500 py-1 text-xs font-medium text-white shadow-sm transition-all hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 border-none cursor-pointer"
                              >
                                Change to Free
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm w-[1%]">
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
                {filteredWorkspaces.map((ws) => (
                  <div
                    key={ws.workspace_id}
                    className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex min-w-0 flex-1 pr-3 flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          Акаунт
                        </span>
                        <span className="truncate text-base font-bold text-gray-900">
                          {ws.owner_email}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase ${ws.is_pro ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"}`}
                        >
                          {ws.is_pro ? "Pro" : "Free"}
                        </span>
                        {!ws.is_pro && ws.pro_requested && (
                          <div className="flex flex-col items-end gap-1.5 mt-1">
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                              Запит на Pro
                            </span>
                            <div className="flex gap-1.5">
                              <button
                                className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white border-none cursor-pointer"
                                onClick={() =>
                                  handlePlanChange(ws.owner_id, "upgrade")
                                }
                              >
                                Схвалити
                              </button>
                              <button
                                className="px-2.5 py-1.5 text-xs font-bold rounded-lg text-red-700 border-none cursor-pointer bg-red-50"
                                onClick={() =>
                                  handlePlanChange(
                                    ws.owner_id,
                                    "reject-upgrade",
                                  )
                                }
                              >
                                Відхилити
                              </button>
                            </div>
                          </div>
                        )}
                        {!ws.is_pro && !ws.pro_requested && (
                          <button
                            onClick={() =>
                              handlePlanChange(ws.owner_id, "upgrade")
                            }
                            className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-purple-700 border-none cursor-pointer"
                          >
                            Upgrade
                          </button>
                        )}
                        {ws.is_pro && (
                          <button
                            onClick={() =>
                              handlePlanChange(ws.owner_id, "reject-upgrade")
                            }
                            className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-amber-600 border-none cursor-pointer"
                          >
                            Change to Free
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mb-5 flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Організація
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
          )}
        </div>
        {showLogoutConfirm && (
          <LogoutModal
            isOpen={showLogoutConfirm}
            onClose={() => setShowLogoutConfirm(false)}
          />
        )}
      </div>
    </div>
  );
}
