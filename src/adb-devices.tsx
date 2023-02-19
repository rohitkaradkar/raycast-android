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
                title="Open Emulator"
                onAction={() => openEmultror(emulator)}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

function openEmultror(emulator: string): void {
  runCommand(
    `${emulatorPath()} -no-audio -no-snapshot-save -no-snapshot-load @${emulator}`,
    (data) => {
      popToRoot;
    },
    (error) => {
      showToast(Toast.Style.Failure, error);
    }
  );
}

function takeScreenshot(emulatorId: string): void {
  runCommand(
    `${adbPath()} -s ${emulatorId} exec-out screencap -p > /tmp/raycast-screenshot-${emulatorId}.png`,
    (data) => {
      popToRoot;
    },
    (error) => {
      showToast(Toast.Style.Failure, error);
    }
  );
}
