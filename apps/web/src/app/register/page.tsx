"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

const registerSchema = z
  .object({
    email: z.string().email("Невірний формат email"),
    password: z.string().min(6, "Мінімум 6 символів"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Паролі не співпадають",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const router = useRouter();

  async function onSubmit(data: RegisterFormValues) {
    try {
      const response = await fetch("http://localhost:4000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message);
        return;
      } else {
        toast.success("Реєстрація успішно пройдена, підтвердіть дані!");
        router.push("/login");
      }
    } catch {
      toast.error("Помилка з'єднання з сервером");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 font-sans">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md space-y-6 rounded-2xl bg-white p-10 shadow-xl ring-1 ring-gray-900/5"
      >
        <h2 className="mb-8 text-center text-3xl font-extrabold tracking-tight text-gray-900">
          Реєстрація
        </h2>

        <div className="space-y-4">
          <div>
            <input
              {...register("email")}
              className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 sm:text-sm"
              placeholder="email@gmail.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <input
              {...register("password")}
              className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 sm:text-sm"
              placeholder="password"
              type="password"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <input
              {...register("confirmPassword")}
              className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 sm:text-sm"
              placeholder="confirm password"
              type="password"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="flex w-full justify-center rounded-xl bg-zinc-900 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
        >
          Зареєструватися
        </button>
        <p className="mt-4 text-center text-sm text-gray-600">
          Вже є акаунт?{" "}
          <Link
            href="/login"
            className="font-bold text-zinc-900 hover:underline"
          >
            Увійти
          </Link>
        </p>
      </form>
    </div>
  );
}
