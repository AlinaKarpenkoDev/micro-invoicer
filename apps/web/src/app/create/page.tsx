"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  invoiceSchema,
  InvoiceFormInput,
  InvoiceFormOutput,
} from "../invoiceSchema";
import InvoiceForm from "../components/InvoiceForm";

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

  useEffect(() => {
    try {
      const getToken = localStorage.getItem("token") as string;

      if (!getToken) {
        toast.error("Сесія застаріла, введіть логін повторно");
        router.replace("/login");
        return;
      }

      const payload = JSON.parse(atob(getToken.split(".")[1]));
      if (payload.role === "ADMIN") {
        router.replace("/admin");
      } else if (payload.role === "ASSISTANT" || payload.is_impersonating) {
        toast.error("Доступ заборонено");
        router.replace("/");
      }
    } catch {
      toast.error("Помилка з'єднання з сервером");
    }
  }, [router]);

  async function onSubmit(data: InvoiceFormOutput) {
    setIsSubmitting(true);
    try {
      const getToken = localStorage.getItem("token") as string;

      if (!getToken) {
        toast.error("Сесія застаріла, введіть логін повторно");
        router.replace("/login");
        return;
      } else {
        const response = await fetch(
          process.env.NEXT_PUBLIC_API_URL + "/invoices",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken}`,
            },
            body: JSON.stringify({
              client_name: data.clientName,
              amount: Math.round(data.amount * 100),
              payment_details: data.paymentDetails,
            }),
          },
        );

        if (!response.ok) {
          if (response.status === 403) {
            router.replace("/pro");
          }

          toast.error("Не вдалось створити інвойс, спробуйте ще раз.");
          return;
        } else {
          toast.success("Інвойс створено!");
          router.replace("/");
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
      <InvoiceForm
        handleSubmit={handleSubmit}
        onSubmit={onSubmit}
        errors={errors}
        register={register}
        isSubmitting={isSubmitting}
        title="Створити інвойс"
      />
    </div>
  );
}
