import sys
import os

# Ensure the root project directory is in the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from application.ui.cli import run_cli

if __name__ == "__main__":
    run_cli()
