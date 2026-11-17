import { useQuery } from "@tanstack/react-query";
import api from "../api/client";

export function useCollection(path, params = {}) {
  return useQuery({
    queryKey: [path, params],
    queryFn: async () => (await api.get(path, { params })).data,
  });
}
