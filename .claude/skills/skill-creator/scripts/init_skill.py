#!/usr/bin/env python3
"""
Skill Initializer - Creates a new skill from template

Usage:
    init_skill.py <skill-name> --path <path>

Examples:
    init_skill.py my-new-skill --path .claude/skills
    init_skill.py my-api-helper --path .claude/skills
"""

import sys
from pathlib import Path


SKILL_TEMPLATE = """---
name: {skill_name}
description: >-
  Describe what this skill does, when to use it, and what it produces.
  Include specific trigger scenarios and output artifacts.
---

# {skill_title}

Describe in 1-2 sentences what this skill enables and how it works.

## Critical Rules (MUST follow)

1. List the most important behavioral rules here
2. These get the most LLM attention (primacy bias)
3. Use MUST/SHOULD/MAY to classify every instruction

## When to Use

- Specific trigger condition
- User explicitly invokes `/{skill_name}`

## When NOT to Use

- When task X applies -- use `/alternative-skill` instead

## Process Overview

Describe the step-by-step workflow. Common structures:

- **Workflow-Based**: Phase 1, Phase 2, Phase 3 (best for sequential processes)
- **Task-Based**: Task Category 1, Task Category 2 (best for tool collections)
- **Reference**: Guidelines, Specifications, Usage (best for standards)

Each step SHOULD include "Done when:" completion criteria.

## Version History

| Version | Date       | Description                            |
| ------- | ---------- | -------------------------------------- |
| 1.0     | YYYY-MM-DD | Initial implementation (describe WHY) |
"""

EXAMPLE_SCRIPT = '''#!/usr/bin/env python3
"""
Example helper script for {skill_name}

Replace with actual implementation or delete if not needed.
"""

def main():
    print("Example script for {skill_name}")

if __name__ == "__main__":
    main()
'''

EXAMPLE_REFERENCE = """# {skill_title} Reference

Detailed examples, templates, and question banks extracted from SKILL.md
to keep the core skill under 300 lines.

Delete this file if not needed, or replace with actual reference content.
"""


def title_case_skill_name(skill_name):
    """Convert hyphenated skill name to Title Case for display."""
    return ' '.join(word.capitalize() for word in skill_name.split('-'))


def init_skill(skill_name, path):
    """
    Initialize a new skill directory with template SKILL.md.

    Args:
        skill_name: Name of the skill
        path: Path where the skill directory should be created

    Returns:
        Path to created skill directory, or None if error
    """
    skill_dir = Path(path).resolve() / skill_name

    if skill_dir.exists():
        print(f"[ERROR] Skill directory already exists: {skill_dir}")
        return None

    try:
        skill_dir.mkdir(parents=True, exist_ok=False)
        print(f"[OK] Created skill directory: {skill_dir}")
    except Exception as e:
        print(f"[ERROR] Creating directory: {type(e).__name__}")
        return None

    skill_title = title_case_skill_name(skill_name)
    skill_content = SKILL_TEMPLATE.format(
        skill_name=skill_name,
        skill_title=skill_title
    )

    skill_md_path = skill_dir / 'SKILL.md'
    try:
        skill_md_path.write_text(skill_content, encoding='utf-8')
        print("[OK] Created SKILL.md")
    except Exception as e:
        print(f"[ERROR] Creating SKILL.md: {type(e).__name__}")
        return None

    try:
        scripts_dir = skill_dir / 'scripts'
        scripts_dir.mkdir(exist_ok=True)
        example_script = scripts_dir / 'example.py'
        example_script.write_text(
            EXAMPLE_SCRIPT.format(skill_name=skill_name),
            encoding='utf-8'
        )
        try:
            example_script.chmod(0o755)
        except OSError:
            pass  # chmod not supported on Windows
        print("[OK] Created scripts/example.py")

        references_dir = skill_dir / 'references'
        references_dir.mkdir(exist_ok=True)
        example_reference = references_dir / 'reference.md'
        example_reference.write_text(
            EXAMPLE_REFERENCE.format(skill_title=skill_title),
            encoding='utf-8'
        )
        print("[OK] Created references/reference.md")
    except Exception as e:
        print(f"[ERROR] Creating resource directories: {type(e).__name__}")
        return None

    print(f"\n[OK] Skill '{skill_name}' initialized at {skill_dir}")
    print("\nNext steps:")
    print("1. Edit SKILL.md -- replace guided prompts with real content")
    print("2. Customize or delete example files in scripts/, references/")
    print("3. Run: npm run skills:validate")

    return skill_dir


def main():
    if len(sys.argv) < 4 or sys.argv[2] != '--path':
        print("Usage: init_skill.py <skill-name> --path <path>")
        print("\nSkill name requirements:")
        print("  - Hyphen-case (e.g., 'data-analyzer')")
        print("  - Lowercase letters, digits, and hyphens only")
        print("  - Max 40 characters")
        print("\nExamples:")
        print("  init_skill.py my-new-skill --path .claude/skills")
        sys.exit(1)

    skill_name = sys.argv[1]
    path = sys.argv[3]

    print(f"Initializing skill: {skill_name}")
    print(f"  Location: {path}")
    print()

    result = init_skill(skill_name, path)
    sys.exit(0 if result else 1)


if __name__ == "__main__":
    main()
