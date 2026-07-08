import { browser } from "wxt/browser";

import { buildEyeIcon, buildEyeSlashIcon, createToaster } from "./toast";

const successToaster = createToaster({ position: "bottom-right" });
const errorToaster = createToaster({ position: "bottom-right" });
const visibilityToaster = createToaster({ position: "bottom-left" });

export const showConnected = () =>
  successToaster.show({
    message: "Connected to VTT Bridge v" + browser.runtime.getManifest().version + "!",
    type: "success",
    duration: 0,
    dismissible: true,
  });

export const showToast = (toast) => {
  successToaster.dismissAll();
  successToaster.show({ message: toast, type: "success" });
};

let visibilityToast;
export const showVisibility = (visible) => {
  visibilityToaster.dismiss(visibilityToast);
  const type = visible ? "visible" : "hidden";
  visibilityToast = visibilityToaster.show({
    type,
    message: `Commands are ${type}!`,
    duration: 0,
    dismissible: true,
    icon: visible ? buildEyeIcon : buildEyeSlashIcon,
  });
};

export const showError = (error) => {
  errorToaster.show({
    message: error,
    type: "error",
    duration: 0,
    dismissible: true,
    onDismiss: () => errorToaster.dismissAll(),
  });
};
