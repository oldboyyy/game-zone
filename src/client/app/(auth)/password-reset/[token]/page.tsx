"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Input from "@/app/components/atoms/Input";
import Button from "@/app/components/atoms/Button";
import { useResetPasswordMutation } from "@/app/store/apis/AuthApi";
import { useParams } from "next/navigation";
import Link from "next/link";

const PasswordResetWithToken = () => {
  const { handleSubmit, control } = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const { token } = useParams();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const onSubmit = async (formData: {
    password: string;
    confirmPassword: string;
  }) => {
    if (formData.password !== formData.confirmPassword) {
      setMessage("Пароли не совпадают");
      setIsError(true);
      return;
    }

    try {
      await resetPassword({
        token: token as string,
        password: formData.password,
      }).unwrap();
      setMessage("Пароль изменён. Теперь вы можете войти.");
      setIsError(false);
    } catch {
      // setMessage(err?.data?.message || "Something went wrong");
      setIsError(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <form method="post"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col items-center justify-center bg-white p-6 rounded shadow-md w-[500px] gap-4"
      >
        <h1 className="text-2xl font-bold mb-4">Восстановление пароля</h1>

        {message && (
          <div
            className={`w-full text-center py-[22px] mb-4 rounded ${
              isError
                ? "bg-red-100 text-red-700 border-2 border-red-400"
                : "bg-green-100 text-green-700"
            }`}
          >
            {message}
          </div>
        )}

        <Input
          type="password"
          name="password"
          placeholder="Новый пароль"
          control={control}
          validation={{
            required: "Введите пароль",
            minLength: { value: 6, message: "Минимум 6 символов" },
          }}
          className="py-4"
        />

        <Input
          type="password"
          name="confirmPassword"
          placeholder="Подтвердите пароль"
          control={control}
          validation={{ required: "Повторите пароль" }}
          className="py-4"
        />

        <Button
          type="submit"
          className="bg-primary mt-4 text-white w-full py-[12px] rounded"
          disabled={isLoading}
        >
          {isLoading ? "Resetting..." : "Изменить пароль"}
        </Button>

        <Link className="mt-4 hover:underline" href={"/sign-in"}>
          Вернуться ко входу
        </Link>
      </form>
    </div>
  );
};

export default PasswordResetWithToken;
