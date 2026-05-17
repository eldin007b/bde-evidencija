import { toast } from 'react-hot-toast';

/**
 * Moderni Toast hook koji koristi react-hot-toast
 */
export function useToast() {
  return {
    toast: ({ title, description, variant }) => {
      const message = title + (description ? `: ${description}` : '');
      
      if (variant === 'destructive') {
        return toast.error(message);
      }
      return toast.success(message);
    }
  };
}
