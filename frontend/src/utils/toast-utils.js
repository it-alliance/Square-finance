import toast from 'react-hot-toast';

export const confirmToast = (message, onConfirm) => {
  toast((t) => (
    <div className="flex flex-col gap-3">
      <span className="font-semibold text-text-primary">{message}</span>
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => toast.dismiss(t.id)}
          className="rounded-lg px-3 py-1.5 text-xs font-bold text-text-secondary bg-background-custom hover:bg-border-custom/30 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            toast.dismiss(t.id);
            onConfirm();
          }}
          className="rounded-lg px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors"
        >
          Confirm
        </button>
      </div>
    </div>
  ), { 
    duration: Infinity, // Stay until clicked
    position: 'top-center'
  });
};
