#!/usr/bin/env python3
import os
import shutil
from pathlib import Path
import subprocess
import sys
import pwd

def get_user_home():
    if 'SUDO_USER' in os.environ:
        user = os.environ['SUDO_USER']
        return Path(pwd.getpwnam(user).pw_dir)
    return Path.home()

USER_HOME = get_user_home()
DOTFILES_DIR = Path(__file__).parent
FONTS_DIR = DOTFILES_DIR / "assets" / "fonts"
SYSTEM_FONTS_DIR = Path("/usr/local/share/fonts")

CONFIGS = {
    "linux/kitty/kitty.conf": ".config/kitty/kitty.conf",
    "linux/plasma-org.kde.plasma.desktop-appletsrc": ".config/plasma-org.kde.plasma.desktop-appletsrc",
    "vscode/settings.json": ".config/Code/User/settings.json",
    "vscode/keybindings.json": ".config/Code/User/keybindings.json",
}

def check_root_privileges():
    if os.geteuid() != 0:
        print("Error: Font installation requires root privileges. Please run the script with sudo.")
        sys.exit(1)

def install_fonts():
    print("Installing system-wide fonts...")
    
    if not FONTS_DIR.exists():
        print(f"Error: Fonts directory {FONTS_DIR} not found in the repository.")
        sys.exit(1)

    SYSTEM_FONTS_DIR.mkdir(parents=True, exist_ok=True)

    font_files = list(FONTS_DIR.glob("*.ttf")) + list(FONTS_DIR.glob("*.otf"))
    if not font_files:
        print(f"Error: No .ttf or .otf font files found in {FONTS_DIR}.")
        sys.exit(1)

    for font_file in font_files:
        dst_path = SYSTEM_FONTS_DIR / font_file.name
        print(f"Installing {font_file.name} -> {dst_path}")
        shutil.copy2(font_file, dst_path)

    try:
        print("Updating font cache...")
        subprocess.run(["fc-cache", "-fv"], check=True)
        print("Font cache updated successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Error updating font cache: {e}")
        sys.exit(1)

def copy_configs():
    print("Copying configuration files...")
    for src, dst in CONFIGS.items():
        src_path = DOTFILES_DIR / src
        dst_path = USER_HOME / dst

        if not src_path.exists():
            print(f"Warning: Source file {src_path} does not exist. Skipping.")
            continue

        dst_path.parent.mkdir(parents=True, exist_ok=True)

        if dst_path.exists():
            print(f"Removing existing {dst_path}")
            dst_path.unlink()

        print(f"Copying {src_path} -> {dst_path}")
        shutil.copy2(src_path, dst_path)

def main():
    print("Setting up dotfiles and fonts...")    
    check_root_privileges()
    install_fonts()
    copy_configs()
    print("Setup complete! You can now safely delete the dotfiles repository.")

if __name__ == "__main__":
    main()