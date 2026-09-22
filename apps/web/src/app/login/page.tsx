"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

const loginSchema = z.object({
  email: z.string().email("Невірний формат email"),
  password: z.string().min(6, "Мінімум 6 символів"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const router = useRouter();

  async function onSubmit(data: LoginFormValues) {
    try {
      const response = await fetch("http://localhost:4000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        toast.error("Помилка авторизації. Перевірте введені дані.");
        return;
      } else {
        const responseData = await response.json();
        localStorage.setItem("token", responseData.access_token);
        toast.success("Вхід виконано!");
        router.push("/");
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
          Увійти
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
        </div>

        <button
          type="submit"
          className="flex w-full justify-center rounded-xl bg-zinc-900 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
        >
          Увійти
        </button>
        <p className="mt-4 text-center text-sm text-gray-600">
          Ще немає акаунту?{" "}
          <Link
            href="/register"
            className="font-bold text-zinc-900 hover:underline"
          >
            Зареєструватися
          </Link>
        </p>
      </form>
    </div>
  );
}
