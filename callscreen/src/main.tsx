import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from "./App";
import "./styles.css";

const url = import.meta.env.VITE_CONVEX_URL as string | undefined;
const root = ReactDOM.createRoot(document.getElementById("root")!);
const app = url
  ? <ConvexProvider client={new ConvexReactClient(url)}><App /></ConvexProvider>
  : <App />;

root.render(<React.StrictMode>{app}</React.StrictMode>);
