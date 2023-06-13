import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { MessageWithSenderFactory } from '@proton/pass/extension/message';
import { sendMessage } from '@proton/pass/extension/message';
import { selectWorkerAlive } from '@proton/pass/store';
import { sessionLockImmediate, signout, syncIntent } from '@proton/pass/store/actions';
import type { ExtensionEndpoint, MaybeNull, TabId, WorkerMessageWithSender, WorkerState } from '@proton/pass/types';
import { WorkerMessageType, WorkerStatus } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { workerReady } from '@proton/pass/utils/worker';
import { DEFAULT_LOCALE } from '@proton/shared/lib/constants';
import { setUID as setSentryUID } from '@proton/shared/lib/helpers/sentry';
import { loadLocale } from '@proton/shared/lib/i18n/loadLocale';
import { setTtagLocales } from '@proton/shared/lib/i18n/locales';
import noop from '@proton/utils/noop';

import locales from '../../../app/locales';
import { INITIAL_WORKER_STATE } from '../../constants';
import { ExtensionContext, type ExtensionContextType } from '../../extension';

export interface ExtensionAppContextValue {
    context: MaybeNull<ExtensionContextType>;
    state: WorkerState;
    ready: boolean;
    logout: (options: { soft: boolean }) => void;
    lock: () => void;
    sync: () => void;
}

export const ExtensionAppContext = createContext<ExtensionAppContextValue>({
    context: null,
    state: INITIAL_WORKER_STATE,
    ready: false,
    logout: noop,
    lock: noop,
    sync: noop,
});

const setup = async (options: {
    tabId: TabId;
    endpoint: ExtensionEndpoint;
    messageFactory: MessageWithSenderFactory;
}): Promise<WorkerState> => {
    setTtagLocales(locales);
    await loadLocale(DEFAULT_LOCALE, locales);

    return sendMessage.on(
        options.messageFactory({
            type: WorkerMessageType.WORKER_WAKEUP,
            payload: { tabId: options.tabId },
        }),
        (response) => {
            if (response.type === 'success') return response;
            throw new Error('extension wake-up failure');
        }
    );
};

type ExtensionContextProviderProps<T extends ExtensionEndpoint> = {
    endpoint: T;
    messageFactory: MessageWithSenderFactory;
    onWorkerMessage?: (message: WorkerMessageWithSender) => void;
    children: React.ReactNode;
};

export const ExtensionContextProvider = <T extends ExtensionEndpoint>({
    endpoint,
    messageFactory,
    onWorkerMessage,
    children,
}: ExtensionContextProviderProps<T>) => {
    const dispatch = useDispatch();
    const { tabId } = ExtensionContext.get();

    const [state, setState] = useState<WorkerState>(INITIAL_WORKER_STATE);
    const ready = useSelector(selectWorkerAlive(endpoint, tabId)) && workerReady(state.status);

    const logout = useCallback(({ soft }: { soft: boolean }) => {
        setState(INITIAL_WORKER_STATE);
        dispatch(signout({ soft }));
    }, []);

    const lock = useCallback(() => {
        setState({ ...INITIAL_WORKER_STATE, status: WorkerStatus.LOCKED });
        dispatch(sessionLockImmediate());
    }, []);

    const sync = useCallback(() => dispatch(syncIntent({})), []);

    useEffect(() => {
        const onMessage = (message: WorkerMessageWithSender) => {
            if (message.sender === 'background') {
                if (message.type === WorkerMessageType.WORKER_STATUS) {
                    const { status, loggedIn, UID } = message.payload.state;
                    setState((prevState) => ({ ...prevState, status, loggedIn, UID }));
                    setSentryUID(UID);
                }

                onWorkerMessage?.(message);
            }
        };

        ExtensionContext.get().port.onMessage.addListener(onMessage);

        setup({ tabId, endpoint, messageFactory })
            .then((result) => {
                setState({ UID: result.UID, loggedIn: result.loggedIn, status: result.status });
                setSentryUID(result.UID);
            })
            .catch((e) => {
                logger.warn(`[ExtensionContext::setup] setup failed`, e);
                setState((prevState) => ({
                    ...prevState,
                    loggedIn: false,
                    status: WorkerStatus.ERROR,
                    UID: undefined,
                }));
            });

        return () => ExtensionContext.get().port.onMessage.removeListener(onMessage);
    }, []);

    const context = useMemo<ExtensionAppContextValue>(
        () => ({ context: ExtensionContext.get(), state, ready, logout, lock, sync }),
        [state, ready]
    );

    return <ExtensionAppContext.Provider value={context}>{children}</ExtensionAppContext.Provider>;
};
