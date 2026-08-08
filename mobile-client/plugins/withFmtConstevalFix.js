// withFmtConstevalFix — Expo config plugin
// ---------------------------------------------------------------------------
// Workaround for the iOS build failure on Xcode 26.x (Apple Clang 21):
//
//   error: call to consteval function 'fmt::basic_format_string<...>::
//   basic_format_string<FMT_COMPILE_STRING, 0>' is not a constant expression
//
// React Native 0.76 bundles fmt 9.1.0 (via RCT-Folly), which uses C++20
// `consteval` for compile-time format-string validation. Apple Clang 21
// enforces stricter consteval rules, so compiling the fmt pod fails.
//
// Fix: inject a `post_install` hook into the generated Podfile that forces
// the `fmt` pod to compile as C++17 — `consteval` does not exist in C++17,
// so fmt falls back to its runtime format-string validation. Only the fmt
// target is affected; the rest of the project keeps C++20.
//
// This runs automatically during `expo prebuild` (locally and in CI), so no
// workflow changes are required.
// ---------------------------------------------------------------------------

const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("@expo/config-plugins");

const FMT_FIX_SNIPPET = `
  # --- fmt consteval workaround (Xcode 26.x / Apple Clang 21) ---
  # fmt 9.x relies on C++20 consteval, which Apple Clang 21 rejects.
  # Compiling fmt as C++17 skips consteval entirely (fmt falls back to
  # runtime format-string validation). Only the fmt pod is affected.
  installer.pods_project.targets.each do |target|
    if target.name == 'fmt'
      target.build_configurations.each do |config|
        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
      end
    end
  end
`;

module.exports = function withFmtConstevalFix(config) {
  return withDangerousMod(config, ["ios", (modConfig) => {
    const podfilePath = path.join(
      modConfig.modRequest.platformProjectRoot,
      "Podfile"
    );
    if (!fs.existsSync(podfilePath)) {
      console.warn("[withFmtConstevalFix] Podfile not found, skipping.");
      return modConfig;
    }

    let podfile = fs.readFileSync(podfilePath, "utf8");

    // Already patched (idempotent).
    if (podfile.includes("fmt consteval workaround")) {
      return modConfig;
    }

    const marker = "post_install do |installer|";
    if (!podfile.includes(marker)) {
      throw new Error(
        "[withFmtConstevalFix] Could not find 'post_install do |installer|' in Podfile."
      );
    }

    podfile = podfile.replace(marker, marker + "\n" + FMT_FIX_SNIPPET);
    fs.writeFileSync(podfilePath, podfile);
    console.log("[withFmtConstevalFix] Podfile patched (fmt -> C++17).");
    return modConfig;
  }]);
};
