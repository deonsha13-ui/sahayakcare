import { SahayakVoiceClient } from "./voiceClient";
import { makeSteps } from "@/mock/demo";

export const voiceService = {
  steps: makeSteps,
  createClient(options) {
    return new SahayakVoiceClient(options);
  },
};
