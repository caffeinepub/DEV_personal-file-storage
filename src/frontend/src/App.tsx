import { Toaster } from "@/components/ui/sonner";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import type { UserProfile } from "./backend";
import Dashboard from "./components/Dashboard";
import LoginScreen from "./components/LoginScreen";
import ProfileSetup from "./components/ProfileSetup";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";

function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const isAuthenticated = !!identity;

  const profileQuery = useQuery({
    queryKey: ["currentUserProfile"],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!actor) throw new Error("Actor not available");
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Profile fetch timed out")), 10000),
      );
      return Promise.race([actor.getCallerUserProfile(), timeout]);
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
    retry: false,
  });

  // Show spinner only while identity initializes or actor + profile are loading.
  // If actor errors out, fall through to dashboard.
  const isLoading =
    isInitializing ||
    (isAuthenticated && actorFetching && !profileQuery.isFetched) ||
    (isAuthenticated &&
      !!actor &&
      profileQuery.isLoading &&
      !profileQuery.isError);

  const showProfileSetup =
    isAuthenticated &&
    !isLoading &&
    profileQuery.isFetched &&
    !profileQuery.isError &&
    profileQuery.data === null;

  if (!isAuthenticated && !isInitializing) {
    return <LoginScreen />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (showProfileSetup) {
    return <ProfileSetup />;
  }

  return <Dashboard userName={profileQuery.data?.name ?? "User"} />;
}

export default function App() {
  return (
    <>
      <AppContent />
      <Toaster />
    </>
  );
}
