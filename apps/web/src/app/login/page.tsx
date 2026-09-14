"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
  const [serverError, setServerError] = useState("");

  async function onSubmit(data: LoginFormValues) {
    try {
      const response = await fetch("http://localhost:4000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setServerError(errorData.message);
        return;
      } else {
        const responseData = await response.json();
        localStorage.setItem("token", responseData.access_token);
        router.push("/");
      }
    } catch {
      setServerError("Помилка з'єднання з сервером");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg bg-white p-8 shadow-md"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Увійти
        </h2>

        <input
          {...register("email")}
          className="w-full rounded-md border p-2 focus:border-black focus:outline-none"
          placeholder="email@gmail.com"
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}

        <input
          {...register("password")}
          className="w-full rounded-md border p-2 focus:border-black focus:outline-none"
          placeholder="password"
          type="password"
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}

        <button
          type="submit"
          className="mt-2 w-full rounded-md bg-black p-2 font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none"
        >
          Увійти
        </button>
        <p className="mt-4 text-center text-sm text-gray-600">
          Ще немає акаунту?{" "}
          <Link
            href="/register"
            className="font-medium text-black hover:underline"
          >
            Зареєструватися
          </Link>
        </p>
        <p className="text-red-500">{serverError}</p>
      </form>
    </div>
  );
}
