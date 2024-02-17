import { BrowserView, BrowserWindow, Session, app } from "electron";
import log from "electron-log";
import { VIEW_TARGET } from "../../ipc/ipcConstants";
import { getConfig } from "../config";
import { checkKeys } from "../keyPinning";
import { setApplicationMenu } from "../menus/menuApplication";
import { createContextMenu } from "../menus/menuContext";
import { getWindowConfig } from "../view/windowHelpers";
import { handleBeforeHandle } from "./beforeUnload";

const config = getConfig();

let mailView: undefined | BrowserView = undefined;
let calendarView: undefined | BrowserView = undefined;

export const viewCreatinAppStartup = (session: Session) => {
    const window = createBrowserWindow(session);
    createViews(session);
    configureViews();
    loadMailView(window);

    return window;
};

export const createViews = (session: Session) => {
    const config = getWindowConfig(session);
    mailView = new BrowserView({ ...config });
    calendarView = new BrowserView({ ...config });
};

export const createBrowserWindow = (session: Session) => {
    const window = new BrowserWindow({ ...getWindowConfig(session) });

    setApplicationMenu(app.isPackaged);
    handleBeforeHandle(window);

    window.webContents.on("context-menu", (_e, props) => {
        createContextMenu(props, window).popup();
    });

    window.webContents.session.setCertificateVerifyProc((request, callback) => {
        const callbackValue = checkKeys(request);
        callback(callbackValue);
    });

    return window;
};

export const configureViews = () => {
    mailView.setAutoResize({ width: true, height: true });
    mailView.webContents.loadURL(config.url.mail);

    calendarView.setAutoResize({ width: true, height: true });
    calendarView.webContents.loadURL(config.url.calendar);
};

export const loadMailView = (window: BrowserWindow) => {
    log.info("Loading mail view");
    if (!mailView) {
        log.info("mailView not created");
        return;
    }

    mailView.setBounds({ x: 0, y: 0, width: window.getBounds().width, height: window.getBounds().height });
    window.setBrowserView(mailView);
};

export const loadCalendarView = (window: BrowserWindow) => {
    log.info("Loading calendar view");
    if (!calendarView) {
        log.info("calendarView not created");
        return;
    }

    calendarView.setBounds({ x: 0, y: 0, width: window.getBounds().width, height: window.getBounds().height });
    window.setBrowserView(calendarView);
};

export const updateView = (target: VIEW_TARGET) => {
    if (target === "mail") {
        loadMailView(BrowserWindow.getFocusedWindow());
        return;
    } else if (target === "calendar") {
        loadCalendarView(BrowserWindow.getFocusedWindow());
        return;
    }

    log.info("unsupported view", target);
};

export const getMailView = () => mailView;
export const getCalendarView = () => calendarView;
