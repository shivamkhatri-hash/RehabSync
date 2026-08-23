import math


def calculate_angle(a, b, c) -> float:
    """
    Calculate angle ABC in degrees.
    MediaPipe landmarks are expected to provide x and y.
    """

    ba_x = a.x - b.x
    ba_y = a.y - b.y

    bc_x = c.x - b.x
    bc_y = c.y - b.y

    denominator = (
        math.hypot(ba_x, ba_y)
        * math.hypot(bc_x, bc_y)
    )

    if denominator == 0:
        return 0.0

    cosine = (
        ba_x * bc_x + ba_y * bc_y
    ) / denominator

    cosine = max(-1.0, min(1.0, cosine))

    return math.degrees(
        math.acos(cosine)
    )


def ema(previous, current, alpha=0.35):
    """
    Exponential moving average.
    """

    if previous is None:
        return current

    return (
        alpha * current
        + (1.0 - alpha) * previous
    )
