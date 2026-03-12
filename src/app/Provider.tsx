"use client";
import { Provider } from "react-redux";
import Store from "../Redux/ReduxStore";
import AuthGate from "@/components/Auth/AuthGate";

const LayoutProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={Store}>
      <AuthGate>
        <div>{children}</div>
      </AuthGate>
    </Provider>
  );
};

export default LayoutProvider;
