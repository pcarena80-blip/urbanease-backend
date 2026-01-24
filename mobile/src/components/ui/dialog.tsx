import * as React from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { X } from "lucide-react-native";
import { cn } from "./utils";

const DialogContext = React.createContext<any>(null);

function DialogRoot({ children, open, onOpenChange }: any) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const show = isControlled ? open : uncontrolledOpen;
  const setShow = isControlled ? onOpenChange : setUncontrolledOpen;

  return (
    <DialogContext.Provider value={{ open: show, setOpen: setShow }}>
      {children}
    </DialogContext.Provider>
  );
}

// Fix: Define base component first, then assign static properties
const DialogBase = DialogRoot;

function DialogTrigger({ children, asChild, ...props }: any) {
  const { setOpen } = React.useContext(DialogContext);
  const Comp = asChild ? View : TouchableOpacity;
  return (
    <Comp onPress={() => setOpen(true)} {...props}>
      {children}
    </Comp>
  );
}

function DialogContent({ className, children, ...props }: any) {
  const { open, setOpen } = React.useContext(DialogContext);
  return (
    <Modal
      transparent
      visible={open}
      animationType="fade"
      onRequestClose={() => setOpen(false)}
    >
      <View style={styles.overlay}>
        <View className={cn("bg-background w-full max-w-lg gap-4 border p-6 shadow-lg sm:rounded-lg bg-white rounded-xl mx-4", className)} {...props}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setOpen(false)}
          >
            <X size={20} color="#000" />
          </TouchableOpacity>
          {children}
        </View>
      </View>
    </Modal>
  );
}

function DialogHeader({ className, ...props }: any) {
  return (
    <View
      className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: any) {
  return (
    <View
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: any) {
  return (
    <Text
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: any) {
  return (
    <Text
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function DialogClose({ className, ...props }: any) {
  const { setOpen } = React.useContext(DialogContext);
  return (
    <TouchableOpacity onPress={() => setOpen(false)} {...props} />
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
  }
});

// Construct the Dialog object with properties
const Dialog = Object.assign(DialogBase, {
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Content: DialogContent,
  Header: DialogHeader,
  Footer: DialogFooter,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
});


export {
  Dialog,
  DialogRoot,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
};
