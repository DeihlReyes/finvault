import { dismissTip } from "@/lib/db/queries/user";
import { TIPS } from "@/lib/onboarding/tips";

export { dismissTip };

export async function dismissWelcomeModal(): Promise<void> {
  return dismissTip(TIPS.WELCOME_MODAL);
}
