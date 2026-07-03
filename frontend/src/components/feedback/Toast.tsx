export const Toast = ({
  message,
  onDismiss
}: {
  message: string;
  onDismiss: () => void;
}) => (
  <div className="toast" role="alert">
    <strong>Action failed</strong>
    <p>{message}</p>
    <button className="text-button" type="button" onClick={onDismiss}>
      Dismiss
    </button>
  </div>
);
