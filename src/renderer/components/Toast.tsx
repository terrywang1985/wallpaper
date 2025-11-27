export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
}

export function Toast({ message, type }: ToastProps) {
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
  };

  const styles = {
    success: 'toast-success',
    error: 'toast-error',
    info: 'toast-info',
  };

  return (
    <div className={`toast ${styles[type]}`}>
      <span>{icons[type]}</span>
      <span>{message}</span>
    </div>
  );
}
