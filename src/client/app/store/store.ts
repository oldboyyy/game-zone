import { configureStore } from "@reduxjs/toolkit";
import toastReducer from "./slices/ToastSlice";
import { apiSlice } from "./slices/ApiSlice";
import authReducer from "./slices/AuthSlice";

export const makeStore = () => configureStore({
  reducer: {
    auth: authReducer,
    toasts: toastReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== "production",
  preloadedState: {},
});

export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
export type AppStore = ReturnType<typeof makeStore>;
