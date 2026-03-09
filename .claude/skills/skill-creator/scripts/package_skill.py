#!/usr/bin/env python3
"""
Skill Packager - Creates a distributable zip file of a skill folder

Usage:
    python package_skill.py <path/to/skill-folder> [output-directory]

Example:
    python package_skill.py .claude/skills/my-skill
    python package_skill.py .claude/skills/my-skill ./dist
"""

import sys
import zipfile
from pathlib import Path
from quick_validate import validate_skill

# Files/patterns that should never be packaged into distributable skills
SENSITIVE_PATTERNS = {
    ".env", ".env.local", ".env.production", ".env.encrypted",
    ".key", ".pem", ".p12", ".pfx", ".jks",
    "credentials.json", "service-account.json",
    ".secret", ".token",
    "id_rsa", "id_dsa", "id_ecdsa", "id_ed25519",
}
SENSITIVE_EXTENSIONS = {".key", ".pem", ".p12", ".pfx", ".jks"}


def package_skill(skill_path, output_dir=None):
    """
    Package a skill folder into a zip file.

    Args:
        skill_path: Path to the skill folder
        output_dir: Optional output directory for the zip file

    Returns:
        Path to the created zip file, or None if error
    """
    skill_path = Path(skill_path).resolve()

    if not skill_path.exists():
        print(f"[ERROR] Skill folder not found: {skill_path}")
        return None

    if not skill_path.is_dir():
        print(f"[ERROR] Path is not a directory: {skill_path}")
        return None

    skill_md = skill_path / "SKILL.md"
    if not skill_md.exists():
        print(f"[ERROR] SKILL.md not found in {skill_path}")
        return None

    print("Validating skill...")
    valid, message = validate_skill(skill_path)
    if not valid:
        print(f"[ERROR] Validation failed: {message}")
        print("  Fix validation errors before packaging.")
        return None
    print(f"[OK] {message}\n")

    skill_name = skill_path.name
    if output_dir:
        output_path = Path(output_dir).resolve()
        output_path.mkdir(parents=True, exist_ok=True)
    else:
        output_path = Path.cwd()

    zip_filename = output_path / f"{skill_name}.zip"

    try:
        with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
            skipped = []
            excluded_dirs = {".git", "node_modules", "dist", "build", "__pycache__"}
            excluded_files = {".ds_store"}
            for file_path in skill_path.rglob('*'):
                if not file_path.is_file():
                    continue
                # Skip non-distributable directories and files
                parts_lower = {p.lower() for p in file_path.parts}
                if excluded_dirs & parts_lower or file_path.name.lower() in excluded_files:
                    continue
                # Skip symlinks or files resolving outside the skill dir
                try:
                    resolved = file_path.resolve()
                    resolved.relative_to(skill_path.resolve())
                except (ValueError, OSError):
                    try:
                        skipped.append(file_path.relative_to(skill_path.parent))
                    except ValueError:
                        skipped.append(Path(str(file_path)))
                    continue
                # Avoid archiving the output zip into itself
                if file_path.resolve() == zip_filename.resolve():
                    continue
                # Skip sensitive files (secrets, keys, credentials)
                fname = file_path.name.lower()
                is_env_variant = fname == ".env" or fname.startswith(".env.")
                if fname in SENSITIVE_PATTERNS or is_env_variant or file_path.suffix.lower() in SENSITIVE_EXTENSIONS:
                    skipped.append(file_path.relative_to(skill_path.parent))
                    continue
                arcname = file_path.relative_to(skill_path.parent)
                zipf.write(file_path, arcname)
                print(f"  Added: {arcname}")
            if skipped:
                print(f"\n[WARN] Skipped {len(skipped)} sensitive file(s):")
                for s in skipped:
                    print(f"  - {s}")

        print(f"\n[OK] Packaged skill to: {zip_filename}")
        return zip_filename

    except Exception as e:
        print(f"[ERROR] Creating zip file: {e}")
        return None


def main():
    if len(sys.argv) < 2:
        print("Usage: python package_skill.py <path/to/skill-folder> [output-directory]")
        print("\nExample:")
        print("  python package_skill.py .claude/skills/my-skill")
        print("  python package_skill.py .claude/skills/my-skill ./dist")
        sys.exit(1)

    skill_path = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else None

    print(f"Packaging skill: {skill_path}")
    if output_dir:
        print(f"  Output directory: {output_dir}")
    print()

    result = package_skill(skill_path, output_dir)
    sys.exit(0 if result else 1)


if __name__ == "__main__":
    main()
