"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { InvoiceDTO } from "@micro-invoicer/shared";
import toast from "react-hot-toast";
import LogoutModal from "./components/LogoutModal";
import LoadingSpinner from "./components/LoadingSpinner";
import ServerDownError from "./components/ServerDownError";
import AssistantModal from "./components/AssistantModal";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [isServerDown, setIsServerDown] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [archivedInvoices, setArchivedInvoices] = useState<InvoiceDTO[]>([]);
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [isAdminImpersonating, setIsAdminImpersonating] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [totalInvoicesCount, setTotalInvoicesCount] = useState(0);
  const [showAssistantModal, setShowAssistantModal] = useState(false);
  const [assistants, setAssistants] = useState<{ id: string; email: string }[]>(
    [],
  );

  const router = useRouter();

  useEffect(() => {
    const getToken = localStorage.getItem("token") as string;

    if (!getToken) {
      router.replace("/login");
      return;
    }

    const payload = JSON.parse(atob(getToken.split(".")[1]));

    if (payload.role === "ADMIN" && !localStorage.getItem("admin_token")) {
      router.replace("/admin");
      return;
    }

    async function fetchInvoices() {
      try {
        if (localStorage.getItem("admin_token")) {
          setIsAdminImpersonating(true);
        }

        const response = await fetch(
          process.env.NEXT_PUBLIC_API_URL + "/invoices",
          {
            method: "GET",
            headers: { Authorization: `Bearer ${getToken}` },
          },
        );

        if (response.ok) {
          const responseData = await response.json();
          setInvoices(responseData.data);
          setRole(payload.role);
          setIsPro(responseData.isPro);
          setIsServerDown(false);
          setTotalInvoicesCount(responseData.totalCount);
          setArchivedInvoices(responseData.archived);
          setAssistants(responseData.assistants || []);
        } else {
          localStorage.removeItem("token");
          router.replace("/login");
        }
      } catch {
        setIsServerDown(true);
        setTimeout(() => {
          fetchInvoices();
        }, 3000);
      } finally {
        setIsLoading(false);
      }
    }

    fetchInvoices();
  }, [router]);

  async function handleDownload(invoiceId: string) {
    setDownloadingId(invoiceId);
    const getToken = localStorage.getItem("token");
    try {
      if (!getToken) {
        toast.error("Сесія застаріла, введіть логін повторно");
        router.replace("/login");
        return;
      } else {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/invoices/${invoiceId}/pdf`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${getToken}` },
          },
        );
        if (response.ok) {
          const data = await response.json();
          window.open(data.url, "_blank");
          toast.success("Інвойс відкрито!");
        } else {
          if (response.status === 401) {
            toast.error("Сесія застаріла, введіть логін повторно");
            localStorage.removeItem("token");
            router.replace("/login");
          } else {
            const errorData = await response.json().catch(() => ({}));
            toast.error(errorData?.message || "Дія заборонена.");
          }
        }
      }
    } catch {
      toast.error("Помилка з'єднання з сервером");
    } finally {
      setDownloadingId(null);
    }
  }

  function confirmDelete(id: string) {
    setInvoiceToDelete(id);
  }

  async function executeDelete() {
    if (!invoiceToDelete) return;

    const getToken = localStorage.getItem("token");
    try {
      if (!getToken) {
        toast.error("Сесія застаріла, введіть логін повторно");
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/invoices/${invoiceToDelete}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${getToken}` },
        },
      );

      if (response.ok) {
        toast.success("Інвойс видалено!");
        const deletedItem = invoices.find((inv) => inv.id === invoiceToDelete);
        if (deletedItem) {
          setArchivedInvoices((prev) => [
            ...prev,
            { ...deletedItem, status: "DELETED" },
          ]);
        }
        setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceToDelete));
      } else {
        toast.error("Не вдалося видалити інвойс.");
      }
    } catch {
      toast.error("Помилка з'єднання з сервером");
    } finally {
      setInvoiceToDelete(null);
    }
  }

  const handleLeaveImpersonation = () => {
    const adminToken = localStorage.getItem("admin_token");
    if (adminToken) {
      localStorage.setItem("token", adminToken);
      localStorage.removeItem("admin_token");
      toast.success("Ви повернулися в адмінку!");
      router.replace("/admin");
    }
  };

  async function handleToggleStatus(inv: InvoiceDTO) {
    try {
      const getToken = localStorage.getItem("token");

      if (!getToken) {
        toast.error("Сесія застаріла, введіть логін повторно");
        router.replace("/login");
        return;
      }

      if (showArchived == true) {
        return;
      }

      const newStatus = inv.status === "PENDING" ? "PAID" : "PENDING";

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/invoices/${inv.id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${getToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (response.ok) {
        setInvoices((prev) =>
          prev.map((item) =>
            item.id === inv.id ? { ...item, status: newStatus } : item,
          ),
        );
        toast.success("Статус змінено!");
      } else {
        toast.error("Не вдалося виконати дію..");
      }
    } catch {
      toast.error("Помилка з'єднання з сервером");
    }
  }

  const currentInvoices = showArchived ? archivedInvoices : invoices;

  const getStatusColor = (status: InvoiceDTO["status"]) =>
    status === "PAID"
      ? "bg-green-100 text-green-800"
      : status === "DELETED"
        ? "bg-red-100 text-red-800"
        : "bg-yellow-100 text-yellow-800";

  return (
    <div>
      {isServerDown && <ServerDownError />}
      <div className="min-h-screen bg-gray-50 p-8 font-sans">
        {isAdminImpersonating && (
          <div className="mx-auto mb-8 max-w-4xl">
            <div className="flex items-center justify-between rounded-xl bg-zinc-800 px-6 py-4 shadow-lg ring-1 ring-slate-800">
              <div className="flex items-center gap-4">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-zinc-400 opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-zinc-500"></span>
                </span>
                <span className="text-sm font-medium text-slate-200">
                  Режим перегляду:
                  <span className="font-bold text-white"> Адміністратор</span>
                </span>
              </div>
              <button
                onClick={handleLeaveImpersonation}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer border-none outline-none"
              >
                Повернутися
              </button>
            </div>
          </div>
        )}
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                  Мої Інвойси
                </h1>
                {!isLoading && role === "ASSISTANT" && (
                  <span className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                    ASSISTANT
                  </span>
                )}
                {!isLoading && role === "OWNER" && isPro === true && (
                  <span className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
                    Pro
                  </span>
                )}
                {!isLoading && role === "OWNER" && !isPro && (
                  <span className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider bg-gray-200 text-gray-700">
                    Free
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Керування рахунками та оплатами
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-3">
              {!isAdminImpersonating && (
                <>
                  {role !== "ASSISTANT" && (
                    <>
                      <button
                        onClick={() => setShowAssistantModal(true)}
                        className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 cursor-pointer"
                      >
                        {assistants.length > 0 ? "Асистент" : "+ Асистент"}
                      </button>
                      <button
                        onClick={() => router.push("/create")}
                        className="inline-flex items-center justify-center rounded-md bg-zinc-800  px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 border-none outline-none cursor-pointer"
                      >
                        + Створити
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 border-none outline-none cursor-pointer"
                  >
                    Вийти
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="mb-4 flex justify-end">
            {(archivedInvoices.length > 0 || showArchived) && (
              <div className="inline-flex rounded-xl bg-gray-200/80 p-1">
                <button
                  onClick={() => setShowArchived(false)}
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition-all cursor-pointer border-none outline-none ${
                    !showArchived
                      ? "bg-white text-gray-900 shadow-sm"
                      : "bg-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Активні
                </button>

                <button
                  onClick={() => setShowArchived(true)}
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition-all cursor-pointer border-none outline-none ${
                    showArchived
                      ? "bg-white text-gray-900 shadow-sm"
                      : "bg-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Архів ({archivedInvoices.length})
                </button>
              </div>
            )}
          </div>
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="hidden w-full overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm sm:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Клієнт
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Сума
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Дата
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Статус
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {currentInvoices.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-sm text-gray-500"
                        >
                          {showArchived
                            ? "У вас ще немає видалених інвойсів.."
                            : role === "ASSISTANT"
                              ? "У вас ще немає інвойсів."
                              : "У вас ще немає інвойсів. Створіть перший!"}
                        </td>
                      </tr>
                    ) : (
                      currentInvoices.map((inv) => (
                        <tr
                          key={inv.id}
                          className="group transition-colors hover:bg-gray-50"
                        >
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                            {inv.client_name}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                            ${(inv.amount / 100).toFixed(2)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                            {new Date(inv.created_at).toLocaleDateString(
                              "uk-UA",
                            )}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm">
                            <span
                              onClick={() => handleToggleStatus(inv)}
                              title="Змінити статус"
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                                inv.status,
                              )} ${!showArchived && "cursor-pointer"}`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                            {showArchived ? (
                              <span className="text-xs font-semibold text-gray-400">
                                В архіві
                              </span>
                            ) : (
                              <>
                                {isAdminImpersonating && (
                                  <span className="text-xs font-semibold text-gray-400">
                                    Тільки перегляд
                                  </span>
                                )}
                                {!isAdminImpersonating && role === "OWNER" && (
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => handleDownload(inv.id)}
                                      disabled={downloadingId === inv.id}
                                      title="Завантажити PDF"
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-all hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:cursor-wait disabled:opacity-50 cursor-pointer border-none outline-none"
                                    >
                                      <Image
                                        src="/download.png"
                                        alt="Завантажити"
                                        width={16}
                                        height={16}
                                        className="grayscale transition-all hover:grayscale-0"
                                      />
                                    </button>
                                    <button
                                      onClick={() =>
                                        router.push("/edit/" + inv.id)
                                      }
                                      title="Редагувати"
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-all hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer border-none outline-none"
                                    >
                                      <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => confirmDelete(inv.id)}
                                      title="Видалити"
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-all hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200 cursor-pointer border-none outline-none"
                                    >
                                      <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                )}
                                {!isAdminImpersonating &&
                                  role === "ASSISTANT" && (
                                    <button
                                      onClick={() => handleDownload(inv.id)}
                                      disabled={downloadingId === inv.id}
                                      title="Відкрити PDF"
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-all hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:cursor-wait disabled:opacity-50 cursor-pointer border-none outline-none"
                                    >
                                      <Image
                                        src="/download.png"
                                        alt="PDF"
                                        width={16}
                                        height={16}
                                        className="grayscale transition-all hover:grayscale-0"
                                      />
                                    </button>
                                  )}
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-4 sm:hidden">
                {currentInvoices.length === 0 ? (
                  <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
                    {showArchived
                      ? "У вас ще немає видалених інвойсів.."
                      : role === "ASSISTANT"
                        ? "У вас ще немає інвойсів."
                        : "У вас ще немає інвойсів. Створіть перший!"}
                  </div>
                ) : (
                  currentInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all active:scale-[0.98]"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="truncate text-lg font-bold text-gray-900">
                          {inv.client_name}
                        </span>
                        <span className="text-xs font-semibold tracking-wider text-gray-500">
                          {new Date(inv.created_at).toLocaleDateString("uk-UA")}
                        </span>
                        <span
                          onClick={() => handleToggleStatus(inv)}
                          title="Змінити статус"
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${getStatusColor(
                            inv.status,
                          )}`}
                        >
                          {inv.status}
                        </span>
                      </div>
                      <div className="mb-5 flex flex-col">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                          Сума до сплати
                        </span>
                        <span className="text-xl font-black text-gray-900">
                          ${(inv.amount / 100).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 border-t border-gray-100 pt-4">
                        {showArchived ? (
                          <div className="w-full rounded-xl bg-gray-50 py-3 text-center text-sm font-bold text-gray-400">
                            В архіві
                          </div>
                        ) : (
                          <>
                            {isAdminImpersonating && (
                              <div className="w-full rounded-xl bg-gray-50 py-3 text-center text-sm font-bold text-gray-400">
                                Тільки перегляд
                              </div>
                            )}
                            {!isAdminImpersonating && role === "OWNER" && (
                              <>
                                <button
                                  onClick={() => handleDownload(inv.id)}
                                  disabled={downloadingId === inv.id}
                                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200 border-none outline-none"
                                >
                                  PDF
                                </button>
                                <button
                                  onClick={() => router.push("/edit/" + inv.id)}
                                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-50 py-3 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-100 border-none outline-none"
                                >
                                  Змінити
                                </button>
                                <button
                                  onClick={() => confirmDelete(inv.id)}
                                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-50 py-3 text-sm font-bold text-red-700 transition-colors hover:bg-red-100 border-none outline-none"
                                >
                                  Видалити
                                </button>
                              </>
                            )}
                            {!isAdminImpersonating && role === "ASSISTANT" && (
                              <button
                                onClick={() => handleDownload(inv.id)}
                                disabled={downloadingId === inv.id}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200 border-none outline-none"
                              >
                                PDF
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
          {!isPro && role === "OWNER" && !isAdminImpersonating && (
            <div className="mt-8">
              {totalInvoicesCount >= 3 ? (
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 sm:p-6 shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-indigo-900">
                      Досягнуто ліміт Free-тарифу
                    </span>
                    <span className="mt-1 text-sm text-indigo-700">
                      Оновіть тариф до Pro, щоб створювати безліч інвойсів без
                      обмежень.
                    </span>
                  </div>
                  <button
                    onClick={() => router.push("/pro")}
                    className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer"
                  >
                    Upgrade to Pro
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 text-sm text-gray-600 shadow-sm">
                  <span className="font-medium text-gray-700">
                    Використано безкоштовних інвойсів:
                  </span>
                  <span className="w-8 text-right font-bold text-gray-900">
                    {totalInvoicesCount} / 3
                  </span>
                  {role === "OWNER" && (
                    <button
                      onClick={() => router.push("/pro")}
                      className="rounded-xl bg-zinc-700 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-zinc-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 border-none outline-none cursor-pointer"
                    >
                      Upgrade to Pro
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {invoiceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">
              Видалити інвойс?
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Цю дію неможливо скасувати. Рахунок буде назавжди видалено з бази.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setInvoiceToDelete(null)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 border-none outline-none cursor-pointer"
              >
                Скасувати
              </button>
              <button
                onClick={executeDelete}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 border-none outline-none cursor-pointer"
              >
                Видалити
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <LogoutModal
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
        />
      )}
      <AssistantModal
        isOpen={showAssistantModal}
        onClose={() => setShowAssistantModal(false)}
        assistants={assistants}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
