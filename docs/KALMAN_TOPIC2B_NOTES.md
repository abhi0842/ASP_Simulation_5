# Topic 2B: Unforced + Noiseless Kalman Filter

This note captures learning intent and visualization mapping outside the UI.

## What Students Should Learn

- Unforced dynamics means no control input: `u_k = 0`.
- Noiseless state-space means process noise is disabled: `Q = 0`.
- With `u = 0` and `Q = 0`, filter behavior is dominated by:
  - initial state `x̂_0`
  - initial covariance `P_0`
  - measurement noise level `R`

## Playback / Chart Meaning

- ECG measurement line is `z_k`.
- Predicted state is prior estimate `x̂^-_k = A x̂_{k-1}`.
- Filtered state is posterior estimate `x̂_k = x̂^-_k + K_k(z_k - x̂^-_k)`.
- Covariance `P_k` shows uncertainty contraction over time.
- Kalman gain `K_k` shows trust split between model and measurement.

## Legend Mapping Used

- `True ECG (ground truth)`
- `Measurement z_k` (or `Measurement z_k (noisy)` when noise is enabled)
- `Predicted state x̂⁻_k (prior)`
- `Filtered state x̂_k (posterior)`

## Equations Implemented

- Prediction:
  - `x̂^-_k = A x̂_{k-1}`
  - `P^-_k = A P_{k-1} A^T` (since `Q = 0` in noiseless mode)
- Gain:
  - Scalar measurement form `K_k = P^-_k / (P^-_k + R)`
- Update:
  - `x̂_k = x̂^-_k + K_k(z_k - x̂^-_k)`
  - `P_k = (I - K_k H)P^-_k` (main fast path)
  - Joseph stabilized equivalent used in matrix service path.
