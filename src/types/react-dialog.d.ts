declare module "@denkschuldt/react-dialog" {
  import type { ComponentType, ReactNode } from "react";

  export interface ReactDialogProps {
    title?: string;
    className?: string;
    draggable?: boolean;
    cancelableOutside?: boolean;
    closeOnEscPress?: boolean;
    cancelText?: string;
    confirmText?: string;
    confirmDisabled?: boolean;
    children?: ReactNode;
    onCancelClick?: () => void;
    onConfirmClick?: () => void;
    onCloseClick: () => void;
  }

  const Dialog: ComponentType<ReactDialogProps>;
  export default Dialog;
}
