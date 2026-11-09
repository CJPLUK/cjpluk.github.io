---
title: "Cangjie Nightly Builds Now Install via Scoop on Windows"
description: "Cangjie's Windows nightly builds can now be installed, upgraded, pinned, and switched through the Scoop package manager."
date: "08/09/2026"
authors:
  - "Cangjie UK Team"
tags:
  - "Cangjie"
  - "Package Management"
  - "Tutorial"
descriptionImage: "./figures/cover.jpg"
---

# Cangjie Nightly Builds Now Install via Scoop on Windows

Getting a Windows machine onto yesterday's Cangjie build used to mean finding the right zip, unpacking it somewhere sensible, and running envsetup.ps1 in every new shell.

Cangjie's nightly builds now ship as a Scoop package. That whole sequence collapses into two commands.

## What Scoop is

Scoop is a command-line package manager for Windows, roughly what apt is on Linux or Homebrew on macOS. It installs, upgrades and removes packages in one line, configures PATH for you, and keeps multiple versions of the same tool side by side.

If you don't have it, run the ExecutionPolicy line and the Scoop installer one-liner in PowerShell:

```text
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

One gotcha: Scoop refuses to install from an elevated prompt. Use a normal PowerShell window, not Run as administrator.

## Three steps

**1. Register the bucket. Once, ever:**

```text
scoop bucket add cangjie https://atomgit.com/Cangjie/nightly_build
```

**2. Install. The package tracks a build produced automatically from main every day:**

```text
scoop install cangjie-nightly
```

**3. Upgrade whenever you want the latest:**

```text
scoop update
```

```text
scoop update cangjie-nightly
```

Scoop sets CANGJIE_HOME and PATH itself, which is exactly what the SDK's envsetup.ps1 does by hand. Open a fresh terminal and confirm:

```text
cjc --version
```

```text
cjpm --version
```

## Pinning an older build

Nightlies are retained for 30 days. Any build inside that window is installable by version number, and several can coexist on the same machine. Switch between them with:

```text
scoop reset cangjie-nightly@<version>
```

Three things to know before you try it. The version string has to be the complete tag, character for character, as in 1.3.0-alpha.20260901010012; one wrong digit returns a 404. scoop search matches on application name only, so historical versions never show up in its results. And anything older than 30 days has been archived, which means its download URL is dead.

To see what is currently available, query the AtomGit releases API. Note that it sorts oldest first by default, so pass &direction=desc.

## What's behind it

The reason Scoop always knows about last night's build is a release pipeline rather than a person:

1. main builds a nightly and publishes a Release, daily.

2. The release pipeline runs tools/update_manifest.py, a plain Python 3 script with no extra dependencies.

3. That script writes the new version number, hash and download URL back into bucket/cangjie-nightly.json.

4. Your next scoop update pulls the refreshed manifest.

No human step anywhere in that chain, which is the part worth noticing. A manifest someone has to remember to bump is a manifest that goes stale.

Docs and source: [atomgit.com/Cangjie/nightly_build](https://atomgit.com/Cangjie/nightly_build)
