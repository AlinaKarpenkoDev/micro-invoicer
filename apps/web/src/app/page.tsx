"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { InvoiceDTO } from "@micro-invoicer/shared";
import toast from "react-hot-toast";

export default function Home() {
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [isAdminImpersonating, setIsAdminImpersonating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getToken = localStorage.getItem("token");

    if (!getToken) {
      toast.error("Сесія застаріла, введіть логін повторно");
      router.push("/login");
      return;
    } else {
      const payload = JSON.parse(atob(getToken.split(".")[1]));
      setRole(payload.role);

      if (localStorage.getItem("admin_token")) {
        setIsAdminImpersonating(true);
      }

      async function fetchInvoices() {
        const response = await fetch("http://localhost:4000/invoices", {
          method: "GET",
          headers: { Authorization: `Bearer ${getToken}` },
        });
        if (response.ok) {
          const responseData = await response.json();
          setInvoices(responseData.data);
          setIsPro(responseData.isPro);
        } else {
          toast.error("Сесія застаріла, введіть логін повторно");
          localStorage.removeItem("token");
          router.push("/login");
        }
      }

      fetchInvoices();
    }
  }, [router]);

  async function handleDownload(invoiceId: string) {
    setDownloadingId(invoiceId);
    const getToken = localStorage.getItem("token");
    try {
      if (!getToken) {
        toast.error("Сесія застаріла, введіть логін повторно");
        router.push("/login");
        return;
      } else {
        const response = await fetch(
          `http://localhost:4000/invoices/${invoiceId}/pdf`,
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
          if (response.status === 401 || response.status === 403) {
            toast.error("Сесія застаріла, введіть логін повторно");
            localStorage.removeItem("token");
            router.push("/login");
          } else {
            toast.error("Помилка генерації PDF (введіть імя англійською..)");
          }
        }
      }
    } catch {
      toast.error("Помилка з'єднання з сервером");
    } finally {
      setDownloadingId(null);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
    toast.success("Ви вийшли з аккаунту!");
  };

  const handleLeaveImpersonation = () => {
    const adminToken = localStorage.getItem("admin_token");
    if (adminToken) {
      localStorage.setItem("token", adminToken);
      localStorage.removeItem("admin_token");
      toast.success("Ви повернулися в адмінку!");
      router.push("/admin");
    }
  };

  return (
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Мої Інвойси
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Керування рахунками та оплатами
            </p>
          </div>

          <div className="flex items-center gap-3">
            {role === "ADMIN" && (
              <button
                onClick={() => router.push("/admin")}
                className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-gay-500 px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm transition-all hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer border-none outline-none"
              >
                Адмінка
              </button>
            )}
            <button
              onClick={() => router.push("/create")}
              className="inline-flex items-center justify-center rounded-md bg-zinc-800  px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 border-none outline-none cursor-pointer"
            >
              + Створити
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 border-none outline-none cursor-pointer"
            >
              Вийти
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
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
                  Статус
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Дії
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {invoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    У вас ще немає інвойсів. Створіть перший!
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
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
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          inv.status === "PAID"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <button
                        onClick={() => handleDownload(inv.id)}
                        disabled={downloadingId === inv.id}
                        title="Завантажити PDF"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-900 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:cursor-wait disabled:opacity-50 border-none outline-none cursor-pointer"
                      >
                        {downloadingId === inv.id ? (
                          <svg
                            className="h-4 w-4 animate-spin text-gray-900"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        ) : (
                          <img
                            src="/download.png"
                            alt="Завантажити"
                            className="h-4 w-4 opacity-70 grayscale transition-all hover:grayscale-0"
                          />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isPro && role === "OWNER" && (
          <div className="mt-8">
            {invoices.length >= 3 ? (
              <div className="flex items-center justify-between rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 shadow-sm">
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
              <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600 shadow-sm">
                <span className="font-medium text-gray-700">
                  Використано безкоштовних інвойсів:
                </span>
                <span className="w-8 text-right font-bold text-gray-900">
                  {invoices.length} / 3
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
  );
}
