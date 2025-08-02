import Gio from "gi://Gio";
import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import { ExtensionPreferences, gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";
import Gdk from "gi://Gdk";

export default class GameModePreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    window._settings = this.getSettings();

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
      },
      {
        title: _("Enable Do Not Disturb Mode"),
        subtitle: _("Automatically enable Do Not Disturb mode when GameMode is active"),
        setting: 'enable-do-not-disturb'
      }
    ];

    rows.forEach(({ title, subtitle, setting }) => {
      const row = new Adw.SwitchRow({ title, subtitle });
      group.add(row);
      window._settings.bind(setting, row, 'active', Gio.SettingsBindFlags.DEFAULT);
    });

    const colorGroup = new Adw.PreferencesGroup({
      title: _("Color Settings"),
      description: _("Configure the colors of the GameMode indicator"),
    });
    page.add(colorGroup);

    const activeColorRow = new Adw.ActionRow({
      title: _("Active Color"),
      subtitle: _("Color when GameMode is active"),
    });

    const activeColorBtn = new Gtk.ColorButton({
      use_alpha: false,
      valign: Gtk.Align.CENTER,
    });

    const activeColor = window._settings.get_string("active-color");
    const [ar, ag, ab] = this._parseRGBColor(activeColor);
    const activeRgba = new Gdk.RGBA();
    activeRgba.red = ar;
    activeRgba.green = ag;
    activeRgba.blue = ab;
    activeRgba.alpha = 1.0;
    activeColorBtn.set_rgba(activeRgba);

    activeColorBtn.connect('color-set', () => {
      const rgba = activeColorBtn.get_rgba();
      const colorStr = `rgb(${Math.floor(rgba.red * 255)},${Math.floor(rgba.green * 255)},${Math.floor(rgba.blue * 255)})`;
      window._settings.set_string("active-color", colorStr);
    });

    activeColorRow.add_suffix(activeColorBtn);
    colorGroup.add(activeColorRow);

    const inactiveColorRow = new Adw.ActionRow({
      title: _("Inactive Color"),
      subtitle: _("Color when GameMode is inactive"),
    });

    const inactiveColorBtn = new Gtk.ColorButton({
      use_alpha: false,
      valign: Gtk.Align.CENTER,
    });

    const inactiveColor = window._settings.get_string("inactive-color");
    const [ir, ig, ib] = this._parseRGBColor(inactiveColor);
    const inactiveRgba = new Gdk.RGBA();
    inactiveRgba.red = ir;
    inactiveRgba.green = ig;
    inactiveRgba.blue = ib;
    inactiveRgba.alpha = 1.0;
    inactiveColorBtn.set_rgba(inactiveRgba);

    inactiveColorBtn.connect('color-set', () => {
      const rgba = inactiveColorBtn.get_rgba();
      const colorStr = `rgb(${Math.floor(rgba.red * 255)},${Math.floor(rgba.green * 255)},${Math.floor(rgba.blue * 255)})`;
      window._settings.set_string("inactive-color", colorStr);
    });

    inactiveColorRow.add_suffix(inactiveColorBtn);
    colorGroup.add(inactiveColorRow);
  }

  _parseRGBColor(colorStr) {
    const match = colorStr.match(/rgb\((\d+),(\d+),(\d+)\)/);
    if (match) {
      return [
        parseInt(match[1]) / 255,
        parseInt(match[2]) / 255,
        parseInt(match[3]) / 255
      ];
    }
    return [1, 1, 1]; // Default to white
  }
}
