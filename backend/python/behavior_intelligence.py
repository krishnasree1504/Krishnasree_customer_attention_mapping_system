from collections import Counter
from math import sqrt


# ============================================================
# MOVEMENT ANALYSIS
# ============================================================

def calculate_movement_distance(person_path):
    """
    Calculate total distance traveled by a customer.

    person_path format:
        [
            (frame_number, (x, y)),
            (frame_number, (x, y)),
            ...
        ]
    """

    if not person_path or len(person_path) < 2:
        return 0.0

    total_distance = 0.0

    for i in range(1, len(person_path)):

        _, previous_point = person_path[i - 1]
        _, current_point = person_path[i]

        x1, y1 = previous_point
        x2, y2 = current_point

        distance = sqrt(
            (x2 - x1) ** 2 +
            (y2 - y1) ** 2
        )

        total_distance += distance

    return round(total_distance, 2)


# ============================================================
# SHELF VISIT ANALYSIS
# ============================================================

def calculate_shelf_statistics(shelf_dwell_breakdown):
    """
    Analyze customer's shelf behavior.
    """

    if not shelf_dwell_breakdown:
        return {
            "shelvesVisited": 0,
            "favoriteShelf": None,
            "favoriteShelfDwellSec": 0.0
        }

    shelves_visited = len(shelf_dwell_breakdown)

    favorite_shelf = max(
        shelf_dwell_breakdown,
        key=shelf_dwell_breakdown.get
    )

    favorite_shelf_dwell = shelf_dwell_breakdown[
        favorite_shelf
    ]

    return {
        "shelvesVisited": shelves_visited,
        "favoriteShelf": favorite_shelf,
        "favoriteShelfDwellSec": round(
            favorite_shelf_dwell,
            2
        )
    }


# ============================================================
# BEHAVIOR SEGMENTATION
# ============================================================

def classify_customer(
    journey_duration,
    shelves_visited,
    dwell_time,
    movement_distance,
    attention_events,
    repeated_shelves
):
    """
    Classify customer behavior.

    Current implementation is rule-based.
    """

    # --------------------------------------------------------
    # QUICK BUYER
    # --------------------------------------------------------

    if (
        journey_duration <= 5
        and shelves_visited <= 2
        and dwell_time <= 3
    ):
        return "Quick Buyer"


    # --------------------------------------------------------
    # COMPARISON SHOPPER
    # --------------------------------------------------------

    if (
        shelves_visited >= 3
        and dwell_time >= 6
        and repeated_shelves >= 1
    ):
        return "Comparison Shopper"


    # --------------------------------------------------------
    # EXPLORER
    # --------------------------------------------------------

    if (
        shelves_visited >= 3
        and journey_duration >= 8
        and movement_distance >= 300
    ):
        return "Explorer"


    # --------------------------------------------------------
    # IMPULSE-LIKE BEHAVIOR
    # --------------------------------------------------------

    if (
        attention_events >= 5
        and journey_duration <= 8
        and shelves_visited <= 2
    ):
        return "Impulse-Like Shopper"


    # --------------------------------------------------------
    # DEFAULT
    # --------------------------------------------------------

    return "General Shopper"


# ============================================================
# BEHAVIOR SCORE
# ============================================================

def calculate_behavior_score(
    journey_duration,
    shelves_visited,
    dwell_time,
    movement_distance,
    attention_events
):
    """
    Calculate a 0-100 behavior engagement score.
    """

    score = 0.0

    # Shelf exploration
    score += min(
        shelves_visited * 10,
        30
    )

    # Dwell time
    score += min(
        dwell_time * 2,
        25
    )

    # Attention
    score += min(
        attention_events,
        20
    )

    # Movement
    score += min(
        movement_distance / 20,
        25
    )

    return round(
        min(score, 100),
        1
    )


# ============================================================
# SINGLE CUSTOMER ANALYSIS
# ============================================================

def analyze_customer(
    customer,
    person_path,
    gaze_events
):
    """
    Generate complete behavior profile for one customer.
    """

    customer_id = customer["customerId"]

    # --------------------------------------------------------
    # Basic customer information
    # --------------------------------------------------------

    journey_duration = float(
        customer.get(
            "trackDurationSec",
            0
        )
    )

    dwell_time = float(
        customer.get(
            "dwellTimeSec",
            0
        )
    )

    shelf_dwell_breakdown = customer.get(
        "shelfDwellBreakdown",
        {}
    )

    # --------------------------------------------------------
    # Shelf statistics
    # --------------------------------------------------------

    shelf_stats = calculate_shelf_statistics(
        shelf_dwell_breakdown
    )

    shelves_visited = shelf_stats[
        "shelvesVisited"
    ]

    # --------------------------------------------------------
    # Customer gaze events
    # --------------------------------------------------------

    customer_gazes = [
        event
        for event in gaze_events
        if event.get("customerId") == customer_id
    ]

    successful_gazes = [
        event
        for event in customer_gazes
        if event.get("direction") != "UNKNOWN"
    ]

    attention_events = len(
        successful_gazes
    )

    # --------------------------------------------------------
    # Movement
    # --------------------------------------------------------

    movement_distance = calculate_movement_distance(
        person_path
    )

    # --------------------------------------------------------
    # Repeated shelf detection
    # --------------------------------------------------------
    #
    # For this first version we don't yet have temporal
    # shelf-enter / shelf-exit sequences.
    #
    # Therefore we keep this conservative.
    #

    repeated_shelves = 0

    # --------------------------------------------------------
    # Behavior classification
    # --------------------------------------------------------

    behavior_segment = classify_customer(
        journey_duration=journey_duration,
        shelves_visited=shelves_visited,
        dwell_time=dwell_time,
        movement_distance=movement_distance,
        attention_events=attention_events,
        repeated_shelves=repeated_shelves
    )

    # --------------------------------------------------------
    # Behavior score
    # --------------------------------------------------------

    behavior_score = calculate_behavior_score(
        journey_duration=journey_duration,
        shelves_visited=shelves_visited,
        dwell_time=dwell_time,
        movement_distance=movement_distance,
        attention_events=attention_events
    )

    # --------------------------------------------------------
    # Final customer profile
    # --------------------------------------------------------

    return {

        "customerId": customer_id,

        "customerLabel": customer.get(
            "customerLabel",
            f"Customer #{customer_id}"
        ),

        "journeyDurationSec": journey_duration,

        "totalDwellTimeSec": dwell_time,

        "shelvesVisited": shelves_visited,

        "favoriteShelf": shelf_stats[
            "favoriteShelf"
        ],

        "favoriteShelfDwellSec": shelf_stats[
            "favoriteShelfDwellSec"
        ],

        "movementDistance": movement_distance,

        "attentionEvents": attention_events,

        "gazeConfidence": customer.get(
            "gazeConfidence",
            0
        ),

        "dominantGaze": customer.get(
            "dominantGaze",
            "UNKNOWN"
        ),

        "behaviorSegment": behavior_segment,

        "behaviorScore": behavior_score,

        "shelfDwellBreakdown": shelf_dwell_breakdown
    }


# ============================================================
# STORE-LEVEL SEGMENT DISTRIBUTION
# ============================================================

def calculate_segment_distribution(
    customer_profiles
):

    distribution = Counter(
        profile["behaviorSegment"]
        for profile in customer_profiles
    )

    return dict(distribution)


# ============================================================
# STORE-LEVEL SHOPPING PATTERNS
# ============================================================

def calculate_shopping_patterns(
    customer_profiles
):

    if not customer_profiles:

        return {
            "averageJourneyDurationSec": 0,
            "averageDwellTimeSec": 0,
            "averageShelvesVisited": 0,
            "averageMovementDistance": 0,
            "averageAttentionEvents": 0
        }

    count = len(
        customer_profiles
    )

    return {

        "averageJourneyDurationSec": round(
            sum(
                p["journeyDurationSec"]
                for p in customer_profiles
            ) / count,
            2
        ),

        "averageDwellTimeSec": round(
            sum(
                p["totalDwellTimeSec"]
                for p in customer_profiles
            ) / count,
            2
        ),

        "averageShelvesVisited": round(
            sum(
                p["shelvesVisited"]
                for p in customer_profiles
            ) / count,
            2
        ),

        "averageMovementDistance": round(
            sum(
                p["movementDistance"]
                for p in customer_profiles
            ) / count,
            2
        ),

        "averageAttentionEvents": round(
            sum(
                p["attentionEvents"]
                for p in customer_profiles
            ) / count,
            2
        )
    }


# ============================================================
# COMPLETE BEHAVIOR ANALYSIS
# ============================================================

def analyze_behavior(
    customers_data,
    valid_person_frames,
    gaze_events
):
    """
    Main Consumer Behavior Intelligence Engine.
    """

    customer_profiles = []

    # --------------------------------------------------------
    # Analyze every customer
    # --------------------------------------------------------

    for customer in customers_data:

        customer_id = customer[
            "customerId"
        ]

        person_path = valid_person_frames.get(
            customer_id,
            []
        )

        profile = analyze_customer(
            customer=customer,
            person_path=person_path,
            gaze_events=gaze_events
        )

        customer_profiles.append(
            profile
        )

    # --------------------------------------------------------
    # Segment distribution
    # --------------------------------------------------------

    segment_distribution = (
        calculate_segment_distribution(
            customer_profiles
        )
    )

    # --------------------------------------------------------
    # Shopping patterns
    # --------------------------------------------------------

    shopping_patterns = (
        calculate_shopping_patterns(
            customer_profiles
        )
    )

    # --------------------------------------------------------
    # Most common segment
    # --------------------------------------------------------

    if segment_distribution:

        dominant_segment = max(
            segment_distribution,
            key=segment_distribution.get
        )

    else:

        dominant_segment = None

    # --------------------------------------------------------
    # Store-level behavior intelligence
    # --------------------------------------------------------

    return {

        "customerProfiles":
            customer_profiles,

        "segmentDistribution":
            segment_distribution,

        "dominantCustomerSegment":
            dominant_segment,

        "shoppingPatterns":
            shopping_patterns,

        "totalCustomersAnalyzed":
            len(customer_profiles)
    }