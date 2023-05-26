import React from "react";
import NiceModal, { useModal, Provider } from "@ebay/nice-modal-react";
import { Dialog } from "@radix-ui/react-dialog";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const DialogMap = new Map<React.ComponentType<any>, React.ComponentType<any>>();

export function openDialog<P extends Record<string, any>>(
  Dialog: React.ComponentType<P>,
  props: Omit<P, "open" | "onClose">
) {
  if (!DialogMap.has(Dialog)) {
    DialogMap.set(
      Dialog,
      NiceModal.create((props) => {
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

const Confirm = ({
  title,
  message,
  onConfirm,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
}) => {
  const modal = useModal();
  return (
    <Dialog
      open={modal.visible}
      onOpenChange={(open) => {
        !open && modal.remove();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={() => {
              onConfirm();
              modal.remove();
            }}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ins = NiceModal.create(Confirm);

export function openConfirm(
  title: string,
  message: string,
  onConfirm: () => void
) {
  NiceModal.show(ins, {
    title,
    message,
    onConfirm,
  });
}
