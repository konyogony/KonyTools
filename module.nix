{
  config,
  lib,
  pkgs,
  ...
}: let
  cfg = config.services.konytools;

  env = lib.filterAttrs (_: v: v != null) {
    CLIENT_ID = cfg.clientId;
    DISCORD_TOKEN =
      if cfg.discordTokenFile != null
      then "@DISCORD_TOKEN@"
      else null;
    GEMINI_API_KEY =
      if cfg.geminiKeyFile != null
      then "@GEMINI_API_KEY@"
      else null;
    CLOUDFLARE_ACCOUNT_ID = cfg.cloudflareAccountId;
    CLOUDFLARE_API_KEY =
      if cfg.cloudflareKeyFile != null
      then "@CLOUDFLARE_API_KEY@"
      else null;
  };

  setupScript = pkgs.writeShellApplication {
    name = "konytools-setup";
    runtimeInputs = with pkgs; [coreutils replace-secret];
    text = ''
      install -Dm640 -o konytools -g konytools ${pkgs.writeText "konytools.env" (lib.generators.toKeyValue {} env)} /var/lib/konytools/.env

      ${lib.optionalString (cfg.discordTokenFile != null) ''
        replace-secret '@DISCORD_TOKEN@' ${lib.escapeShellArg cfg.discordTokenFile} /var/lib/konytools/.env
      ''}

      ${lib.optionalString (cfg.geminiKeyFile != null) ''
        replace-secret '@GEMINI_API_KEY@' ${lib.escapeShellArg cfg.geminiKeyFile} /var/lib/konytools/.env
      ''}

      ${lib.optionalString (cfg.cloudflareKeyFile != null) ''
        replace-secret '@CLOUDFLARE_API_KEY@' ${lib.escapeShellArg cfg.cloudflareKeyFile} /var/lib/konytools/.env
      ''}

      ${cfg.package}/bin/konytools-migrate
    '';
  };

  cfgService = {
    User = "konytools";
    Group = "konytools";
    WorkingDirectory = cfg.package;
    StateDirectory = "konytools";
    EnvironmentFile = "/var/lib/konytools/.env";
  };
in {
  options.services.konytools = {
    enable = lib.mkEnableOption "konytools";

    package = lib.mkOption {
      type = lib.types.package;
      default = pkgs.konytools;
      defaultText = "pkgs.konytools";
      description = "The konytools package to use";
    };

    clientId = lib.mkOption {
      type = lib.types.str;
    };

    discordTokenFile = lib.mkOption {
      type = lib.types.nullOr lib.types.path;
      default = null;
    };

    geminiKeyFile = lib.mkOption {
      type = lib.types.nullOr lib.types.path;
      default = null;
    };

    cloudflareAccountId = lib.mkOption {
      type = lib.types.str;
    };

    cloudflareKeyFile = lib.mkOption {
      type = lib.types.nullOr lib.types.path;
      default = null;
    };
  };

  config = lib.mkIf cfg.enable {
    systemd.services.konytools-setup = {
      description = "konytools setup";
      after = ["network-online.target"];
      wants = ["network-online.target"];
      wantedBy = ["multi-user.target"];
      restartTriggers = [cfg.package];

      serviceConfig = {
        Type = "oneshot";
        ExecStart = lib.getExe setupScript;
        RemainAfterExit = true;
        StateDirectory = "konytools";
      };
    };

    systemd.services.konytools = {
      description = "konytools";
      after = ["network-online.target" "konytools-setup.service"];
      wants = ["network-online.target"];
      requires = ["konytools-setup.service"];
      wantedBy = ["multi-user.target"];

      serviceConfig =
        cfgService
        // {
          ExecStart = "${cfg.package}/bin/konytools";
          Restart = "on-failure";
        };
    };

    systemd.services.konytools-commands = {
      description = "konytools command registration";
      after = ["network-online.target" "konytools-setup.service"];
      wants = ["network-online.target"];
      requires = ["konytools-setup.service"];
      wantedBy = ["multi-user.target"];
      restartTriggers = [cfg.package];

      serviceConfig =
        cfgService
        // {
          Type = "oneshot";
          RemainAfterExit = true;
          ExecStart = "${cfg.package}/bin/konytools-commands";
        };
    };

    systemd.services.konytools-reminders = {
      description = "konytools reminder check";
      after = ["network-online.target" "konytools-setup.service"];
      wants = ["network-online.target"];
      requires = ["konytools-setup.service"];

      serviceConfig =
        cfgService
        // {
          Type = "oneshot";
          ExecStart = "${cfg.package}/bin/konytools-reminders";
        };
    };

    systemd.timers.konytools-reminders = {
      description = "konytools reminders timer";
      wantedBy = ["timers.target"];
      restartTriggers = [cfg.package];

      timerConfig = {
        OnCalendar = "minutely";
        Persistent = true;
      };
    };

    users.users."konytools" = {
      isSystemUser = true;
      group = "konytools";
    };

    users.groups."konytools" = {};
  };
}
