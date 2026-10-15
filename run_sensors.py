
import subprocess
import sys
import time
from pathlib import Path

PROJECT_FOLDER = Path(__file__).resolve().parent
GENERATOR = PROJECT_FOLDER / "data_generator.py"

while True:
    print("\nGenerating new campus readings...", flush=True)

    try:
        result = subprocess.run(
            [sys.executable, str(GENERATOR)],
            cwd=PROJECT_FOLDER,
            check=True
        )
        print("Readings generated successfully.", flush=True)

    except subprocess.CalledProcessError as error:
        print(f"Generator failed: {error}", flush=True)
        print("Check data_generator.py for errors.", flush=True)

    print("Next update in 30 seconds.", flush=True)
    time.sleep(30)
