import { useSignal, useVisibleTask$, QRL } from "@builder.io/qwik";

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MIN_LOADING_MS = 500;

export const useMinLoading = (isRunningGetter: QRL<() => boolean>, minDelayMs = MIN_LOADING_MS) => {
  const isLoading = useSignal(false);
  const startedAt = useSignal<number | null>(null);

  useVisibleTask$(async ({ track, cleanup }) => {
    const running = await track(isRunningGetter);
    let t: any;

    if (running) {
      startedAt.value = Date.now();
      isLoading.value = true;
    } else {
      if (!startedAt.value) {
        isLoading.value = false;
        return;
      }
      const elapsed = Date.now() - startedAt.value;
      const remaining = Math.max(0, minDelayMs - elapsed);

      t = setTimeout(() => {
        isLoading.value = false;
      }, remaining);
    }

    cleanup(() => t && clearTimeout(t));
  });

  return isLoading;
};
