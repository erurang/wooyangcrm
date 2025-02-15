import { Snackbar, Alert } from "@mui/material";

interface SnackbarProps {
  message: string | null;
  severity?: "success" | "error" | "warning" | "info";
  onClose: () => void;
}

export default function SnackbarComponent({
  message,
  severity = "info",
  onClose,
}: SnackbarProps) {
  return (
    <Snackbar
      open={!!message}
      autoHideDuration={3000}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
    >
      <Alert severity={severity}>{message}</Alert>
    </Snackbar>
  );
}
