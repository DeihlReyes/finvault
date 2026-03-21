"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const WelcomeModal = dynamic(
  () => import("./welcome-modal").then((m) => m.WelcomeModal),
  { ssr: false }
);

type Props = {
  displayName: string;
  showWelcome: boolean;
};

export function WelcomeWrapper({ displayName, showWelcome }: Props) {
  const [visible, setVisible] = useState(showWelcome);

  if (!visible) return null;

  return (
    <WelcomeModal displayName={displayName} onDismiss={() => setVisible(false)} />
  );
}
