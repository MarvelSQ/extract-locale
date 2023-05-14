import React from "react";
import NiceModal, { useModal, Provider } from "@ebay/nice-modal-react";

const DialogMap = new Map<React.ComponentType<any>, React.ComponentType<any>>();

export function openDialog<P extends Record<string, any>>(
  Dialog: React.ComponentType<P>,
  props: Omit<P, "open" | "onClose">
) {
  if (!DialogMap.has(Dialog)) {
    DialogMap.set(
      Dialog,
      NiceModal.create(() => {
        const modal = useModal();

        return (
          <Dialog
            {...(props as any)}
            open={modal.visible}
            onClose={() => modal.remove()}
          />
        );
      })
    );
  }

  const wraped = DialogMap.get(Dialog) as React.FC<any>;

  NiceModal.show(wraped, props);
}

export function ModalProvider({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>;
}
