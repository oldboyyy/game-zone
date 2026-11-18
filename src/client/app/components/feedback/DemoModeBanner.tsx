"use client";

import Link from "next/link";
import { Info } from "lucide-react";
import { isDemoMode } from "@/app/lib/demo";

export default function DemoModeBanner() {
  if (!isDemoMode()) return null;

  return (
    <div
      className="sticky top-0 z-30 w-full border-b border-amber-300/90 bg-amber-50/95 shadow-sm backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-start gap-3 px-4 py-3 sm:items-center sm:px-6 lg:px-8">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
          <Info className="h-3.5 w-3.5" aria-hidden />
          Интерактивная демонстрация
        </span>

        <div className="min-w-0 flex-1 text-sm leading-snug text-amber-950">
          <p>
            <span className="font-semibold">Демонстрационные данные</span>
            {" — "}
            Вход, корзина, заказы и админка работают в браузере без подключения к базе.
          </p>
          <p className="mt-1 text-amber-900/85">
            Чат недоступен. Изменения хранятся в браузере до очистки данных сайта.{" "}
            <Link
              href="https://github.com/Abdelrahman-Aboalkhair/Full-Stack-E-Commerce-Platform#local-setup"
              className="font-medium underline underline-offset-2 hover:text-amber-950"
              target="_blank"
              rel="noopener noreferrer"
            >
              Запустите сервер магазина
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
