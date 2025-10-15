#!/usr/bin/env python3
import os
import sys
import shutil
import subprocess
from pathlib import Path

HOME = Path.home()
DOTFILES_DIR = Path(__file__).resolve().parent

def run(cmd):
    print(f"[CMD]    {cmd}")
    return subprocess.run(cmd, shell=True, check=False)

def detect_distro():
    if os.path.exists("/etc/os-release"):
        with open("/etc/os-release") as f:
            for line in f:
                if line.startswith("ID="):
                    return line.strip().split("=")[1].strip('"')
    return "unknown"

def detect_desktop_env():
    de = os.environ.get("XDG_CURRENT_DESKTOP", "").lower()
    if "kde" in de: return "kde"
    elif "gnome" in de: return "gnome"
    return "other"

def is_installed(cmd): return shutil.which(cmd) is not None

def install_pkgs(pkgs, distro):
    missing = [p for p in pkgs if not is_installed(p)]
    if not missing:
        print(f"[INFO] All packages already installed: {' '.join(pkgs)}")
        return
    print(f"\n [INFO] Installing missing packages: {' '.join(missing)}")
    if distro in ["arch", "manjaro", "endeavouros"]:
        run("pacman -Syu --noconfirm " + " ".join(missing))
    elif distro in ["ubuntu", "debian", "pop", "linuxmint"]:
        run("apt update -y && apt install -y " + " ".join(missing))
    else:
        print(f" [INFO] Unsupported distro: {distro}")
        sys.exit(1)

def install_snap(distro):
    if is_installed("snap"):
        print(" [INFO] Snap already installed.")
        return
    print("\n[INFO]  Installing snapd...")
    if distro in ["arch", "manjaro", "endeavouros"]:
        run("pacman -S --noconfirm snapd")
        run("systemctl enable --now snapd.socket")
        run("ln -sf /var/lib/snapd/snap /snap")
    elif distro in ["ubuntu", "debian", "pop", "linuxmint"]:
        run("apt install -y snapd")
        run("systemctl enable --now snapd.apparmor || true")
    else:
        print(" [INFO] Snap not supported on this distro.")

# ---------------- System Setup ---------------- #
def install_fonts():
    fonts_src = DOTFILES_DIR / "assets" / "fonts"
    fonts_dst = Path("/usr/share/fonts/truetype/custom")
    if not fonts_src.exists():
        print("[INFO]  No fonts found, skipping font installation.")
        return
    fonts_dst.mkdir(parents=True, exist_ok=True)
    for font in fonts_src.iterdir():
        if font.is_file():
            print(f" [INFO] Installing font: {font.name}")
            shutil.copy2(font, fonts_dst)
    run("fc-cache -fv")

def install_oh_my_zsh():
    if not (HOME / ".oh-my-zsh").exists():
        print(" [INFO] Installing Oh My Zsh...")
        run('sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"')
    else:
        print("[INFO]  Oh My Zsh already installed.")

def install_powerlevel10k():
    theme_dir = HOME / ".oh-my-zsh/custom/themes/powerlevel10k"
    if not theme_dir.exists():
        print("[INFO]  Installing Powerlevel10k theme...")
        run(f"git clone --depth=1 https://github.com/romkatv/powerlevel10k.git {theme_dir}")
    else:
        print("[INFO] Powerlevel10k already exists.")

def install_zsh_plugins():
    plugins_dir = HOME / ".oh-my-zsh/custom/plugins"
    plugins_dir.mkdir(parents=True, exist_ok=True)
    repos = {
        "zsh-autosuggestions": "https://github.com/zsh-users/zsh-autosuggestions.git",
        "zsh-syntax-highlighting": "https://github.com/zsh-users/zsh-syntax-highlighting.git"
    }
    for name, repo in repos.items():
        path = plugins_dir / name
        if not path.exists():
            print(f"[INFO]  Installing {name}...")
            run(f"git clone {repo} {path}")
        else:
            print(f"[INFO]  {name} already exists.")

def configure_zsh_theme():
    zshrc = HOME / ".zshrc"
    if not zshrc.exists():
        zshrc.touch()
    with open(zshrc, "r") as f:
        lines = f.readlines()
    new_lines = []
    for line in lines:
        if line.startswith("ZSH_THEME="):
            line = 'ZSH_THEME="powerlevel10k/powerlevel10k"\n'
        elif line.startswith("plugins="):
            line = 'plugins=(git zsh-autosuggestions zsh-syntax-highlighting)\n'
        new_lines.append(line)
    if not any(l.startswith("ZSH_THEME=") for l in new_lines):
        new_lines.append('ZSH_THEME="powerlevel10k/powerlevel10k"\n')
    if not any(l.startswith("plugins=") for l in new_lines):
        new_lines.append('plugins=(git zsh-autosuggestions zsh-syntax-highlighting)\n')
    with open(zshrc, "w") as f:
        f.writelines(new_lines)
    print("[INFO] Zsh configured with Powerlevel10k + plugins.")

def copy_configs(desktop_env):
    print("\n [INFO] Copying configuration files...")
    # Common configs
    linux_dir = DOTFILES_DIR / "linux"
    for root, _, files in os.walk(linux_dir):
        rel = Path(root).relative_to(linux_dir)
        target = HOME / ".config" / rel
        target.mkdir(parents=True, exist_ok=True)
        for file in files:
            shutil.copy2(Path(root) / file, target / file)
            print(f"[INFO] → Copied {file} to {target}")

    # VSCode configs
    vscode_dir = DOTFILES_DIR / "vscode"
    vscode_target = HOME / ".config/Code/User"
    vscode_target.mkdir(parents=True, exist_ok=True)
    for file in vscode_dir.iterdir():
        shutil.copy2(file, vscode_target / file.name)
        print(f"[INFO] → Copied {file.name} to VSCode configs")

    # KDE-specific config
    if desktop_env == "kde":
        kde_dir = linux_dir /"kde"
        plasma_src = kde_dir/"plasma-org.kde.plasma.desktop-appletsrc"
        plasma_dst = HOME / ".config/plasma-org.kde.plasma.desktop-appletsrc"
        if plasma_src.exists():
            shutil.copy2(plasma_src, plasma_dst)
            print("[INFO]  Applied KDE Plasma configuration.")
    elif desktop_env == "gnome":
        gnome_dir = linux_dir /"gnome"
        print("[INFO]  GNOME detected — skipping KDE config.")

def set_default_shell():
    print("\n [INFO] Setting Zsh as default shell...")
    run("chsh -s $(which zsh)")

# ---------------- Main ---------------- #
def main():
    if os.geteuid() != 0:
        print("[INFO] Please run with sudo: sudo python3 setup.py")
        sys.exit(1)

    distro = detect_distro()
    desktop_env = detect_desktop_env()
    print(f"[INFO] Distro: {distro} |  Desktop: {desktop_env}")

    core_pkgs = ["curl", "git", "zsh", "tree", "cava", "btop"]
    install_pkgs(core_pkgs, distro)

    # Fastfetch / Neofetch
    if not (is_installed("fastfetch") or is_installed("neofetch")):
        install_pkgs(["fastfetch"], distro)
        if not is_installed("fastfetch"):
            install_pkgs(["neofetch"], distro)

    # Snapd
    install_snap(distro)

    # Fonts & Configs
    install_fonts()
    install_oh_my_zsh()
    install_powerlevel10k()
    install_zsh_plugins()
    copy_configs(desktop_env)
    configure_zsh_theme()
    set_default_shell()

    print("\n [INFO] System setup complete! Run `exec zsh` or reboot to apply.")

if __name__ == "__main__":
    main()
