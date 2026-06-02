Kalman Filter with an Unforced Dynamic Model and Noiseless State-Space Model Using ECG Signals
Overview

This experiment introduces the Kalman Filter under two idealized but educationally important conditions:

Unforced Dynamic Model – the system evolves without any external control input.
Noiseless State-Space Model – both process noise and measurement noise are assumed negligible.

Under these assumptions, students can focus on understanding the fundamental behavior of the Kalman Filter, including state prediction, covariance propagation, stability, convergence, and multi-step forecasting without the complications introduced by noise.

The Electrocardiogram (ECG) signal is used as the application domain because cardiac electrical activity can be approximated as an autonomous oscillatory process, making it well suited for studying unforced dynamic systems.

1. State-Space Representation

The Kalman Filter operates on systems represented in state-space form.

General State Equation

x
k+1
	​

=Ax
k
	​

+Bu
k
	​

+w
k
	​


where:

Symbol	Description
x
k
	​

	State vector
A	State transition matrix
B	Control input matrix
u
k
	​

	External control input
w
k
	​

	Process noise
General Measurement Equation

y
k
	​

=Cx
k
	​

+v
k
	​


where:

Symbol	Description
y
k
	​

	Measurement vector
C	Observation matrix
v
k
	​

	Measurement noise
2. Unforced Dynamic Model

In an unforced system, no external control signal acts on the system.

Therefore,

u
k
	​

=0

and the state equation becomes:

x
k+1
	​

=Ax
k
	​

+w
k
	​


If process noise is also neglected:

x
k+1
	​

=Ax
k
	​


This is called an autonomous system because its future behavior depends entirely on:

the initial state x
0
	​

the state transition matrix A

There is no external input available to alter or correct the trajectory.

3. ECG as an Autonomous System

The heart possesses an intrinsic electrical conduction system consisting of:

Sinoatrial (SA) node
Atrioventricular (AV) node
Bundle of His
Purkinje fibers

These structures generate rhythmic electrical activity without requiring an external control signal.

For modeling purposes, the ECG can therefore be approximated as an autonomous dynamic system:

u
k
	​

=0

allowing heartbeat evolution to be represented by the state transition matrix A.

This approximation makes ECG signals an excellent educational example for studying unforced dynamic systems.

4. State Transition Matrix A

The matrix A governs how the system evolves over time.

For an autonomous system:

x
k+1
	​

=Ax
k
	​


Repeated application produces multi-step prediction:

x
k+n
	​

=A
n
x
k
	​


The quality of long-term prediction depends entirely on the properties of A.

Eigenvalue-Based Stability

The eigenvalues of A determine system stability.

Eigenvalue Condition	System Behavior
(	\lambda_i
(	\lambda_i
(	\lambda_i

For ECG modeling, eigenvalues near the unit circle are desirable because they preserve periodic cardiac oscillations.

5. Noiseless State-Space Model

In the idealized noiseless model:

Q≈0
R≈0

where:

Q = process noise covariance
R = measurement noise covariance

The system becomes deterministic:

x
k+1
	​

=Ax
k
	​

y
k
	​

=Cx
k
	​


Measurements perfectly reflect the system state, and no uncertainty is introduced by the dynamics.

6. Covariance Propagation

The prediction covariance evolves according to:

P
k∣k−1
	​

=AP
k−1∣k−1
	​

A
T
+Q

For the noiseless case:

Q=0

so:

P
k∣k−1
	​

=AP
k−1∣k−1
	​

A
T

The covariance update equation is:

P
k∣k
	​

=(I−K
k
	​

C)P
k∣k−1
	​


In an observable system with perfect measurements, repeated updates reduce estimation uncertainty and drive the covariance toward very small values.

This phenomenon is often referred to as covariance collapse.

7. Kalman Filter Algorithm

The Kalman Filter operates in two phases:

Prediction Step
State Prediction
x
^
k∣k−1
	​

=A
x
^
k−1∣k−1
	​

Covariance Prediction
P
k∣k−1
	​

=AP
k−1∣k−1
	​

A
T
+Q
Update Step
Kalman Gain
K
k
	​

=P
k∣k−1
	​

C
T
(CP
k∣k−1
	​

C
T
+R)
−1
State Update
x
^
k∣k
	​

=
x
^
k∣k−1
	​

+K
k
	​

(y
k
	​

−C
x
^
k∣k−1
	​

)
Covariance Update
P
k∣k
	​

=(I−K
k
	​

C)P
k∣k−1
	​

8. Innovation (Residual)

The innovation measures the discrepancy between prediction and observation.

ν
k
	​

=y
k
	​

−C
x
^
k∣k−1
	​


Interpretation:

Innovation Value	Meaning
Near zero	Accurate prediction
Large magnitude	Model mismatch, initialization error, or noise

In an ideal noiseless system with a correct model, innovations approach zero as the filter converges.

9. Initial Conditions

The behavior of an unforced system depends strongly on its initial conditions.

Initial State Estimate
x
^
0
	​


represents the best available estimate of the starting state.

Errors in initialization create transient prediction errors that gradually decrease as measurements are incorporated.

Initial Covariance
P
0
	​


represents uncertainty in the initial state estimate.

Choice of P
0
	​

	Effect
Large P
0
	​

	Fast convergence, high measurement trust
Small P
0
	​

	Slow convergence, high prediction trust
Diagonal P
0
	​

	Assumes state independence
P
0
	​

=I	Neutral initialization
10. ECG State-Space Formulation

A simplified ECG state vector may be represented as:

x
k
	​

=[ϕ
k
	​

,z
k
	​

,ω
k
	​

]
T

where:

State Variable	Meaning
ϕ
k
	​

	Cardiac phase
z
k
	​

	ECG amplitude
ω
k
	​

	Angular frequency

A common observation matrix is:

C=[010]

which extracts the ECG amplitude:

y
k
	​

=z
k
	​

11. Multi-Step Prediction

Future ECG states can be predicted using:

x
^
k+n∣k
	​

=A
n
x
^
k∣k
	​


The corresponding covariance prediction is:

P
k+n∣k
	​

=A
n
P
k∣k
	​

(A
n
)
T

Prediction accuracy depends on:

model quality
initial conditions
eigenvalues of A
prediction horizon

Longer prediction horizons generally increase sensitivity to modeling errors.

12. Educational Learning Outcomes

After completing this experiment, students should be able to:

Understand state-space representations of dynamic systems.
Explain the concept of an unforced (autonomous) dynamic model.
Implement the Kalman Filter prediction and update equations.
Analyze covariance propagation and uncertainty reduction.
Interpret the influence of initial conditions x
0
	​

 and P
0
	​

.
Study the effect of eigenvalues on system stability.
Perform multi-step ECG prediction using state-transition matrices.
Analyze innovation signals as indicators of estimation quality.
Understand why the noiseless case serves as the theoretical baseline for real-world noisy Kalman Filter applications.
Suggested Simulation Experiments
Experiment	Learning Objective
Vary P
0
	​

	Observe convergence behavior
Vary 
x
^
0
	​

	\Study transient response
Modify eigenvalues of A	Explore stability
Multi-step prediction	Analyze forecast accuracy
Introduce process noise Q	Observe covariance growth
Introduce measurement noise R	Observe Kalman gain changes
Perfect initialization	Observe ideal filter behavior
References
Kalman, R. E. (1960). A New Approach to Linear Filtering and Prediction Problems. ASME Journal of Basic Engineering.
McSharry, P. E., Clifford, G. D., Tarassenko, L., & Smith, L. A. (2003). A Dynamical Model for Generating Synthetic Electrocardiogram Signals. IEEE Transactions on Biomedical Engineering.
Welch, G., & Bishop, G. (2006). An Introduction to the Kalman Filter.
Simon, D. (2006). Optimal State Estimation: Kalman, H-Infinity, and Nonlinear Approaches.