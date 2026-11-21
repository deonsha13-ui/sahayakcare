# Sahayak frontend service contract

This app intentionally has no backend, authentication, AI integration, or speech recognition. Feature code is JavaScript/JSX; thin TanStack route wrappers preserve the platform's router and metadata. React Router is not installed because the platform requires TanStack Router.

## Replacement points

- `visitService.list()` returns initial synthetic records. `save(currentRecords, record)` returns an updated list only when the worker confirms read-back.
- `beneficiaryService.list()` returns synthetic beneficiary profiles.
- `followupService.list()` returns synthetic follow-ups. `update(rows, id, status, date?)` returns immutable updated rows.
- `voiceService.steps(scenario)` returns deterministic conversation events. `microphone()` requests local audio input. `speak()` uses optional browser speech synthesis, not a remote speech service.

Replace these mock methods with your backend requests and adapt DemoContext to asynchronous reads and writes. Keep backend authentication, credentials, and validation in your own backend, never in this browser service layer.

## Persistence and voice

DemoContext stores confirmed records, preferences, follow-ups, and unconfirmed drafts in `sahayak-demo-v1` localStorage after hydration. Drafts are separate from records. Recorded audio is discarded and never persisted or transmitted. The microphone advances predefined mock events; it does not recognize what someone says.

Language selection persists a preference and sets the browser voice locale; interface and predefined transcript text currently remain English. Browser voices and microphone availability depend on device permissions.
