"""Compatibility entrypoint: package the current family workshop release."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('build-family-kit.py')), run_name='__main__')
