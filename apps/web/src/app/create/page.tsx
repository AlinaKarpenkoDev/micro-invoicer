"use client";

import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const invoiceSchema = z.object({
  clientName: z.string().min(2, "Введіть ваше імя"),
  amount: z.coerce.number().positive("Сума має бути більшою за нуль"),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export default function CreateInvoice() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InvoiceFormValues>({ resolver: zodResolver(invoiceSchema) });

  const router = useRouter();

  async function onSubmit(data: InvoiceFormValues) {
    try {
      const getToken = localStorage.getItem("token");

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
            amount: data.amount,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          toast.error(errorData.message);
          return;
        } else {
          toast.success("Інвойс створено!");
          router.push("/");
        }
      }
    } catch {
      toast.error("Помилка з'єднання з сервером");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg bg-white p-8 shadow-md"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Create Invoice
        </h2>

        <input
          {...register("clientName")}
          className="w-full rounded-md border p-2 focus:border-black focus:outline-none"
          placeholder="Введіть імя англійською.."
        />
        {errors.clientName && (
          <p className="text-sm text-red-500">{errors.clientName.message}</p>
        )}

        <input
          type="number"
          {...register("amount")}
          className="w-full rounded-md border p-2 focus:border-black focus:outline-none"
          placeholder="amount.."
        />
        {errors.amount && (
          <p className="text-sm text-red-500">{errors.amount.message}</p>
        )}

        <button
          type="submit"
          className="mt-2 w-full rounded-md bg-black p-2 font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none"
        >
          Зберегти
        </button>
      </form>
    </div>
  );
}
