#!/usr/bin/env python3
import os
import shutil
from pathlib import Path

HOME = Path.home()
DOTFILES_DIR = Path(__file__).parent

# Define mappings of source files to their target locations
CONFIGS = {
    "linux/kitty/kitty.conf": ".config/kitty/kitty.conf",
    "linux/plasma-org.kde.plasma.desktop-appletsrc": ".config/plasma-org.kde.plasma.desktop-appletsrc",
    "vscode/settings.json": ".config/Code/User/settings.json",
    "vscode/keybindings.json": ".config/Code/User/keybindings.json",
}

def copy_configs():
    """Copy dotfiles to their target locations in the home directory."""
    for src, dst in CONFIGS.items():
        src_path = DOTFILES_DIR / src
        dst_path = HOME / dst

        # Ensure the destination directory exists
        dst_path.parent.mkdir(parents=True, exist_ok=True)

        # Remove existing file if it exists
        if dst_path.exists():
            print(f"Removing existing {dst_path}")
            dst_path.unlink()

        # Copy the file
        print(f"Copying {src_path} -> {dst_path}")
        shutil.copy2(src_path, dst_path)

def main():
    print("Setting up dotfiles by copying configurations...")
    copy_configs()
    print("Setup complete! You can now safely delete the dotfiles repository.")

if __name__ == "__main__":
    main()