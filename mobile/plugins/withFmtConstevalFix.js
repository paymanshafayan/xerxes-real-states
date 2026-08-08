// withFmtConstevalFix — Expo config plugin
// ---------------------------------------------------------------------------
// Workaround for the iOS build failure on Xcode 26.x (Apple Clang 21):
//
//   error: call to consteval function 'fmt::basic_format_string<...>::
//   basic_format_string<FMT_COMPILE_STRING, 0>' is not a constant expression
//
// React Native 0.76 pulls in fmt 11.x. Apple Clang 21 rejects several of its
// C++20 consteval format strings. Compiling only the fmt pod as C++17 avoids
// that consteval path while leaving the rest of React Native on C++20.
//
// Ordering is important: React Native 0.76's `react_native_post_install`
// unconditionally sets every native pod target to C++20. The workaround must
// therefore be inserted AFTER that call, or React Native silently overwrites
// it during `pod install`.
// ---------------------------------------------------------------------------

const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("@expo/config-plugins");

const FIX_MARKER = "fmt consteval workaround";

const FMT_FIX_SNIPPET = `

    # --- fmt consteval workaround (Xcode 26.x / Apple Clang 21) ---
    # Keep this after react_native_post_install: RN 0.76 sets all pod targets
    # back to C++20 inside that helper.
    fmt_target = installer.pods_project.targets.find { |target| target.name == 'fmt' }
    if fmt_target
      fmt_target.build_configurations.each do |config|
        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
      end
      Pod::UI.puts('[withFmtConstevalFix] fmt build setting: C++17')
    else
      Pod::UI.warn('[withFmtConstevalFix] fmt target not found')
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
    if (podfile.includes(FIX_MARKER)) {
      return modConfig;
    }

    // Expo SDK 52 emits this multiline call inside the Podfile's post_install
    // block. Append our setting to it so it wins over React Native's C++20
    // assignment. Do not inject at the start of post_install.
    const reactNativePostInstall =
      /(^[\t ]*react_native_post_install\(\s*$[\s\S]*?^[\t ]*\)\s*$)/m;

    if (!reactNativePostInstall.test(podfile)) {
      throw new Error(
        "[withFmtConstevalFix] Could not find react_native_post_install(...) in Podfile."
      );
    }

    podfile = podfile.replace(
      reactNativePostInstall,
      (postInstallCall) => postInstallCall + FMT_FIX_SNIPPET
    );
    fs.writeFileSync(podfilePath, podfile);
    console.log(
      "[withFmtConstevalFix] Podfile patched after react_native_post_install (fmt -> C++17)."
    );
    return modConfig;
  }]);
};
