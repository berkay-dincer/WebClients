import uniqid from 'uniqid';

import {
    itemCreationIntent,
    itemCreationSuccess,
    itemEditIntent,
    itemEditSuccess,
    selectAutosaveCandidate,
    selectDefaultVaultOrThrow,
} from '@proton/pass/store';
import type { AutoSavePromptOptions, FormEntry, FormEntryStatus } from '@proton/pass/types';
import { AutoSaveType, WorkerMessageType } from '@proton/pass/types';
import { first } from '@proton/pass/utils/array';
import { getEpoch } from '@proton/pass/utils/time';

import WorkerMessageBroker from '../channel';
import store from '../store';

export const createAutoSaveService = () => {
    const resolvePromptOptions = (submission: FormEntry<FormEntryStatus.COMMITTED>): AutoSavePromptOptions => {
        const candidates = selectAutosaveCandidate(
            submission.data.username,
            submission.realm,
            submission.subdomain
        )(store.getState());

        /**
         * If no login items found for the current
         * realm & the current username - prompt for
         * autosaving a new entry
         */
        if (candidates.length === 0) {
            return { shouldPrompt: true, data: { action: AutoSaveType.NEW } };
        }

        const match = candidates.filter((item) => item.data.content.password === submission.data.password);

        /**
         * If we cannot find an entry which also
         * matches the current submission's password
         * then we should prompt for update
         */
        return match.length > 0
            ? { shouldPrompt: false }
            : {
                  shouldPrompt: true,
                  data: {
                      action: AutoSaveType.UPDATE,
                      item: first(candidates)!,
                  },
              };
    };

    WorkerMessageBroker.registerMessage(WorkerMessageType.AUTOSAVE_REQUEST, async ({ payload }) => {
        const autosave = payload.submission.autosave.data;

        if (autosave.action === AutoSaveType.NEW) {
            const selectedVault = selectDefaultVaultOrThrow(store.getState());

            return new Promise<boolean>((resolve) =>
                store.dispatch(
                    itemCreationIntent(
                        {
                            ...payload.item,
                            optimisticId: uniqid(),
                            shareId: selectedVault.shareId,
                            createTime: getEpoch(),
                            extraData: { withAlias: false },
                        },
                        (intentResultAction) =>
                            itemCreationSuccess.match(intentResultAction) ? resolve(true) : resolve(false)
                    )
                )
            );
        }

        if (autosave.action === AutoSaveType.UPDATE) {
            const { itemId, shareId, revision: lastRevision } = autosave.item;

            return new Promise<boolean>((resolve) =>
                store.dispatch(
                    itemEditIntent({ ...payload.item, itemId, shareId, lastRevision }, (intentResultAction) =>
                        itemEditSuccess.match(intentResultAction) ? resolve(true) : resolve(false)
                    )
                )
            );
        }

        return false;
    });

    return { resolvePromptOptions };
};

export type AutoSaveService = ReturnType<typeof createAutoSaveService>;
