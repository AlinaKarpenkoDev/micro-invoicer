"use client";

import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  invoiceSchema,
  InvoiceFormInput,
  InvoiceFormOutput,
} from "../../invoiceSchema";
import InvoiceForm from "../../components/InvoiceForm";

export default function ChangeInvoice() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InvoiceFormInput, undefined, InvoiceFormOutput>({
    resolver: zodResolver(invoiceSchema),
  });

  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const getToken = localStorage.getItem("token");

    if (!getToken) {
      router.replace("/login");
      return;
    }

    const payload = JSON.parse(atob(getToken.split(".")[1]));
    if (payload.role === "ADMIN") {
      router.replace("/admin");
      return;
    } else if (payload.role !== "OWNER" || payload.is_impersonating) {
      toast.error("Доступ заборонено");
      router.replace("/");
      return;
    }

    async function fetchInvoice() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/invoices/${params?.id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken}`,
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          reset({
            clientName: data.client_name,
            amount: data.amount / 100,
            paymentDetails: data.payment_details,
          });
        } else {
          if (response.status === 401) {
            localStorage.removeItem("token");
            router.replace("/login");
            return;
          }
          const errorData = await response.json().catch(() => ({}));
          toast.error(
            errorData?.message || "Не вдалося завантажити дані інвойсу.",
          );
          router.replace("/");
        }
      } catch {
        toast.error("Помилка з'єднання з сервером.");
      }
    }

    if (params?.id) {
      fetchInvoice();
    }
  }, [params?.id, reset, router]);

  async function onSubmit(data: InvoiceFormOutput) {
    setIsSubmitting(true);
    try {
      const getToken = localStorage.getItem("token");

      if (!getToken) {
        toast.error("Сесія застаріла, введіть логін повторно");
        router.replace("/login");
        return;
      } else {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/invoices/${params.id}`,
          {
            method: "PATCH",
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
          toast.error("Не вдалося оновити інвойс..");
          return;
        } else {
          toast.success("Дані успішно оновлені!");
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
        title="Редагувати інвойс"
      />
    </div>
  );
}
