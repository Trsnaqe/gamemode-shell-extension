import Gio from "gi://Gio";
import GLib from "gi://GLib";
import { EventEmitter } from "resource:///org/gnome/shell/misc/signals.js";

const GameModeClientInterface = `
<node>
  <interface name="com.feralinteractive.GameMode">
    <property name="ClientCount" type="i" access="read"></property>
    <method name="RegisterGame">
      <arg type="i" name="pid" direction="in"></arg>
      <arg type="i" name="status" direction="out"></arg>
    </method>
    <method name="UnregisterGame">
      <arg type="i" name="pid" direction="in"></arg>
      <arg type="i" name="status" direction="out"></arg>
    </method>
    <method name="ListGames">
      <arg type="a(io)" name="pids" direction="out"></arg>
    </method>
    <signal name="GameRegistered">
      <arg type="i" name="pid" direction="out"></arg>
      <arg type="o" name="objectPath" direction="out"></arg>
    </signal>
    <signal name="GameUnregistered">
      <arg type="i" name="pid" direction="out"></arg>
      <arg type="o" name="objectPath" direction="out"></arg>
    </signal>
  </interface>
</node>`;

const GAMEMODE_DBUS_NAME = "com.feralinteractive.GameMode";
const GAMEMODE_DBUS_PATH = "/com/feralinteractive/GameMode";
const GAMEMODE_DBUS_IFACE = "com.feralinteractive.GameMode";

export class Client extends EventEmitter {
  constructor(readyCallback) {
    super();
    this._readyCallback = readyCallback;
    this._proxy = null;
    this.process_map = new Map();
    this.client_count = 0;
    this.current_state = false;
    this._initializeProxy();
  }

  _initializeProxy() {
    const nodeInfo = Gio.DBusNodeInfo.new_for_xml(GameModeClientInterface);
    Gio.DBusProxy.new(
      Gio.DBus.session,
      Gio.DBusProxyFlags.DO_NOT_AUTO_START,
      nodeInfo.lookup_interface(GAMEMODE_DBUS_IFACE),
      GAMEMODE_DBUS_NAME,
      GAMEMODE_DBUS_PATH,
      GAMEMODE_DBUS_IFACE,
      null,
      this._onProxyReady.bind(this)
    );
  }

  _onProxyReady(o, res) {
    try {
      this._proxy = Gio.DBusProxy.new_finish(res);
      this._connectSignals();
      this._updateClientCount();
      if (this._readyCallback) this._readyCallback(this);
    } catch (e) {
      console.log(`Failed to initialize GameMode client: ${e.message}`);
    }
  }

  _connectSignals() {
    this._propsChangedId = this._proxy.connect(
      "g-properties-changed",
      this._onPropertiesChanged.bind(this)
    );
    this._registeredId = this._proxy.connectSignal(
      "GameRegistered",
      this._onGameRegistered.bind(this)
    );
    this._unregisteredId = this._proxy.connectSignal(
      "GameUnregistered",
      this._onGameUnregistered.bind(this)
    );
  }

  _updateClientCount() {
    this.client_count = this._proxy.ClientCount || 0;
    if (this.client_count > 0) {
      this.emit("state-changed", true);
      this.emit("count-changed", this.client_count);
    }
  }

  async _onGameRegistered(proxy, sender_name, [pid, objectPath]) {
    const process_name = await this._getProcessNameByPid(pid);
    if (process_name)
      this.process_map.set(pid, { name: process_name, path: objectPath });
    this.emit("game-registered", pid, objectPath);
  }

  _onGameUnregistered(proxy, sender_name, [pid, objectPath]) {
    this.process_map.delete(pid);
    this.emit("game-unregistered", pid, objectPath);
  }

  _onPropertiesChanged(proxy, properties) {
    const props = properties.deep_unpack();
    if (props.ClientCount !== undefined) {
      const previous_count = this.client_count;
      // Extract the integer from the GLib.Variant
      this.client_count = props.ClientCount.deep_unpack();
      this._emitStateChange(previous_count);
    }
  }

  _emitStateChange(previous_count) {
    const previous_state = previous_count > 0;
    this.current_state = this.client_count > 0;

    if (previous_state !== this.current_state) {
      this.emit("state-changed");
    }

    if (previous_count !== this.client_count) {
      this.emit("count-changed", this.client_count);
    }
  }

  close() {
    this.disconnectAll();
    if (this._proxy) {
      this._proxy.disconnect(this._propsChangedId);
      this._proxy.disconnectSignal(this._registeredId);
      this._proxy.disconnectSignal(this._unregisteredId);
      this._proxy = null;
    }
  }

  get clientCount() {
    return this._proxy ? this._proxy.ClientCount : 0;
  }

  get isActive() {
    return this.clientCount > 0;
  }

  registerGame(pid, callback) {
    this._proxy.RegisterGameRemote(pid, (res, err) => {
      if (err) {
        callback(-2, err);
        return;
      }
      const [status] = res;
      callback(status, null);
    });
  }

  unregisterGame(pid, callback) {
    this._proxy.UnregisterGameRemote(pid, (res, err) => {
      if (err) {
        callback(-2, err);
        return;
      }
      const [status] = res;
      callback(status, null);
    });
  }

  getGames(callback) {
    this._proxy.ListGamesRemote((res, err) => {
      if (err) {
        callback(null, err);
        return;
      }
      callback(res, null);
    });
  }

  async _getProcessNameByPid(pid) {
    try {
      const subprocess = new Gio.Subprocess({
        argv: ["ps", "-p", pid.toString(), "-o", "comm="],
        flags:
          Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
      });
      await subprocess.init(null);

      const stdout = await new Promise((resolve, reject) => {
        subprocess.communicate_utf8_async(null, null, (proc, res) => {
          try {
            const [, out] = proc.communicate_utf8_finish(res);
            resolve(out);
          } catch (e) {
            reject(e);
          }
        });
      });

      return stdout.trim() || null;
    } catch (e) {
      console.log(`Error getting process name for PID ${pid}: ${e.message}`);
    }
    return null;
  }
}
