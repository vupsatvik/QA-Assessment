# QA Engineer Take Home Assessment

This submission is intentionally scoped as a practical 3-years-experience QA solution: two small, runnable automation examples plus test strategy for the unavailable Android APK and production API. It prioritises risk around data integrity, dynamic forms, offline retries, and usability on budget devices.

## Contents

- `tests/sync-api.spec.js` - API contract test for concurrent offline IDs and retry idempotency.
- `tests/dynamic-skip.spec.js` - browser test for a schema-driven conditional question.
- `fixtures/dynamic-form.html` - minimal deterministic UI fixture used by the web test.
- `test-plans/hfc-test-plan.md` - HFC positive, negative and edge-case coverage.
- `test-plans/regression-matrix.md` - automation versus exploratory-test split.

## Running the examples

```bash
npm install
npx playwright install chromium
npm test
```

The API test starts an in-memory local contract server because the assignment does not provide a reachable `/sync-survey` implementation. In a real environment, I would point the same tests at staging and remove the local server. The expected contract is: a device-local ID is unique only within a device, while a retry of the same device and local ID is idempotent. Two devices can both submit `School_1` without one record overwriting the other.

## Scenario A: Offline sync and collision strategy

### API coverage

The automated sample validates three high-risk behaviours: different devices using the same local ID create separate server records; a retry returns the original server record; malformed payloads create no record. I would add auth, payload-size, schema-version, batch, ordering, 409/429/5xx, timeout, retry-after, and concurrent-load tests in the staging pipeline.

### Android network testing

1. Create and save a survey offline; capture the local UUID, queue state, and a database copy before syncing.
2. Use Android Emulator network controls or `adb shell svc wifi disable` / `adb shell svc data disable` to switch connectivity. On a physical device, use Charles Proxy with the device proxy and trusted certificate.
3. Throttle to 2G/high latency, upload a large photo, then drop the connection at 99%. Confirm an atomic server response is required before marking the item synced.
4. Restore the network, verify exponential/backoff retry behaviour, one final server record, no data loss, and an understandable sync status.

Key assertions: the local record must retain its payload and idempotency key until a confirmed success; retries must not duplicate records; photos should use resumable or content-addressed upload where available; sync work should be constrained by network availability and persist across process death.

## Scenario B: Dynamic form regression

The included Playwright test uses the supplied hobby pattern: selecting Yes makes the dependent text field visible; selecting No hides it again. For the actual product I would keep a versioned library of small schemas which isolates each input type, each visibility operator, required/range validation, roster nesting and HFC actions. Contract tests would validate the schema before UI tests run. Mobile UI tests would use a representative smoke subset, not every Cartesian combination.

I would automate deterministic, high-frequency, data-risk flows: schema parsing, rendering, visibility transitions, required/range validation, HFC semantics, saved-answer preservation, queue creation/retry, and critical accessibility labels. I would retain manual exploratory testing for readability, sunlight behaviour, unfamiliar device keyboards, visual comprehension, camera/GPS variation, and unusual combinations of deep rosters/skip logic.

## Scenario C: APK technical inspection

### Verify Room data on an unrooted test device

1. Install a debuggable QA build and create an offline survey with unique known answers.
2. Prefer Android Studio App Inspection / Database Inspector while the app is debuggable. Otherwise use `adb shell run-as <package> cp databases/<db>.db /sdcard/Download/<db>.db`, then `adb pull` and inspect with `sqlite3` or DB Browser.
3. Query the survey, outbox, attachment and WorkManager tables; verify payload, timestamps, state, retry count, local UUID and attachment paths.
4. If `run-as` fails, do not attempt to bypass sandboxing on a release build. Request a debuggable QA build or an app-supported diagnostic export.

### Run and fail sync

1. Inspect work with `adb shell dumpsys jobscheduler | findstr <package>` and app logs with `adb logcat -v time | findstr <package>`.
2. Where the app exposes a test-only worker name, trigger it with `adb shell cmd jobscheduler run -f <package> <jobId>`; otherwise meet the network constraint and use the app's test hook. Job IDs and worker names must come from the build, not be guessed.
3. Use Charles/Proxyman Map Local or Rewrite to return HTTP 500. Confirm WorkManager records `RETRY`, applies backoff, preserves the local record and later syncs exactly once after a real success.

## Scenario D: Low-memory ANR after training videos

I would reproduce on a low-RAM physical device and a low-RAM emulator, with the same video files, storage level, app version and screen sequence. I would loop 4-5 modules while capturing `adb logcat`, `adb shell dumpsys meminfo <package>`, `adb shell dumpsys activity processes`, and a Perfetto / Android Studio CPU-memory trace. I would check decoder, bitmap, ExoPlayer, cursor and Activity leaks after every module; capture ANR traces/tombstones where accessible; and use `adb shell am send-trim-memory <package> RUNNING_CRITICAL` on debug builds to exercise memory-pressure handling.

For storage, I would use an emulator with a deliberately small data partition or fill a disposable test volume with known test data, never a user device. A root cause is proven by a repeatable trace: retained allocations or blocked main-thread work grow with each video; disposing the offending resource removes that pattern and the ANR. I would give developers the reproducible build/device/video sequence, timestamps, trace, memory deltas, expected/actual result and a minimal suspected owner.

## Scenario E: HFC engine

See [the HFC test plan](test-plans/hfc-test-plan.md). Important implementation expectations are explicit rule state per question/edit session, null-safe evaluation for hidden dependencies, deterministic handling of multiple matching rules, and a prompt cap for `reask_once`. A `block` rule prevents navigation until corrected; a soft rule must never create an infinite modal loop.

## First 30 days as the first QA engineer

### Days 1-10

Map releases, environments, analytics/crash data, supported device matrix and highest-risk flows with engineering/product. Add a lightweight definition of ready (acceptance criteria, test data, schema changes called out) and definition of done (unit tests, QA build, release notes, test evidence). Establish a staging backend with safe data and a release candidate channel before Play Store production.

### Days 11-20

Create smoke coverage for onboarding, training unlock, schema render, offline save, sync/retry and crash-free launch. Start bug triage with severity based on field/data impact. Add a device matrix that includes at least one 4GB RAM Android device and poor-network cases.

### Days 21-30

Put API/schema contract tests and fast UI smoke tests in CI; publish a short release checklist and quality dashboard (open blockers, crash/ANR rate, smoke result, sync failures). QA is a feedback loop in the sprint, not a gate at the end: developers keep unit testing, QA pairs early on risky stories, and only data-loss/security/release-blocking failures stop a release.

## Responsible AI use in QA

I use AI to accelerate, not replace, QA judgment: draft boundary cases from a schema, turn a confirmed bug into a concise reproduction, generate test-data variations, and review coverage gaps. For dynamic forms I would give a tool a sanitised schema and ask it to propose visibility, validation and HFC test cases, then manually verify every assertion against the product contract. I would not upload customer data, secrets, unreleased APKs or credentials; generated tests are code-reviewed and executed before use.

## Tooling decisions

Playwright was chosen for fast, readable browser/API examples, network control and CI support. For Android I would use Android Studio/App Inspection, ADB, emulator controls, Charles/Proxyman, Perfetto and Firebase Crashlytics (if adopted). I automate stable, repeated assertions with business/data risk; I do not automate subjective visual comprehension or volatile one-off flows until the feature and expected outcome are stable.

## Scenario F: Training Video Hub UX evaluation

Beyond playback, I would test on the smallest supported low-RAM screen, in portrait, at large font and display scaling, in bright-light conditions, with slow/offline network, interrupted playback, rotation/process recreation, screen reader and touch exploration.

Issues I would raise:

1. Three text-heavy paragraphs impose a reading burden; use short spoken/visual steps in the user's language.
2. A bottom-only Next button may be missed or require long scrolling; use a persistent, clearly disabled/enabled primary action where appropriate.
3. A standard button may miss a safe touch target (roughly 48dp), especially with shaky hands or a small screen.
4. Low contrast, small captions, icon-only controls, or colour-only pass/fail states fail in sunlight and for colour-vision differences.
5. Standard video playback can consume data/RAM and leave unclear completion state after interruption; show download/offline state, progress and resume behaviour.
6. Text/video controls may clip with large font, translations or OEM accessibility settings.

I would report these as observable field risks, with device/screen-size/font/network evidence, screenshots/video, a severity tied to task completion or data quality, and an actionable recommendation. I would invite design/development to review the behaviour against a short accessibility checklist rather than labelling subjective feedback as a defect without evidence.
