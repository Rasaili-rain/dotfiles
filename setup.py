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

def create_symlinks():
    """Create symlinks for dotfiles in the home directory."""
    for src, dst in CONFIGS.items():
        src_path = DOTFILES_DIR / src
        dst_path = HOME / dst

        # Ensure the destination directory exists
        dst_path.parent.mkdir(parents=True, exist_ok=True)

        # Remove existing file or symlink if it exists
        if dst_path.exists() or dst_path.is_symlink():
            print(f"Removing existing {dst_path}")
            dst_path.unlink()

        # Create the symlink
        print(f"Creating symlink: {src_path} -> {dst_path}")
        dst_path.symlink_to(src_path)

def main():
    print("Setting up dotfiles...")
    create_symlinks()
    print("Setup complete!")

if __name__ == "__main__":
    main()