"use client";

import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function ProPage() {
  const router = useRouter();

  const payButton = async () => {
    const getToken = localStorage.getItem("token");

    if (!getToken) {
      toast.error("Сесія застаріла, введіть логін повторно");
      router.push("/login");
      return;
    } else {
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/invoices/upgrade",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken}` },
        },
      );

      if (response.ok) {
        toast.success("Тариф успішно оновлено!");
        router.push("/");
      } else {
        toast.error("Не вдалося виконати дію. Спробуйте пізніше.");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-8 font-sans">
      <div className="mx-auto w-full max-w-5xl">
        <button
        type="button"
        onClick={() => router.push("/")}
        className="absolute left-8 top-8 flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm ring-1 ring-gray-900/5 transition-all hover:-translate-x-1 hover:bg-gray-50 hover:shadow focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 border-none"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
          />
        </svg>
        Повернутися
      </button>
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Оберіть свій тариф
          </h1>
          <p className="mt-4 text-gray-600">
            Почніть безкоштовно або розблокуйте всі можливості для вашого
            бізнесу.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Free</h2>
            <div className="mt-4 flex items-baseline text-5xl font-extrabold text-gray-900">
              $0
              <span className="ml-1 text-xl font-medium text-gray-500">
                /місяць
              </span>
            </div>
            <ul className="mb-8 mt-8 flex-1 space-y-4 text-gray-600">
              <li className="flex items-center gap-3">
                <svg
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                3 інвойси на місяць
              </li>
              <li className="flex items-center gap-3">
                <svg
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Стандартна підтримка
              </li>
            </ul>
            <button
              disabled
              className="w-full rounded-xl bg-gray-100 px-4 py-3 font-semibold text-gray-500 border-none outline-none"
            >
              Поточний план
            </button>
          </div>

          <div className="relative flex flex-col rounded-2xl border-2 border-zinc-500 bg-white p-8 shadow-xl">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-black px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
              Популярний
            </div>
            <h2 className="text-xl font-semibold text-black">Pro</h2>
            <div className="mt-4 flex items-baseline text-5xl font-extrabold text-gray-900">
              $10
              <span className="ml-1 text-xl font-medium text-gray-500">
                /місяць
              </span>
            </div>
            <ul className="mb-8 mt-8 flex-1 space-y-4 text-gray-800 font-medium">
              <li className="flex items-center gap-3">
                <svg
                  className="h-5 w-5 text-black"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Безліч інвойсів
              </li>
              <li className="flex items-center gap-3">
                <svg
                  className="h-5 w-5 text-black"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Пріоритетна підтримка
              </li>
              <li className="flex items-center gap-3">
                <svg
                  className="h-5 w-5 text-black"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Без водяних знаків
              </li>
            </ul>
            <button
              onClick={payButton}
              className="w-full rounded-xl bg-black px-4 py-3 font-bold text-white transition-opacity hover:opacity-80 border-none outline-none"
            >
              Оплатити
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
