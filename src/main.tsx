import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import App from "./App";
import { ToastContainer } from "./components/ToastContainer";
import { queryClient } from "./app/providers/queryClient";
import "./index.css";
async function enableMocks() {
  const { worker } = await import("./app/mocks/browser");

  await worker.start({
    serviceWorker: {
      url: "/mockServiceWorker.js",
    },
    onUnhandledRequest: "bypass",
  });
}

enableMocks().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <ToastContainer />
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </React.StrictMode>
  );
});
