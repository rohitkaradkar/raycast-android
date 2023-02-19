import {
  Action,
  ActionPanel,
  Icon,
  List,
  popToRoot,
  showToast,
  Toast,
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
                title="Save Screenshot"
                onAction={() => copyScreenshot(emulator)}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

async function copyScreenshot(emulatorId: string) {
  const command =`
    set -e
    name="Screenshot_$(date "+%d:%b:%y_%H:%M:%S")"
    file="/tmp/$name.png"
    ${adbPath()} -s ${emulatorId} exec-out screencap -p > $file
    echo $file
  `; 
  await runCommandAsync(command)
    .then((value) => {
      showToast(Toast.Style.Success, value);
    })
    .catch((err) => {
      showToast(Toast.Style.Failure, err);
    })
    .finally(() => {
      popToRoot;
    });
}
