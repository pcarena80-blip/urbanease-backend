import * as React from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { cn } from "./utils";
import { buttonVariants } from "./button";

const AlertDialogContext = React.createContext<any>(null);

function AlertDialog({ children, open, onOpenChange }: any) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const show = isControlled ? open : uncontrolledOpen;
  const setShow = isControlled ? onOpenChange : setUncontrolledOpen;

  return (
    <AlertDialogContext.Provider value={{ open: show, setOpen: setShow }}>
      <View>{children}</View>
    </AlertDialogContext.Provider>
  );
}

function AlertDialogTrigger({ children, asChild, ...props }: any) {
  const { setOpen } = React.useContext(AlertDialogContext);
  const Comp = asChild ? View : TouchableOpacity;
  return (
    <Comp onPress={() => setOpen(true)} {...props}>
      {children}
    </Comp>
  );
}

function AlertDialogContent({ className, children, ...props }: any) {
  const { open, setOpen } = React.useContext(AlertDialogContext);

  return (
    <Modal
      transparent
      visible={open}
      animationType="fade"
      onRequestClose={() => setOpen(false)}
    >
      <View style={styles.overlay}>
        <View className={cn("bg-background w-full max-w-lg gap-4 border p-6 shadow-lg sm:rounded-lg bg-white rounded-xl mx-4", className)} {...props}>
          {children}
        </View>
      </View>
    </Modal>
  );
}

function AlertDialogHeader({ className, ...props }: any) {
  return (
    <View
      className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function AlertDialogFooter({ className, ...props }: any) {
  return (
    <View
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
      {...props}
    />
  );
}

function AlertDialogTitle({ className, ...props }: any) {
  return (
    <Text
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  );
}

function AlertDialogDescription({ className, ...props }: any) {
  return (
    <Text
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function AlertDialogAction({ className, ...props }: any) {
  const { setOpen } = React.useContext(AlertDialogContext);
  return (
    <TouchableOpacity
      className={cn(buttonVariants(), className)}
      onPress={() => {
        props.onPress?.();
        setOpen(false);
      }}
      {...props}
    />
  );
}

function AlertDialogCancel({ className, ...props }: any) {
  const { setOpen } = React.useContext(AlertDialogContext);
  return (
    <TouchableOpacity
      className={cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className)}
      onPress={() => {
        props.onPress?.();
        setOpen(false)
      }}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
