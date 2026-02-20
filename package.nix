{
  lib,
  stdenvNoCC,
  bun,
  makeBinaryWrapper,
  makeWrapper,
  writableTmpDirAsHomeHook,
}:
stdenvNoCC.mkDerivation (finalAttrs: {
  pname = "konytools";
  version = "unstable-2026-02-20";

  src = lib.cleanSource ./.;

  node_modules = stdenvNoCC.mkDerivation {
    pname = "konytools-node_modules";
    version = finalAttrs.version;

    src = finalAttrs.src;

    impureEnvVars = lib.fetchers.proxyImpureEnvVars ++ ["GIT_PROXY_COMMAND" "SOCKS_SERVER"];

    nativeBuildInputs = [bun writableTmpDirAsHomeHook];

    dontConfigure = true;

    buildPhase = ''
      runHook preBuild

      export BUN_INSTALL_CACHE_DIR=$(mktemp -d)

      bun install --force --frozen-lockfile --ignore-scripts --no-progress

      runHook postBuild
    '';

    installPhase = ''
      runHook preInstall

      mkdir -p $out/node_modules
      cp -R ./node_modules $out

      runHook postInstall
    '';

    dontFixup = true;

    outputHash = "sha256-cPt7T5MFTnW8pywb1N9zAMUhLFSMvcKgNAxkrESAuGU=";
    outputHashAlgo = "sha256";
    outputHashMode = "recursive";
  };

  nativeBuildInputs = [makeBinaryWrapper makeWrapper];

  dontConfigure = true;
  dontBuild = true;

  installPhase = ''
    runHook preInstall

    mkdir -p $out/lib/konytools
    cp -R src tsconfig.json package.json drizzle.config.ts .drizzle $out/lib/konytools/
    cp -R ${finalAttrs.node_modules}/node_modules $out/lib/konytools/

    makeBinaryWrapper ${bun}/bin/bun $out/bin/konytools \
      --add-flags "$out/lib/konytools/src/index.ts" \
      --set-default NODE_ENV production

    makeWrapper ${bun}/bin/bun $out/bin/konytools-migrate \
      --chdir "$out/lib/konytools" \
      --add-flags "db:push" \
      --set-default NODE_ENV production

    makeBinaryWrapper ${bun}/bin/bun $out/bin/konytools-commands \
      --add-flags "$out/lib/konytools/src/commands.ts" \
      --set-default NODE_ENV production

    makeBinaryWrapper ${bun}/bin/bun $out/bin/konytools-reminders \
      --add-flags "$out/lib/konytools/src/reminders.ts" \
      --set-default NODE_ENV production

    runHook postInstall
  '';
})
