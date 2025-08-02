import GObject from "gi://GObject";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import St from "gi://St";
import {
  Extension,
  gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as MessageTray from "resource:///org/gnome/shell/ui/messageTray.js";
import * as GameMode from "./client.js";

class DoNotDisturbManager {
  constructor() {
    this._settings = null;
  }

  getSettings() {
    if (!this._settings) {
      this._settings = new Gio.Settings({ schema_id: "org.gnome.desktop.notifications" });
    }
    return this._settings;
  }

  turnDndOn() {
    this.getSettings().set_boolean("show-banners", false);
  }

  turnDndOff() {
    this.getSettings().set_boolean("show-banners", true);
  }

  dispose() {
    this._settings = null;
  }
}

const Indicator = GObject.registerClass(
  class Indicator extends PanelMenu.Button {
    _init(extension, settings) {
      super._init(0.0, _("GameMode Status Indicator"));
      this._extension = extension;
      this._settings = settings;
      this._client = null;
      this._dndManager = new DoNotDisturbManager();
      this._dndTimeoutId = null;

      this._addIcon();
      this._createMenuItems();
      this._initializeClient();
      this._observeSettings();
    }

    _addIcon() {
      this._icon = new St.Icon({
        icon_name: "applications-games-symbolic",
        style_class: "system-status-icon",
      });
      this.add_child(this._icon);

      const inactiveColor = this._settings.get_string("inactive-color");
      this._icon.set_style('color: ' + inactiveColor + ';');

      if (this._settings.get_boolean("show-icon-only-when-active")) {
        this.visible = false;
      }
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
      this._addVisibilitySettings();
      this._addPreferencesButton();
    }

    _initializeClient() {
      try {
        this._client = new GameMode.Client(null);
        this._client.connect(
          "count-changed",
          this._updateClientList.bind(this)
        );
        this._client.connect(
          "game-registered",
          this._updateClientList.bind(this)
        );
        this._client.connect(
          "game-unregistered",
          this._updateClientList.bind(this)
        );
        this._client.connect(
          "state-changed",
          this._handleStatusChange.bind(this)
        );
      } catch (e) {
        this._handleClientInitializationError();
      }
      if (!this._client) this._handleClientInitializationError();
    }

    _addNotificationSettings() {
      const notificationSection = new PopupMenu.PopupSubMenuMenuItem(
        _("Show Notification when:")
      );
      this.menu.addMenuItem(notificationSection);

      this._notificationLaunchToggle = new PopupMenu.PopupSwitchMenuItem(
        _("GameMode is Enabled"),
        this._settings.get_boolean("show-launch-notification")
      );
      this._notificationLaunchToggle.connect("toggled", (item, value) => {
        this._settings.set_boolean("show-launch-notification", value);
      });
      notificationSection.menu.addMenuItem(this._notificationLaunchToggle);

      this._notificationCloseToggle = new PopupMenu.PopupSwitchMenuItem(
        _("GameMode is Disabled"),
        this._settings.get_boolean("show-close-notification")
      );
      this._notificationCloseToggle.connect("toggled", (item, value) => {
        this._settings.set_boolean("show-close-notification", value);
      });
      notificationSection.menu.addMenuItem(this._notificationCloseToggle);

      notificationSection.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

      this._doNotDisturbToggle = new PopupMenu.PopupSwitchMenuItem(
        _("Enable Do Not Disturb Mode"),
        this._settings.get_boolean("enable-do-not-disturb")
      );
      this._doNotDisturbToggle.connect("toggled", (item, value) => {
        this._settings.set_boolean("enable-do-not-disturb", value);
      });
      notificationSection.menu.addMenuItem(this._doNotDisturbToggle);
    }

    _addVisibilitySettings() {
      const visibilitySection = new PopupMenu.PopupSubMenuMenuItem(
        _("Visibility Settings")
      );
      this.menu.addMenuItem(visibilitySection);

      this._iconVisibilityToggle = new PopupMenu.PopupSwitchMenuItem(
        _("Show Icon Only When Active"),
        this._settings.get_boolean("show-icon-only-when-active")
      );
      this._iconVisibilityToggle.connect("toggled", (item, value) => {
        this._settings.set_boolean("show-icon-only-when-active", value);
      });
      visibilitySection.menu.addMenuItem(this._iconVisibilityToggle);

      const colorSettingsItem = new PopupMenu.PopupMenuItem(_("Color Settings"));
      this.menu.addMenuItem(colorSettingsItem);
      colorSettingsItem.connect('activate', () => {
        this._extension.openPreferences();
      });
    }

    _addPreferencesButton() {
      this.menu.addAction(_("Settings Menu"), () => {
        this._extension.openPreferences();
      });
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
      const isActive = this._client.current_state;

      if (isActive) {
        this._statusItem.label.set_text(_("GameMode is On"));
        
        if (this._settings.get_boolean("show-launch-notification")) {
          Main.notify(_("GameMode Status"), _("GameMode is Enabled!"));
        }
        
        if (this._settings.get_boolean("enable-do-not-disturb")) {
          this._scheduleDoNotDisturbActivation();
        }
      } else {
        this._statusItem.label.set_text(_("GameMode is Off"));
        
        this._clearDoNotDisturbTimeout();
        
        if (this._settings.get_boolean("enable-do-not-disturb")) {
          this._disableDoNotDisturb();
        }
        
        if (this._settings.get_boolean("show-close-notification")) {
          Main.notify(_("GameMode Status"), _("GameMode is Disabled!"));
        }
      }
      
      this._updateIcon(isActive);
    }

    _scheduleDoNotDisturbActivation() {
      this._clearDoNotDisturbTimeout();
      
      // schedule DND activation with a small delay to allow the gamemode enabled notification to be shown
      this._dndTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
        if (!this._destroyed) {
          this._enableDoNotDisturb();
        }
        this._dndTimeoutId = null;
        return false;
      });
    }

    _clearDoNotDisturbTimeout() {
      if (this._dndTimeoutId) {
        GLib.source_remove(this._dndTimeoutId);
        this._dndTimeoutId = null;
      }
    }

    _enableDoNotDisturb() {
      try {
        if (this._destroyed) return;
        
        const currentShowBanners = this._dndManager.getSettings().get_boolean("show-banners");
        if (currentShowBanners) {
          // only change if it's not already in DND mode
          this._previousShowBannersState = currentShowBanners;
          this._extensionModifiedDoNotDisturb = true;
          this._dndManager.turnDndOn();
        }
      } catch (e) {
        console.log(`GameMode Extension: Failed to enable Do Not Disturb mode: ${e.message}`);
      }
    }

    _disableDoNotDisturb() {
      try {
        if (this._destroyed) return;
        
        if (this._extensionModifiedDoNotDisturb && this._previousShowBannersState !== undefined) {
          this._dndManager.getSettings().set_boolean("show-banners", this._previousShowBannersState);
          this._previousShowBannersState = undefined;
          this._extensionModifiedDoNotDisturb = false;
        }
      } catch (e) {
        console.log(`GameMode Extension: Failed to disable Do Not Disturb mode: ${e.message}`);
      }
    }

    _observeSettings() {
      this._settings.connect("changed::show-icon-only-when-active", () => {
        const iconVisibilitySetting = this._settings.get_boolean(
          "show-icon-only-when-active"
        );
        this._iconVisibilityToggle.setToggleState(iconVisibilitySetting);
        this.visible = !iconVisibilitySetting;
      });
      
      this._settings.connect("changed::show-launch-notification", () => {
        const showLaunchNotification = this._settings.get_boolean(
          "show-launch-notification"
        );
        this._notificationLaunchToggle.setToggleState(showLaunchNotification);
      });
      
      this._settings.connect("changed::show-close-notification", () => {
        const showCloseNotification = this._settings.get_boolean(
          "show-close-notification"
        );
        this._notificationCloseToggle.setToggleState(showCloseNotification);
      });
      
      this._settings.connect("changed::active-color", () => {
        if (this._client && this._client.current_state) {
          const activeColor = this._settings.get_string("active-color");
          this._icon.set_style('color: ' + activeColor + ';');
        }
      });
      
      this._settings.connect("changed::inactive-color", () => {
        if (this._client && !this._client.current_state) {
          const inactiveColor = this._settings.get_string("inactive-color");
          this._icon.set_style('color: ' + inactiveColor + ';');
        }
      });
      
      this._settings.connect("changed::enable-do-not-disturb", () => {
        const enableDoNotDisturb = this._settings.get_boolean("enable-do-not-disturb");
        this._doNotDisturbToggle.setToggleState(enableDoNotDisturb);

        if (this._client && this._client.current_state) {
          if (enableDoNotDisturb) {
            this._scheduleDoNotDisturbActivation();
          } else {
            this._clearDoNotDisturbTimeout();
            this._disableDoNotDisturb();
          }
        }
      });
    }

    _updateIcon(isActive) {
      const activeColor = this._settings.get_string("active-color");
      const inactiveColor = this._settings.get_string("inactive-color");
      
      this._icon.set_style('color: ' + (isActive ? activeColor : inactiveColor) + ';');
      
      const showIconOnlyWhenActive = this._settings.get_boolean(
        "show-icon-only-when-active"
      );

      this.visible = !showIconOnlyWhenActive || isActive;
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

    destroy() {
      this._clearDoNotDisturbTimeout();

      // restore DND state if it is modified by the extension
      if (this._extensionModifiedDoNotDisturb && this._previousShowBannersState !== undefined) {
        try {
          this._dndManager.getSettings().set_boolean("show-banners", this._previousShowBannersState);
        } catch (e) {
          log(`GameMode Extension: Failed to restore Do Not Disturb state: ${e.message}`);
        }
      }
      
      if (this._dndManager) {
        this._dndManager.dispose();
      }
      
      this._destroyed = true;
      super.destroy();
    }
  }
);

export default class GameModeShellExtension extends Extension {
  enable() {
    this._settings = this.getSettings();
    this._indicator = new Indicator(this, this._settings);
    Main.panel.addToStatusArea(this.uuid, this._indicator);
  }

  disable() {
    this._indicator.destroy();
    this._indicator = null;
    this._settings = null;
  }
}