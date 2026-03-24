import { Button } from "@/components/ui/button";
import { HardDrive, Loader2, Shield, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginScreen() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.78 0.15 195) 1px, transparent 1px), linear-gradient(90deg, oklch(0.78 0.15 195) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded bg-primary/10 border border-primary/30 flex items-center justify-center">
            <HardDrive className="h-5 w-5 text-primary" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
            My Files
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Secure personal
          <br />
          <span className="text-primary">file storage.</span>
        </h1>
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
          Your files, encrypted and stored on the decentralized internet. No
          servers, no middlemen.
        </p>

        {/* Feature list */}
        <div className="space-y-3 mb-8">
          {[
            { icon: Shield, text: "End-to-end encrypted storage" },
            { icon: Zap, text: "Large file support with streaming" },
            { icon: HardDrive, text: "Decentralized on Internet Computer" },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-3 text-sm text-muted-foreground"
            >
              <Icon className="h-4 w-4 text-primary flex-shrink-0" />
              <span>{text}</span>
            </div>
          ))}
        </div>

        <Button
          data-ocid="login.primary_button"
          onClick={() => login()}
          disabled={isLoggingIn}
          className="w-full h-11 font-display font-semibold tracking-wide"
        >
          {isLoggingIn ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            "Sign in to continue"
          )}
        </Button>

        <p className="mt-4 text-xs text-center text-muted-foreground">
          Uses Internet Identity — no password required
        </p>
      </motion.div>
    </div>
  );
}
