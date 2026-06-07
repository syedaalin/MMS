import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";

export const STUDENT_COUNT_QUERY_KEY = ["students", "count"] as const;

async function fetchStudentCount(): Promise<number> {
  const token = localStorage.getItem("mms_token");
  const res = await fetch("/api/students/count", {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`student_count_${res.status}`);
  }
  const body = (await res.json()) as { count: number };
  return body.count;
}

/** Server-first pilot: student count via dedicated API route. */
export function useStudentCount() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: STUDENT_COUNT_QUERY_KEY,
    queryFn: fetchStudentCount,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export default useStudentCount;
