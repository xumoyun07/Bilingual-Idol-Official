import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Enroll() {
  const [_, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/programs", { replace: true });
  }, [setLocation]);

  return null;
}
