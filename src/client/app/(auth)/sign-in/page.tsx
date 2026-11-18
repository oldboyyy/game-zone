"use client";
import { useForm } from "react-hook-form";
import Input from "@/app/components/atoms/Input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MainLayout from "@/app/components/templates/MainLayout";
import { Loader2 } from "lucide-react";
import { useSignInMutation } from "@/app/store/apis/AuthApi";
import GoogleIcon from "@/app/assets/icons/google.png";
import FacebookIcon from "@/app/assets/icons/facebook.png";
import TwitterIcon from "@/app/assets/icons/twitter.png";
import Image from "next/image";
import { AUTH_API_BASE_URL } from "@/app/lib/constants/config";
import {
  DEMO_ACCOUNT_EMAILS,
  isDemoMode,
} from "@/app/lib/demo";

interface InputForm {
  email: string;
  password: string;
}

const SignIn = () => {
  const [signIn, { error, isLoading }] = useSignInMutation();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<InputForm>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (formData: InputForm) => {
    try {
      await signIn(formData).unwrap();
      router.push("/");
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const signInAsDemo = async (email: string) => {
    try {
      await signIn({ email, password: "admin123" }).unwrap();
      router.push("/");
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const handleOAuthLogin = (provider: string) => {
    console.log("Using AUTH API URL:", AUTH_API_BASE_URL);
    window.location.href = `${AUTH_API_BASE_URL}/auth/${provider}`;
  };

  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <main className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 text-center mb-6">
            Вход
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-600 text-center text-sm p-3 rounded mb-4">
              Произошла непредвиденная ошибка
            </div>
          )}

          <form method="post" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              name="email"
              type="text"
              placeholder="Электронная почта"
              control={control}
              validation={{ required: "Введите электронную почту" }}
              error={errors.email?.message}
              className="py-2.5 text-sm"
            />

            <Input
              name="password"
              type="password"
              placeholder="Пароль"
              control={control}
              validation={{
                required: "Введите пароль",
                minLength: {
                  value: 6,
                  message: "Пароль должен содержать минимум 6 символов",
                },
              }}
              error={errors.password?.message}
              className="py-2.5 text-sm"
            />

            <Link
              href="/password-reset"
              className="block text-sm text-indigo-600 hover:underline mb-4"
            >
              Забыли пароль?
            </Link>

            <button
              type="submit"
              className={`w-full py-2.5 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors ${
                isLoading ? "cursor-not-allowed bg-gray-400" : ""
              }`}
            >
              {isLoading ? (
                <Loader2 className="animate-spin mx-auto" size={20} />
              ) : (
                "Вход"
              )}
            </button>
          </form>

          <div className="text-center text-sm text-gray-600 mt-4">
            Ещё нет аккаунта?{" "}
            <Link href="/sign-up" className="text-indigo-600 hover:underline">
              Зарегистрироваться
            </Link>
          </div>

          {isDemoMode() && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="text-sm font-semibold text-amber-900 mb-2">
                Быстрый вход в деморежиме
              </h3>
              <p className="text-xs text-amber-800 mb-3">
                В демо-режиме подходит любой пароль. Выберите аккаунт.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => signInAsDemo(DEMO_ACCOUNT_EMAILS.user)}
                  disabled={isLoading}
                  className="w-full py-2 text-sm rounded-md border border-amber-300 bg-white hover:bg-amber-100 text-amber-950 font-medium"
                >
                  Покупатель (customer@example.com)
                </button>
                <button
                  type="button"
                  onClick={() => signInAsDemo(DEMO_ACCOUNT_EMAILS.admin)}
                  disabled={isLoading}
                  className="w-full py-2 text-sm rounded-md border border-amber-300 bg-white hover:bg-amber-100 text-amber-950 font-medium"
                >
                  Батырхан (batyrkhan@example.com)
                </button>
                <button
                  type="button"
                  onClick={() => signInAsDemo(DEMO_ACCOUNT_EMAILS.superadmin)}
                  disabled={isLoading}
                  className="w-full py-2 text-sm rounded-md border border-amber-300 bg-white hover:bg-amber-100 text-amber-950 font-medium"
                >
                  Санжар (sanzhar@example.com)
                </button>
                <button type="button" onClick={() => signInAsDemo("eldar@example.com")} disabled={isLoading}>Елдар (eldar@example.com)</button>
              </div>
            </div>
          )}

          {process.env.NODE_ENV === "development" && !isDemoMode() && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">
                Тестовые аккаунты (локальная разработка)
              </h3>
              <div className="text-xs text-blue-700 space-y-1">
                <div>
                  <strong>Санжар:</strong> sanzhar@example.com /
                  admin123
                </div>
                <div>
                  <strong>Батырхан:</strong> batyrkhan@example.com / admin123
                </div>
                <div>
                  <strong>Покупатель:</strong> customer@example.com / user123
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Выполните <code className="font-mono">npm run seed</code> в папке{" "}
                <code className="font-mono">src/server</code> перед первым входом.
              </p>
            </div>
          )}

          {!isDemoMode() && (
            <>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">или</span>
            </div>
          </div>

          <div className="space-y-2">
            {[
              {
                provider: "google",
                icon: GoogleIcon,
                label: "Войти через Google",
              },
              {
                provider: "facebook",
                icon: FacebookIcon,
                label: "Войти через Facebook",
              },
              {
                provider: "twitter",
                icon: TwitterIcon,
                label: "Войти через X",
              },
            ].map(({ provider, icon, label }) => (
              <button
                key={provider}
                onClick={() => handleOAuthLogin(provider)}
                className="w-full py-3 border-2 border-gray-100 bg-transparent text-black rounded-md font-medium hover:bg-gray-50
                 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Image width={20} height={20} src={icon} alt={provider} />
                {label}
              </button>
            ))}
          </div>
            </>
          )}
        </main>
      </div>
    </MainLayout>
  );
};

export default SignIn;
