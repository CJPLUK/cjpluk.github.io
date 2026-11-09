---
title: "Cangjie 1.2.0: Cross-Platform, Compiler and Toolchain Upgrades"
description: "Cangjie 1.2.0 expands Android and iOS support while delivering compiler, performance, package-management, and toolchain upgrades."
date: "22/09/2026"
authors:
  - "Cangjie UK Team"
tags:
  - "Cangjie"
  - "Ecosystem"
descriptionImage: "./figures/cover.jpg"
---

# Cangjie 1.2.0: Cross-Platform, Compiler and Toolchain Upgrades

Cangjie 1.2.0 reaches further onto mobile: Android back to API level 23, iOS simulators, and link-time optimization on iOS devices. It also brings two breaking changes, one of which means every project and dependency has to be recompiled with the new SDK.

The release in context

1.2.0 is a short-term support (STS) release with a six-month maintenance window. STS releases carry new features on a shorter cycle, while long-term support (LTS) releases, the most recent being 1.0.0, serve as the stable baseline. The 1.1.x line stops receiving maintenance on 30 October 2026. Compared with 1.1.3, this release concentrates on three areas: cross-platform support, compiler stability, and the toolchain.

Language

Most language changes extend common/platform, Cangjie's mechanism for sharing code across targets. A common declaration defines the shared surface, and each target supplies a platform implementation, similar in spirit to expect/actual in Kotlin Multiplatform.

In 1.2.0, common/platform can modify generic extend declarations. A platform function may return a subtype of its common return type. Variables with initial values no longer need an explicit type. If every member function of a common class, struct, enum or extend already has an implementation, the platform declaration can be omitted entirely. A common abstract class can also be matched by a platform sealed abstract class.

Cross-language interop moves forward on both mobile fronts. Objective-C can now use Cangjie interfaces, enums, open classes and generic types. Java can use Cangjie generic types and lambdas. Expression types and tuple types are supported across the boundary as well.

Compiler

Android cross-compilation now covers API level 23 and above, enabled with --target=aarch64-linux-android or --target=aarch64-linux-android23. The compiler adds cross-compilation for the iOS x86_64 simulator, and LTO now works on iOS devices for both dylib and executable outputs, with package-level visibility configuration for dylibs. A new OHOS build of the SDK runs on HarmonyOS PCs, Huawei's desktop edition of its operating system.

For people working on the compiler itself, new --dump-ast, --dump-chir, --dump-ir, --dump-all and --dump-toscreen options print readable forms of each compilation stage.

Breaking change 1: static variable initialization. Assigning to a static member variable inside a function or lambda used to count as initialization and compiled without complaint. It is now a compile error. The fix is to initialize at the declaration or inside static init(). Where assignment inside a function is genuinely needed, wrap the variable as an Option var starting at None, then add a prop with the original name whose getter and setter carry the assignment logic. Details are in issue 105 of the cangjie_compiler repository on GitCode.

common/platform declarations also get stricter checks: annotations must be consistent across both sides, primary constructors cannot be marked, abstract platform classes cannot add extra abstract members, and all direct subtypes of a common sealed class must live in the same source set. Default parameter values may be defined on either side.

Fixes include overload resolution now excluding broken declarations, an internal compiler error with pattern variables in const functions, variable declarations inside synchronized blocks, a devirtualization bug and a runtime SIGSEGV crash.

Runtime

The runtime supports 16 KB page alignment for android23 aarch64 and above. This matters because newer Android devices use 16 KB memory pages, and Google Play requires native code built for them in apps targeting recent Android versions. On iOS, the runtime adds tracing, handling of uncaught Cangjie exceptions, and support for the x86_64 simulator. Conditional compilation gains a built-in env variable exposing the target ABI and related platform details.

Notable fixes: Android timezone data now comes from the bionic property API, static linking on Windows no longer fails at runtime, an uncaught exception in a user signal handler no longer terminates programs on macOS, and a linker script issue that merged text sections and broke linking is resolved.

Standard library

Reflection can now return a package's organization name, part of a new organization-name syntax for packages that the whole toolchain adopts in this release. The standard library builds and runs on HarmonyOS PC and the iOS x86_64 simulator. FFI with Objective-C can map top-level functions, construct objects through init* methods, map Option to Objective-C pointer types, and map the C structs Objective-C code uses.

Breaking change 2: binary compatibility. Exception and TypeInfo gain reserved private fields, groundwork for exception chaining and reflection features. Since 1.0.0 LTS, compiled outputs from different SDK versions could be mixed. That no longer holds: binaries built with 1.2.0 are incompatible with those from earlier SDKs, and mixing them can cause runtime errors. The fix is a full rebuild of your project and every dependency with 1.2.0 or later.

The regex library's bundled PCRE2 moves from 10.44 to 10.46. Fixes cover clearer std.fs exception messages, a performance and code size regression in Array, and TimerScheduler.add() handling of zero and negative durations.

Toolchain

The IDE plugin adds highlighting and completion for organization names, language services for dependencies from the central repository, cross-platform go-to-definition, and awareness of cjpm's combined and lto-combined modes. Extract and rename refactorings are more reliable, and a blocking call has been moved off the main thread.

cjpm gets a new bundle command that validates and packages a local project, and supports uploading and downloading artifacts to and from the central repository. The repository itself supports semantic versioning and an index, with developer documentation to follow. For a young language, a working package registry is what turns individual libraries into an ecosystem. Smaller additions include a -- separator for passing arguments through cjpm run and configurable build script output paths.

cjdb opens up Python scripting and can now evaluate coalescing, pattern matching and question-mark operator expressions. cjfmt, cjlint and cjcov support the common/platform syntax, and cjprof collects and analyzes profiling data faster.

Known issues

Two cjdb issues remain open with no workaround yet: single-stepping behaves unexpectedly in some cross-platform scenarios on Windows, and expression evaluation returns wrong results in some Option cases. Both are scheduled for a later release.

For teams still on 1.1.x, the practical date is 30 October, when maintenance ends. Moving to 1.2.0 before then means budgeting for the static initialization fixes and a clean rebuild of the full dependency tree.
