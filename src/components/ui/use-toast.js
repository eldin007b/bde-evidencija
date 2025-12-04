// Minimal Shadcn UI use-toast hook stub
export function useToast() {
  return {
    toast: ({ title, variant }) => {
      // TODO: Replace with real toast implementation
      alert(`${variant ? variant + ': ' : ''}${title}`);
    }
  };
}
