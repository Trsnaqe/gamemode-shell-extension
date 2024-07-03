import Gio from "gi://Gio";
import Adw from "gi://Adw";
import { ExtensionPreferences, gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

export default class GameModePreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    window._settings = this.getSettings();

    // Create and add a preferences page with a single group
    const page = new Adw.PreferencesPage({
      title: _("General"),
      icon_name: "dialog-information-symbolic",
    });
    window.add(page);

    const group = new Adw.PreferencesGroup({
      title: _("Game Mode Settings"),
      description: _("Configure the behaviour of Game Mode Extension"),
    });
    page.add(group);

    // Create preferences rows
    const rows = [
      {
        title: _("GameMode Enabled Notification"),
        subtitle: _("Show notification when GameMode is enabled"),
        setting: 'show-launch-notification'
      },
      {
        title: _("GameMode Disabled Notification"),
        subtitle: _("Show notification when GameMode is disabled"),
        setting: 'show-close-notification'
      },
      {
        title: _("Show Icon Only When Active"),
        subtitle: _("Whether to always show the indicator"),
        setting: 'show-icon-only-when-active'
      }
    ];

    // Add rows to the group and bind settings
    rows.forEach(({ title, subtitle, setting }) => {
      const row = new Adw.SwitchRow({ title, subtitle });
      group.add(row);
      window._settings.bind(setting, row, 'active', Gio.SettingsBindFlags.DEFAULT);
    });
  }
}
