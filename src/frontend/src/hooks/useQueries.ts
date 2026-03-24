import { useQuery } from "@tanstack/react-query";
import type { FileRecord } from "../backend";
import { useActor } from "./useActor";

export function useGetMyFiles() {
  const { actor, isFetching } = useActor();
  return useQuery<FileRecord[]>({
    queryKey: ["myFiles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyFiles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetStorageInfo() {
  const { actor, isFetching } = useActor();
  return useQuery<{ used: bigint; remaining: bigint }>({
    queryKey: ["storageInfo"],
    queryFn: async () => {
      if (!actor) return { used: 0n, remaining: 0n };
      const [used, remaining] = await Promise.all([
        actor.getTotalStorageUsed(),
        actor.getRemainingStorageCapacity(),
      ]);
      return { used, remaining };
    },
    enabled: !!actor && !isFetching,
  });
}
