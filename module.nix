{
  config,
  lib,
  pkgs,
  ...
}: let
  cfg = config.services.konytools;
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
  };

  config = lib.mkIf cfg.enable {
    systemd.services.konytools = {
      description = "konytools";
      after = ["network-online.target"];
      wants = ["network-online.target"];
      wantedBy = ["multi-user.target"];

      serviceConfig = {
        ExecStart = "${cfg.package}/bin/konytools";
        User = "konytools";
        Group = "konytools";
        Restart = "on-failure";
        WorkingDirectory = cfg.package;
        StateDirectory = "konytools";
        Environment = "CLIENT_ID=${cfg.clientId}";
        LoadCredential =
          (lib.optional (cfg.discordTokenFile != null) "DISCORD_TOKEN:${cfg.discordTokenFile}")
          ++ (lib.optional (cfg.geminiKeyFile != null) "GEMINI_API_KEY:${cfg.geminiKeyFile}");
      };
    };

    systemd.services.konytools-commands = {
      description = "konytools command registration";
      after = ["network-online.target"];
      wants = ["network-online.target"];
      wantedBy = ["multi-user.target"];
      restartTriggers = [cfg.package];

      serviceConfig = {
        Type = "oneshot";
        RemainAfterExit = true;
        ExecStart = "${cfg.package}/bin/konytools-commands";
        User = "konytools";
        Group = "konytools";
        WorkingDirectory = cfg.package;
        StateDirectory = "konytools";
        Environment = "CLIENT_ID=${cfg.clientId}";
        LoadCredential =
          lib.optional (cfg.discordTokenFile != null) "DISCORD_TOKEN:${cfg.discordTokenFile}";
      };
    };

    systemd.services.konytools-reminders = {
      description = "konytools reminder check";
      after = ["network-online.target"];
      wants = ["network-online.target"];

      serviceConfig = {
        Type = "oneshot";
        ExecStart = "${cfg.package}/bin/konytools-reminders";
        User = "konytools";
        Group = "konytools";
        WorkingDirectory = cfg.package;
        StateDirectory = "konytools";
        LoadCredential =
          lib.optional (cfg.discordTokenFile != null) "DISCORD_TOKEN:${cfg.discordTokenFile}";
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
