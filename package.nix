{
  lib,
  stdenvNoCC,
  bun,
  makeBinaryWrapper,
  writableTmpDirAsHomeHook,
}:
stdenvNoCC.mkDerivation (finalAttrs: {
  pname = "konytools";
  version = "unstable-2026-02-16";

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

      bun install --force --frozen-lockfile --ignore-scripts --no-progress --production

      runHook postBuild
    '';

    installPhase = ''
      runHook preInstall

      mkdir -p $out/node_modules
      cp -R ./node_modules $out

      runHook postInstall
    '';

    dontFixup = true;

    outputHash = "sha256-TIF4APDVS3Kmf22CYQ5/yLDT9XeE/DzHsQBV3jGpArU=";
    outputHashAlgo = "sha256";
    outputHashMode = "recursive";
  };

  nativeBuildInputs = [makeBinaryWrapper];

  dontConfigure = true;
  dontBuild = true;

  installPhase = ''
    runHook preInstall

    mkdir -p $out/lib/konytools
    cp -R src tsconfig.json package.json $out/lib/konytools/
    cp -R ${finalAttrs.node_modules}/node_modules $out/lib/konytools/

    makeBinaryWrapper ${bun}/bin/bun $out/bin/konytools \
      --add-flags "$out/lib/konytools/src/index.ts" \
      --set-default NODE_ENV production

    makeBinaryWrapper ${bun}/bin/bun $out/bin/konytools-reminders \
      --add-flags "$out/lib/konytools/src/reminders.ts" \
      --set-default NODE_ENV production

    makeBinaryWrapper ${bun}/bin/bun $out/bin/konytools-commands \
      --add-flags "$out/lib/konytools/src/commands.ts" \
      --set-default NODE_ENV production

    runHook postInstall
  '';
})
