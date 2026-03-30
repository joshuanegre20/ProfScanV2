// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";

interface Props {
  children: React.ReactNode;
  allowedRoles: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const token = localStorage.getItem("token");
  const role  = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" />;
  if (!allowedRoles.includes(role ?? "")) return <Navigate to="/login" />;

  return <>{children}</>;
}