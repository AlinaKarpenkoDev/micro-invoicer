"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const invoiceSchema = z.object({
  clientName: z.string().min(2, "Введіть ваше імя"),
  amount: z.coerce.number().positive("Сума має бути більшою за нуль"),
});

type InvoiceFormInput = z.input<typeof invoiceSchema>;
type InvoiceFormOutput = z.output<typeof invoiceSchema>;

export default function CreateInvoice() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InvoiceFormInput, undefined, InvoiceFormOutput>({
    resolver: zodResolver(invoiceSchema),
  });

  const router = useRouter();

  async function onSubmit(data: InvoiceFormOutput) {
    setIsSubmitting(true);
    try {
      const getToken = localStorage.getItem("token") as string;

      if (!getToken) {
        toast.error("Сесія застаріла, введіть логін повторно");
        router.push("/login");
        return;
      } else {
        const response = await fetch("http://localhost:4000/invoices", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken}`,
          },
          body: JSON.stringify({
            client_name: data.clientName,
            amount: Math.round(data.amount * 100),
          }),
        });

        if (!response.ok) {
          if (response.status === 403) {
            router.push("/pro");
          }

          toast.error("Не вдалось створити інвойс, спробуйте ще раз.");
          return;
        } else {
          toast.success("Інвойс створено!");
          router.push("/");
        }
      }
    } catch {
      toast.error("Помилка з'єднання з сервером");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 font-sans">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md space-y-6 rounded-2xl bg-white p-6 sm:p-10 shadow-xl ring-1 ring-gray-900/5"
      >
        <h2 className="mb-8 text-center text-3xl font-extrabold tracking-tight text-gray-900">
          Створити інвойс
        </h2>

        <div className="space-y-4">
          <div>
            <input
              {...register("clientName")}
              className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 sm:text-sm"
              placeholder="Ім'я клієнта (англійською)"
            />
            {errors.clientName && (
              <p className="mt-1 text-sm text-red-500">
                {errors.clientName.message}
              </p>
            )}
          </div>

          <div>
            <input
              type="number"
              {...register("amount")}
              className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 sm:text-sm"
              placeholder="Сума ($)"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-500">
                {errors.amount.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex w-full justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2"
          >
            Скасувати
          </button>
          <button
            disabled={isSubmitting}
            type="submit"
            className="flex w-full justify-center rounded-xl bg-zinc-900 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
          >
            {isSubmitting ? "Збереження..." : "Зберегти"}
          </button>
        </div>
      </form>
    </div>
  );
}
