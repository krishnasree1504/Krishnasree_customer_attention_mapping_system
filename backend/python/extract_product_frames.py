import cv2
import os

# CHANGE THIS to your actual input video
VIDEO_PATH = r"C:\Users\91918\Downloads\krishnasree_customer_attention_mapping_system (3)\backend\uploads\video_1787591509123_152510248.mp4"

# Where extracted images will be stored
OUTPUT_DIR = r"datasets\products\raw_frames"

# Extract one frame every N frames
FRAME_INTERVAL = 10

os.makedirs(OUTPUT_DIR, exist_ok=True)

cap = cv2.VideoCapture(VIDEO_PATH)

if not cap.isOpened():
    print("ERROR: Could not open video")
    exit()

fps = cap.get(cv2.CAP_PROP_FPS)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

print(f"FPS: {fps}")
print(f"Total frames: {total_frames}")

frame_number = 0
saved = 0

while True:
    ret, frame = cap.read()

    if not ret:
        break

    if frame_number % FRAME_INTERVAL == 0:
        filename = os.path.join(
            OUTPUT_DIR,
            f"frame_{saved:05d}.jpg"
        )

        cv2.imwrite(filename, frame)
        saved += 1

    frame_number += 1

cap.release()

print("--------------------------------")
print(f"Total frames extracted: {saved}")
print(f"Saved to: {OUTPUT_DIR}")