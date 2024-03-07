import type { PropsWithChildren } from 'react';
import { type FC, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { IFRAME_APP_READY_EVENT } from 'proton-pass-extension/app/content/constants.static';
import type {
    IFrameCloseOptions,
    IFrameEndpoint,
    IFrameMessage,
    IFrameMessageWithSender,
    IFramePortMessageHandler,
    IFrameSecureMessage,
} from 'proton-pass-extension/app/content/types';
import { IFrameMessageType } from 'proton-pass-extension/app/content/types';
import locales from 'proton-pass-extension/app/locales';
import { useExtensionActivityProbe } from 'proton-pass-extension/lib/hooks/useExtensionActivityProbe';
import type { Runtime } from 'webextension-polyfill';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { clientReady } from '@proton/pass/lib/client';
import { contentScriptMessage, portForwardingMessage, sendMessage } from '@proton/pass/lib/extension/message';
import browser from '@proton/pass/lib/globals/browser';
import type { FeatureFlagState } from '@proton/pass/store/reducers';
import { INITIAL_SETTINGS, type ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { AppState, Maybe, MaybeNull, RecursivePartial, WorkerMessage } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { safeCall } from '@proton/pass/utils/fp/safe-call';
import { logger } from '@proton/pass/utils/logger';
import { setTtagLocales } from '@proton/shared/lib/i18n/locales';
import noop from '@proton/utils/noop';

type IFrameContextValue = {
    endpoint: string;
    features: RecursivePartial<FeatureFlagState>;
    port: MaybeNull<Runtime.Port>;
    settings: ProxiedSettings;
    userEmail: MaybeNull<string>;
    visible: boolean;
    workerState: Maybe<Omit<AppState, 'UID'>>;
    closeIFrame: (options?: IFrameCloseOptions) => void;
    postMessage: (message: IFrameMessage) => void;
    registerHandler: <M extends IFrameMessage['type']>(type: M, handler: IFramePortMessageHandler<M>) => void;
    resizeIFrame: (height: number) => void;
};

type PortContext = { port: MaybeNull<Runtime.Port>; forwardTo: MaybeNull<string> };

const IFrameContext = createContext<IFrameContextValue>({
    endpoint: '',
    features: {},
    port: null,
    settings: INITIAL_SETTINGS,
    userEmail: null,
    visible: false,
    workerState: undefined,
    closeIFrame: noop,
    postMessage: noop,
    registerHandler: noop,
    resizeIFrame: noop,
});

/* The IFrameContextProvider is responsible for opening a new
 * dedicated port with the service-worker and sending out port-
 * forwarding messages to the content-script's ports. We retrieve
 * the content-script's parent port name through postMessaging */
export const IFrameContextProvider: FC<PropsWithChildren<{ endpoint: IFrameEndpoint }>> = ({ endpoint, children }) => {
    const { i18n } = usePassCore();
    const [{ port, forwardTo }, setPortContext] = useState<PortContext>({ port: null, forwardTo: null });
    const [workerState, setWorkerState] = useState<IFrameContextValue['workerState']>();
    const [settings, setSettings] = useState<ProxiedSettings>(INITIAL_SETTINGS);
    const [features, setFeatures] = useState<RecursivePartial<FeatureFlagState>>({});
    const [userEmail, setUserEmail] = useState<MaybeNull<string>>(null);
    const [visible, setVisible] = useState<boolean>(false);

    const activityProbe = useExtensionActivityProbe(contentScriptMessage);

    const destroyFrame = () => {
        logger.info(`[IFrame::${endpoint}] Unauthorized iframe injection`);

        safeCall(() => port?.disconnect())();
        setPortContext({ port: null, forwardTo: null });

        /* unload the content-script & remove iframe content */
        void sendMessage(contentScriptMessage({ type: WorkerMessageType.UNLOAD_CONTENT_SCRIPT }));
        window.document?.documentElement?.remove();
    };

    useEffect(() => {
        /** Notify the parent content-script that the IFrame is ready and
         * the react app has bootstrapped and rendered. This is essential
         * to avoid relying on the `load` event which does not account for
         * react lifecycle */
        window.parent.postMessage({ type: IFRAME_APP_READY_EVENT, endpoint }, '*');
    }, []);

    /* when processing an `IFRAME_INJECT_PORT` message : verify the
     * `message.key` against the resolved extension key. This avoids
     * malicious websites from trying to spoof our content-script port
     * injection. If we detect a mismatch between the keys : destroy. */
    const handlePortInjection = useCallback(
        async (message: IFrameSecureMessage<IFrameMessageType.IFRAME_INJECT_PORT>) =>
            sendMessage.onSuccess(
                contentScriptMessage({ type: WorkerMessageType.RESOLVE_EXTENSION_KEY }),
                ({ key }) => {
                    if (key !== message.key) return destroyFrame();

                    const framePortName = `${message.payload.port}-${endpoint}`;
                    const port = browser.runtime.connect({ name: framePortName });
                    const forwardTo = message.payload.port;
                    setPortContext({ port, forwardTo });
                }
            ),
        []
    );

    const onPostMessageHandler = useCallback(
        safeCall((event: MessageEvent<Maybe<IFrameSecureMessage>>) => {
            if (
                event.data &&
                event.data?.type === IFrameMessageType.IFRAME_INJECT_PORT &&
                event.data.sender === 'contentscript'
            ) {
                handlePortInjection(event.data).catch(noop);
            }
        }),
        []
    );

    useEffect(() => {
        if (userEmail === null && workerState && clientReady(workerState?.status)) {
            sendMessage
                .onSuccess(
                    contentScriptMessage({ type: WorkerMessageType.RESOLVE_USER }),
                    (response) => response.user?.Email && setUserEmail(response.user.Email)
                )
                .catch(noop);
        }
    }, [workerState, userEmail]);

    useEffect(() => {
        setTtagLocales(locales);
        window.addEventListener('message', onPostMessageHandler);
        return () => window.removeEventListener('message', onPostMessageHandler);
    }, []);

    useEffect(() => {
        if (port && forwardTo) {
            port.onMessage.addListener((message: Maybe<IFrameMessage | WorkerMessage>) => {
                switch (message?.type) {
                    case IFrameMessageType.IFRAME_INIT:
                        setWorkerState(message.payload.workerState);
                        setSettings(message.payload.settings);
                        setFeatures(message.payload.features);
                        /** immediately set the locale on iframe init : the `IFramContextProvider`
                         * does not use the standard `ExtensionApp` wrapper which takes care of
                         * hydrating the initial locale and watching for language changes */
                        i18n.setLocale(message.payload.settings.locale).catch(noop);
                        return;
                    case IFrameMessageType.IFRAME_HIDDEN:
                        return setVisible(false);
                    case IFrameMessageType.IFRAME_OPEN:
                        return setVisible(true);
                    case WorkerMessageType.FEATURE_FLAGS_UPDATE:
                        return setFeatures(message.payload);
                    case WorkerMessageType.SETTINGS_UPDATE:
                        return setSettings(message.payload);
                    case WorkerMessageType.LOCALE_UPDATED:
                        return i18n.setLocale(settings.locale).catch(noop);
                    /* If for any reason we get a `PORT_UNAUTHORIZED`
                     * message : it likely means the iframe was injected
                     * without being controlled by a content-script either
                     * accidentally or intentionnally. Just to be safe, clear
                     * the frame's innerHTML */
                    case WorkerMessageType.PORT_UNAUTHORIZED:
                        return destroyFrame();
                    case WorkerMessageType.WORKER_STATUS:
                        return setWorkerState(message.payload.state);
                }
            });

            port.postMessage(
                portForwardingMessage<IFrameMessageWithSender<IFrameMessageType.IFRAME_CONNECTED>>(forwardTo, {
                    sender: endpoint,
                    type: IFrameMessageType.IFRAME_CONNECTED,
                    payload: { framePort: port.name, id: endpoint },
                })
            );

            port.onDisconnect.addListener(() => {
                setPortContext({ port: null, forwardTo: null });
                window.addEventListener('message', onPostMessageHandler);
            });
        }

        return safeCall(() => port?.disconnect());
    }, [port, forwardTo]);

    /* Every message sent will be forwarded to the content-script
     * through the worker's MessageBroker.
     * see `@proton/pass/lib/extension/message/message-broker` */
    const postMessage = useCallback(
        (rawMessage: IFrameMessage) => {
            try {
                port?.postMessage(
                    portForwardingMessage<IFrameMessageWithSender>(forwardTo!, {
                        ...rawMessage,
                        sender: endpoint,
                    })
                );
            } catch (_) {}
        },
        [port, forwardTo]
    );

    const closeIFrame = useCallback(
        (payload: IFrameCloseOptions = {}) => postMessage({ type: IFrameMessageType.IFRAME_CLOSE, payload }),
        [postMessage]
    );

    const resizeIFrame = useCallback(
        (height: number) => {
            if (height > 0) postMessage({ type: IFrameMessageType.IFRAME_DIMENSIONS, payload: { height } });
        },
        [postMessage]
    );

    const registerHandler = useCallback(
        <M extends IFrameMessage['type']>(type: M, handler: IFramePortMessageHandler<M>) => {
            const onMessageHandler = (message: Maybe<IFrameMessageWithSender>) =>
                message?.type === type &&
                message.sender === 'contentscript' &&
                handler(message as IFrameMessageWithSender<M>);

            port?.onMessage.addListener(onMessageHandler);
            return () => port?.onMessage.removeListener(onMessageHandler);
        },
        [port]
    );

    useEffect(() => {
        if (visible) activityProbe.start();
        else activityProbe.cancel();
    }, [visible]);

    const context = useMemo<IFrameContextValue>(
        () => ({
            endpoint,
            features,
            port,
            settings,
            userEmail,
            visible,
            workerState,
            closeIFrame,
            postMessage,
            registerHandler,
            resizeIFrame,
        }),
        [
            features,
            port,
            settings,
            userEmail,
            visible,
            workerState,
            closeIFrame,
            postMessage,
            registerHandler,
            resizeIFrame,
        ]
    );

    return <IFrameContext.Provider value={context}>{children}</IFrameContext.Provider>;
};

export const useIFrameContext = () => useContext(IFrameContext);

export const useRegisterMessageHandler = <M extends IFrameMessage['type']>(
    type: M,
    handler: IFramePortMessageHandler<M>
) => {
    const { registerHandler } = useIFrameContext();
    useEffect(() => registerHandler(type, handler), [type, handler, registerHandler]);
};
