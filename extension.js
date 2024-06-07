import GObject from "gi://GObject";
const { Gio, St } = imports.gi;

import {
  Extension,
  gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as GameMode from "./client.js";

const Indicator = GObject.registerClass(
  class Indicator extends PanelMenu.Button {
    _init(settings) {
      super._init(0.0, _("My Shiny Indicator"));
      this._settings = settings;
      this._client = null;

      this._addIcon();
      this._createMenuItems();
      this._initializeClient();
    }

    _addIcon() {
      this._icon = new St.Icon({
        icon_name: "applications-games",
        style_class: "system-status-icon",
      });
      this.add_child(this._icon);
    }

    _createMenuItems() {
      this._statusItem = new PopupMenu.PopupMenuItem(_("GameMode is Off"));
      this._statusItem.actor.reactive = false;
      this.menu.addMenuItem(this._statusItem, 0);
      this._statusItem.actor.add_style_class_name("status-item");

      this._clientSection = new PopupMenu.PopupSubMenuMenuItem(
        _("Active Clients: 0")
      );
      this.menu.addMenuItem(this._clientSection);
      this._addNotificationSettings();
    }

    _addNotificationSettings() {
      const notificationSection = new PopupMenu.PopupSubMenuMenuItem(
        _("Show Notification when:")
      );
      this.menu.addMenuItem(notificationSection);

      this._notificationLaunchToggle = new PopupMenu.PopupSwitchMenuItem(
        _("Gamemode is Enabled"),
        this._settings.showLaunchNotification
      );
      this._notificationLaunchToggle.connect("toggled", (item, value) => {
        this._settings.showLaunchNotification = value;
      });
      notificationSection.menu.addMenuItem(this._notificationLaunchToggle);

      this._notificationCloseToggle = new PopupMenu.PopupSwitchMenuItem(
        _("Gamemode is Disabled"),
        this._settings.showCloseNotification
      );
      this._notificationCloseToggle.connect("toggled", (item, value) => {
        this._settings.showCloseNotification = value;
      });
      notificationSection.menu.addMenuItem(this._notificationCloseToggle);
    }

    _initializeClient() {
      try {
        this._client = new GameMode.Client(null);
        this._client.connect("count-changed", () => {});
        this._client.connect("game-registered", (pid, objectPath) => {
          this._updateClientList();
        });
        this._client.connect("game-unregistered", (pid, objectPath) => {
          this._updateClientList();
        });
        this._client.connect("state-changed", () => {
          this._handleStatusChange();
        });
      } catch (e) {
        this._handleClientInitializationError();
      }
      if (!this._client) this._handleClientInitializationError();
    }

    _handleClientInitializationError() {
      this._client = null;
      const unavailableItem = new PopupMenu.PopupMenuItem(
        _("GameMode is Not Available! Refer to GitHub to Install.")
      );
      unavailableItem.actor.add_style_class_name("unavailable-text");
      this.menu.addMenuItem(unavailableItem, 0);
      this.menu._getMenuItems().forEach((item) => {
        if (item !== unavailableItem) item.setSensitive(false);
      });
      unavailableItem.connect("activate", () => {
        Gio.app_info_launch_default_for_uri(
          "https://github.com/FeralInteractive/gamemode",
          null
        );
      });
    }

    _handleStatusChange() {
      if (this._client.current_state) {
        this._statusItem.label.set_text(_("GameMode is On"));
        if (this._settings.showLaunchNotification) {
          Main.notify(_("GameMode is Enabled!"));
        }
      } else {
        this._statusItem.label.set_text(_("GameMode is Off"));
        if (this._settings.showCloseNotification) {
          Main.notify(_("GameMode is Disabled!"));
        }
      }
      this._updateIcon(this._client.current_state);
    }

    _updateIcon(isActive) {
      if (isActive) {
        this._icon.add_style_class_name("gamemode-active");
      } else {
        this._icon.remove_style_class_name("gamemode-active");
      }
    }

    _updateClientList() {
      this._clientSection.menu.removeAll();

      if (!this._client || !this._client.process_map) {
        this._clientSection.label.set_text(_("Active Clients: 0"));
        return;
      }

      const clientCount = this._client.process_map.size;
      this._clientSection.label.set_text(
        _("Active Clients: " + (clientCount || 0))
      );

      this._client.process_map.forEach((client, index) => {
        const clientItem = new PopupMenu.PopupMenuItem(
          `Client ${index}: ${client.name}`
        );
        this._clientSection.menu.addMenuItem(clientItem);
      });
    }
  }
);

export default class IndicatorExampleExtension extends Extension {
  enable() {
    this._settings = {
      showLaunchNotification: true,
      showCloseNotification: true,
    };
    this._indicator = new Indicator(this._settings);
    Main.panel.addToStatusArea(this.uuid, this._indicator);
  }

  disable() {
    this._indicator.destroy();
    this._indicator = null;
  }
}