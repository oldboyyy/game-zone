"use client";
import StoreProvider from "./StoreProvider";
import { ApolloProvider } from "@apollo/client";
import client from "./lib/apolloClient";
import Toast from "./components/feedback/Toast";
import AuthProvider from "./components/HOC/AuthProvider";
import TopLoadingBar from "./components/feedback/TopLoadingBar";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ApolloProvider client={client}>
      <TopLoadingBar />
      <StoreProvider>
        <AuthProvider>{children}</AuthProvider>
        {process.env.NODE_ENV !== "test" && <Toast />}
      </StoreProvider>
    </ApolloProvider>
  );
}
