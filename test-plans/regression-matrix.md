# Dynamic Form Regression Matrix

| Area | Automated contract | Exploratory focus |
|---|---|---|
| Schema parsing | Valid JSON, required fields, known input types, references resolve | Backward compatibility with old form versions and malformed authoring flows |
| Visibility | Every supported operator and hide/show transition | Long dependency chains, cycles and users changing prior answers |
| Validation | Required, text and min/max boundary data | Locale, keyboard behaviour and human-readable errors |
| Rosters | Fixed/dynamic count, add/remove row, answer retention | Large counts, memory and scroll performance |
| HFC | Operators, `all`/`any`, action semantics, prompt cap | Conflicting rules, complex multi-field scenarios |
| Offline state | Queue creation, idempotency key, retry policy | App kill/restart, storage pressure, 2G transitions |
| Accessibility | Labels, focus order, contrast/touch-target checks | Sunlight, low-end devices, low-literacy comprehension |

## Sample Detailed Test Cases

| ID | Area | Test case | Preconditions / test data | Expected result |
|---|---|---|---|---|
| DF-01 | Form rendering | Load a survey containing Text, Number and Dropdown questions | Valid schema with one of each type | Each question label, hint and correct input control render in schema order. |
| DF-02 | Required validation | Submit with a required Text answer empty | Required Text question visible | Inline error is clear, focus moves to the error, and the survey is not submitted. |
| DF-03 | Range validation | Enter -1, 0, 24 and 25 for a Number range 0-24 | Number question with min 0 and max 24 | -1 and 25 are rejected; 0 and 24 are accepted. |
| DF-04 | Skip logic | Select Yes, No, then Yes for a controlling Dropdown | Dependent question has visibility logic | Dependent question visibility updates immediately on every change without duplicate controls. |
| DF-05 | Hidden-answer handling | Enter a follow-up answer, then change controller so it hides | Visible dependent Text question has an answer | Product follows agreed contract: clear answer or retain it explicitly; hidden answer is never submitted unexpectedly. |
| DF-06 | Roster | Change roster count from 3 to 1 | Dynamic roster with entered answers | Only applicable rows render; retained/deleted row behaviour follows the agreed data-retention contract. |
| DF-07 | Large roster | Render and scroll a 100-row roster | Low-RAM target device | App remains responsive, no ANR, and rows do not duplicate or lose answers. |
| DF-08 | Schema resilience | Download an older supported schema version | Test schema from previous release | Form renders or an explicit supported-version message is shown; no crash. |
| SY-01 | Offline save | Complete a survey while all connectivity is disabled | New survey, Wi-Fi/data off | Local survey and queue record are saved; dashboard reports Pending Sync. |
| SY-02 | App restart | Save offline survey, force-stop, relaunch | Queued survey exists | Answers, attachment metadata and pending state remain intact. |
| SY-03 | Retry on 500 | Return HTTP 500 for sync | Network restored, local queue populated | Local data remains; worker enters retry/backoff state and does not mark survey synced. |
| SY-04 | Timeout | Drop request response after upload begins | Proxy/network shaping enabled | Retry occurs safely; no duplicate final record after connectivity returns. |
| SY-05 | Concurrent devices | Two devices submit local ID `School_1` | Unique device IDs | Both records persist as separate server records; neither payload is overwritten. |
| SY-06 | Duplicate delivery | Send the same sync request twice | Same device ID and idempotency/local key | Exactly one server record exists and retry receives an idempotent response. |
| SY-07 | Attachment failure | Photo upload fails but survey payload succeeds | Queued survey with photo | Sync state makes attachment failure visible and retries safely according to the API contract. |
| UX-01 | Touch targets | Measure primary actions and options | Smallest supported screen | Interactive controls meet the agreed minimum touch target and do not overlap. |
| UX-02 | Font scaling | Set device font/display size to maximum supported setting | Training and form screens | Text does not clip; essential actions remain reachable and identifiable. |
| UX-03 | Contrast | Inspect text, icons, errors and disabled states | Light theme and bright-light simulation | Important information is not conveyed by colour alone and contrast meets the accessibility baseline. |
| UX-04 | TalkBack | Navigate onboarding, training, and one survey with TalkBack | Screen reader enabled | Controls have meaningful labels, sensible focus order, and status/error announcements. |
| UX-05 | Interruption | Receive a call or background app during video / survey entry | In-progress training or form | Playback/form state restores safely and the user can continue without data loss. |
