# HFC Engine Test Plan

| ID | Scenario | Input / setup | Expected result |
|---|---|---|---|
| HFC-01 | Valid data | Age 16, Education College | Rule does not fire; submission continues. |
| HFC-02 | Cross-field match | Age 14, Education College; `match=all` | `reask_and_flag` prompt is shown and a flag is recorded. |
| HFC-03 | One condition only | Age 14, Education School | Rule does not fire. |
| HFC-04 | Boundary | Ages 14, 15, 16 | Confirm `< 15` fires only at 14. |
| HFC-05 | Re-ask once | Trigger `reask_once`, keep same answer after confirmation | One prompt only; answer is accepted and flagged after confirmation. |
| HFC-06 | Corrected answer | Trigger check, then change value to valid | Prompt closes; no stale flag remains. |
| HFC-07 | Hidden dependency | Sleep hours is hidden because Sleep Well = Yes | Engine skips the rule; no null/zero coercion and no prompt. |
| HFC-08 | Missing value | Referenced question unanswered or deleted by skip logic | Rule evaluates as not applicable; app stays responsive. |
| HFC-09 | Invalid schema | Unknown question ID or unsupported operator | Schema validation reports a recoverable configuration error; the app does not crash. |
| HFC-10 | Multiple rules | Two rules match on one answer | Prompts are deterministic, one at a time; each action/flag is retained. |
| HFC-11 | Blocking rule | `block` action with invalid answer | Navigation/submission is blocked until a valid correction. |
| HFC-12 | Loop protection | Re-enter triggering answer after a re-ask confirmation | Prompt count is capped by rule/action state, not repeatedly shown on recomposition. |
| HFC-13 | Any combinator | One of two conditions matches with `match=any` | Rule fires once and displays the configured action/message. |
| HFC-14 | Type coercion | Compare numeric values supplied as text, decimals and leading zeroes | Evaluation follows a defined numeric comparison policy; no lexicographic comparison error. |
| HFC-15 | String operation | Test `contains`, `in`, `empty` and `not_empty` operators | Correct matching semantics; whitespace-only responses follow the agreed policy. |
| HFC-16 | Navigation return | Trigger a soft check, navigate back, then return | Prompt/action state remains correct and is not reset incorrectly. |
| HFC-17 | Offline persistence | Trigger and confirm a soft check before saving offline | Flag and confirmation state persist with the local response and sync later. |
| HFC-18 | Rule message | Long translated HFC message on a small screen | Message wraps, is understandable, and Confirm/Edit actions remain reachable. |
