import {
  LoaderCircle,
  Pause,
  Power,
  Radio,
} from "lucide-react";

import type { DriverWorkStatus } from "@/types";

interface DriverStatusButtonProps {
  status: DriverWorkStatus;
  isLoading?: boolean;
  onToggle: () => void;
}

export function DriverStatusButton({
  status,
  isLoading = false,
  onToggle,
}: DriverStatusButtonProps) {
  const isOnline = status === "ONLINE";
  const isBusy = status === "BUSY";

  function getLabel(): string {
    if (isLoading) {
      return "Atualizando...";
    }

    if (isBusy) {
      return "Em corrida";
    }

    if (isOnline) {
      return "Ficar offline";
    }

    return "Ficar online";
  }

  function getIcon() {
    if (isLoading) {
      return (
        <LoaderCircle
          size={20}
          className="animate-spin"
        />
      );
    }

    if (isBusy) {
      return <Radio size={20} />;
    }

    if (isOnline) {
      return <Pause size={20} />;
    }

    return <Power size={20} />;
  }

  const buttonClasses = [
    "flex h-14 w-full items-center justify-center gap-2 rounded-2xl font-black transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60",
    isBusy
      ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25"
      : isOnline
        ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
        : "bg-brand text-white shadow-lg shadow-brand/25",
  ].join(" ");

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isLoading || isBusy}
      className={buttonClasses}
      aria-label={getLabel()}
    >
      {getIcon()}
      {getLabel()}
    </button>
  );
}