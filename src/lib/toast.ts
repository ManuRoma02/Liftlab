export type ToastTone = "success" | "error" | "info";

export const TOAST_EVENT = "liftlab:toast";

export type ToastDetail = {
  message: string;
  tone: ToastTone;
};

export function showToast(message: string, tone: ToastTone = "info") {
  window.dispatchEvent(
    new CustomEvent<ToastDetail>(TOAST_EVENT, {
      detail: { message, tone },
    }),
  );
}
