import { useIsMobile } from "./use-mobile";

export function useMobileOptimization() {
  const isMobile = useIsMobile();

  return {
    isMobile,
    touchSize: (isMobile ? "default" : "sm") as "default" | "sm",
    iconSize: isMobile ? "w-5 h-5" : "w-4 h-4",
    spacing: isMobile ? "gap-3" : "gap-2",
    inputHeight: isMobile ? "h-12" : "",
    buttonMinHeight: isMobile ? "min-h-[44px]" : "",
  };
}
