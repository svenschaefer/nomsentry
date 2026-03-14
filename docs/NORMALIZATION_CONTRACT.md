# Normalization Contract

## Scope

This document describes the current supported normalization contract for the maintained default runtime.

It is intentionally narrower than "any shorthand a human might infer".
The goal is deterministic, explainable normalization, not aggressive guesswork.

## Supported compact-form behavior

The maintained runtime supports compact or compact-like variants when:

- the underlying letters are still preserved under supported transformations
- and a maintained source term actually exists for the normalized target

Current supported transformations include:

- Unicode normalization through `NFKC`
- case folding
- removal of invisible and zero-width characters
- separator folding such as `-`, `_`, `.`, `/`, and spaces
- the maintained leetspeak folding rules
- the maintained confusable and Latin-variant folding rules

In practice, this means the runtime is expected to match examples such as:

- `adm1n` -> `admin`
- `s_u_p_p_o_r_t` -> `support`
- `o.a.u.t.h` -> `oauth`
- `sh!t` -> `shit`
- `sh/i/t` -> `shit`
- mixed-script lookalikes such as `оauth` when they normalize through the supported confusable map

Normalization support by itself does not create coverage for an uncovered category.
For example, a compact brand variant still needs an actual maintained `protectedBrand` source term behind it.

## Explicit non-goals

The maintained runtime does not currently promise detection for aggressive shorthand or consonant-dropping abbreviations when the omitted letters are no longer recoverable through the supported transformations.

That includes forms such as:

- `fck`
- `pwdrst`
- `acctrcvry`
- `vrfd`
- `srvr`
- `admn`
- `arschlch`

Those examples may be added later, but only after an explicit product decision and only with accompanying TP/FP analysis.

## Why this boundary exists

The current source strategy is intentionally conservative:

- the default maintained source set should stay explainable
- false-positive pressure is high for aggressive shorthand expansion
- some misses are source-coverage issues, while others are normalization-policy choices

Because of that, the maintained runtime currently supports compact forms that preserve the original term under deterministic folding, but it does not infer missing letters.
