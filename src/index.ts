import { Notification, app, session, shell } from "electron";
import log from "electron-log/main";
import { handleIPCCalls } from "./ipc/main";
import { moveUninstaller } from "./macos/uninstall";
import { saveAppID } from "./store/idStore";
import { hasTrialEnded } from "./store/trialStore";
import { saveAppURL } from "./store/urlStore";
import { checkForUpdates } from "./update";
import { ALLOWED_PERMISSIONS, PARTITION } from "./utils/constants";
import {
    isAccoutLite,
    isHostAccount,
    isHostAllowed,
    isHostCalendar,
    isHostMail,
    isMac,
    isUpsellURL,
    isWindows,
    saveWindowsPosition,
} from "./utils/helpers";
import { logURL } from "./utils/logs";
import { handleMailToUrls } from "./utils/urls/mailtoLinks";
import { getTrialEndURL } from "./utils/urls/trial";
import { viewCreatinAppStartup } from "./utils/view/viewManagement";

if (require("electron-squirrel-startup")) {
    app.quit();
}

// Security addition
app.enableSandbox();

// Config initialization
saveAppURL();
saveAppID();

// Log initialization
log.initialize({ preload: true });
log.info("App start is mac:", isMac, "is windows: ", isWindows);

// Move uninstaller on macOS
moveUninstaller();

// Used to make the app run on Parallels Desktop
// app.commandLine.appendSwitch("no-sandbox");

// Detects if the application is default handler for mailto, works on macOS for now
if (app.isDefaultProtocolClient("mailto")) {
    log.info("App is default mailto client");
} else {
    log.info("App is not default mailto client");
}

app.whenReady().then(() => {
    const secureSession = session.fromPartition(PARTITION, {
        cache: false,
    });

    const window = viewCreatinAppStartup(secureSession);
    if (hasTrialEnded()) {
        const url = getTrialEndURL();
        window.loadURL(url);
    }

    // Check updates
    checkForUpdates();

    // Trigger blank notification to force presence in settings
    new Notification();

    // Handle IPC calls coming from the destkop application
    handleIPCCalls();

    // TODO: check if still makes sense to have
    // app.on("activate", () => {
    //     if (BrowserWindow.getAllWindows().filter((windows) => windows.isVisible()).length === 0) {
    //         log.info("Activate app, all windows hidden");
    //         // const window = BrowserWindow.getAllWindows()[0];
    //         // handleMailWindow(window.webContents);
    //     }
    // });

    // Normally this only works on macOS and is not required for Windows
    app.on("open-url", (_e, url) => {
        logURL("open-url", url);
        handleMailToUrls(url);
    });

    // Security addition, reject all permissions except notifications
    secureSession.setPermissionRequestHandler((webContents, permission, callback) => {
        const { host, protocol } = new URL(webContents.getURL());
        if (!isHostAllowed(host) || protocol !== "https:") {
            return callback(false);
        }

        if (ALLOWED_PERMISSIONS.includes(permission)) {
            return callback(true);
        }

        log.info("Permission request rejected", permission);
        callback(false);
    });
});

// Only used on macOS to save the windows position when CMD+Q is used
app.on("before-quit", () => {
    if (isMac) {
        saveWindowsPosition(true);
    }
});

// Security addition
app.on("web-contents-created", (_ev, contents) => {
    const preventDefault = (ev: Electron.Event) => {
        ev.preventDefault();
    };

    contents.on("did-navigate-in-page", (ev, url) => {
        log.info("did-navigate-in-page");
        if (!isHostAllowed(url)) {
            return preventDefault(ev);
        }
    });

    contents.on("will-attach-webview", preventDefault);

    contents.on("will-navigate", (details) => {
        log.info("will-navigate");
        if (!isHostAllowed(details.url) && !global.oauthProcess) {
            return preventDefault(details);
        }

        return details;
    });

    contents.setWindowOpenHandler((details) => {
        const { url } = details;

        if (isHostCalendar(url)) {
            log.info("Open calendar window");
            // handleCalendarWindow(contents);
            return { action: "deny" };
        }

        if (isHostMail(url)) {
            log.info("Open mail window");
            // handleMailWindow(contents);
            return { action: "deny" };
        }

        if (isHostAccount(url)) {
            // Upsell links should be opened in browser to avoid 3D secure issues
            log.info("Account link");
            if (isAccoutLite(url) || isUpsellURL(url)) {
                logURL("Upsell link or lite account, open in browser", url);
                shell.openExternal(url);
                return { action: "deny" };
            }
            return { action: "allow" };
        } else if (isHostAllowed(url)) {
            logURL("Open internal link", url);
            return { action: "allow" };
        } else if (global.oauthProcess) {
            logURL("OAuth Process", url);
            return { action: "allow" };
        } else {
            logURL("Open external link", url);
            shell.openExternal(url);
        }

        return { action: "deny" };
    });
});
