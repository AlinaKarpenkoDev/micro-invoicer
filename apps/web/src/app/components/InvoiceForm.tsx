import { useRouter } from "next/navigation";
import {
  UseFormRegister,
  UseFormHandleSubmit,
  FieldErrors,
} from "react-hook-form";
import { InvoiceFormInput, InvoiceFormOutput } from "../invoiceSchema";

interface Props {
  register: UseFormRegister<InvoiceFormInput>;
  handleSubmit: UseFormHandleSubmit<InvoiceFormInput, InvoiceFormOutput>;
  errors: FieldErrors<InvoiceFormInput>;
  isSubmitting: boolean;
  title: string;
  onSubmit: (data: InvoiceFormOutput) => Promise<void>;
}

export default function InvoiceForm({
  handleSubmit,
  onSubmit,
  errors,
  register,
  isSubmitting,
  title,
}: Props) {
  const router = useRouter();
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-md space-y-6 rounded-2xl bg-white p-6 sm:p-10 shadow-xl ring-1 ring-gray-900/5"
    >
      <h2 className="mb-8 text-center text-3xl font-extrabold tracking-tight text-gray-900">
        {title}
      </h2>

      <div className="space-y-4">
        <div>
          <input
            {...register("clientName")}
            type="text"
            className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 sm:text-sm box-border"
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
            className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 sm:text-sm box-border"
            placeholder="Сума ($)"
          />
          {errors.amount && (
            <p className="mt-1 text-sm text-red-500">{errors.amount.message}</p>
          )}
        </div>

        <div>
          <input
            type="text"
            {...register("paymentDetails")}
            className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 sm:text-sm box-border"
            placeholder="Реквізити.."
          />
          {errors.paymentDetails && (
            <p className="mt-1 text-sm text-red-500">
              {errors.paymentDetails.message}
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
  );
}
