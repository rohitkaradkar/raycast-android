import {
  Action,
  ActionPanel,
  Icon,
  List,
  popToRoot,
  showToast,
  Toast,
  Clipboard
} from "@raycast/api";
import { useEffect, useState } from "react";
import {
  adbPath,
  androidSDK,
  emulatorPath,
  isAndroidStudioInstalled,
  isValidDirectory,
  runCommand,
  runCommandAsync,
} from "./Utils";

export default function Command() {
  const [items, setItems] = useState<string[]>(() => []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function listDevices() {
      if (!isAndroidStudioInstalled()) {
        showToast(Toast.Style.Failure, "Android studio is not installed");
        setLoading(false);
        return;
      }

      if (!isValidDirectory(androidSDK())) {
        showToast(Toast.Style.Failure, "Invalid Android SDK directory!!");
        setLoading(false);
        return;
      }

      const command = `${adbPath()} devices`;
      console.log(command);
      runCommand(
        command,
        (data) => {
          if (data != null) {
            const avds = (data + "")
              .split("\n")
              .filter((p: string) => p != "List of devices attached")
              .map((p: string) => p.split("\t")[0])
              .filter((p: string) => p.trim());
            setItems(avds);
          }

          setLoading(false);
        },
        (err) => {
          showToast(Toast.Style.Failure, err);
          setLoading(false);
        }
      );
    }

    listDevices();
  }, []);

  return (
    <List isLoading={loading}>
      {items?.map((emulator: string, index) => (
        <List.Item
          icon={{ source: "android-emulator.png" }}
          key={index}
          title={emulator}
          accessories={[{ icon: Icon.Mobile }]}
          actions={
            <ActionPanel>
              <Action
                title="Copy Screenshot"
                onAction={() => saveScreenshot(emulator)}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

async function saveScreenshot(emulatorId: string) {
  const expandTilde = require("expand-tilde");
  const command =`
    set -e
    name="Screenshot_$(date "+%d%b%y_%H%M%S").png"
    file="${expandTilde("~")}/Desktop/$name"
    ${adbPath()} -s ${emulatorId} exec-out screencap -p > $file
    echo $file
  `;
  
  showToast(Toast.Style.Animated, "Taking a screenshot");
  await runCommandAsync(command)
    .then((filePath) => {
      copyScreenshot(filePath.trim())
      showToast(Toast.Style.Success, "Copied to clipboard");
    })
    .catch((err) => {
      showToast(Toast.Style.Failure, err);
    })
    .finally(() => {
      popToRoot;
    });
}

async function copyScreenshot(filePath:string){
  const content: Clipboard.Content = { "file": filePath }
  await Clipboard.copy(content)
}