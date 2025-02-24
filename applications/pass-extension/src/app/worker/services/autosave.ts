import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { withContext } from 'proton-pass-extension/app/worker/context/inject';
import { validateFormCredentials } from 'proton-pass-extension/lib/utils/form-entry';
import { c } from 'ttag';

import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import { hasUserIdentifier, matchesLoginPassword, matchesLoginURL } from '@proton/pass/lib/items/item.predicates';
import { intoLoginItemPreview } from '@proton/pass/lib/items/item.utils';
import { itemCreationIntent, itemCreationSuccess, itemEditIntent, itemEditSuccess } from '@proton/pass/store/actions';
import { selectAutosaveCandidate, selectItem, selectWritableVaults } from '@proton/pass/store/selectors';
import type { AutosavePrompt, FormEntry } from '@proton/pass/types';
import { AutosaveMode, WorkerMessageType } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { and } from '@proton/pass/utils/fp/predicates';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { parseUrl } from '@proton/pass/utils/url/parser';
import { intoDomainWithPort } from '@proton/pass/utils/url/utils';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';

export const createAutoSaveService = () => {
    const resolve = withContext<(entry: FormEntry) => AutosavePrompt>((ctx, options) => {
        const { type, data, domain } = options;

        /* If credentials are not valid for the form type : exit early */
        if (!validateFormCredentials(data, { type, partial: false })) return { shouldPrompt: false };

        const { userIdentifier, password } = data;
        const state = ctx.service.store.getState();
        const shareIds = selectWritableVaults(state).map(prop('shareId'));

        if (type === 'register') {
            const candidates = selectAutosaveCandidate({ domain, userIdentifier: '', shareIds })(state);
            const pwMatch = candidates.filter(matchesLoginPassword(password));

            /** Full match must account for userIdentifier & current URL */
            const fullMatch =
                Boolean(userIdentifier) &&
                pwMatch.some(and(hasUserIdentifier(userIdentifier), matchesLoginURL(options)));

            /* The credentials may have been saved during the password-autosuggest autosave
             * sequence - as such ensure we don't have an exact username/password match */
            if (fullMatch) return { shouldPrompt: false };
            if (pwMatch.length > 0) {
                return {
                    shouldPrompt: true,
                    data: { type: AutosaveMode.UPDATE, candidates: pwMatch.map(intoLoginItemPreview) },
                };
            } else return { shouldPrompt: true, data: { type: AutosaveMode.NEW } };
        }

        /* If no login items found for the current domain & the
         * current username - prompt for autosaving a new entry */
        const candidates = selectAutosaveCandidate({ domain, userIdentifier, shareIds })(state);
        if (candidates.length === 0) return { shouldPrompt: true, data: { type: AutosaveMode.NEW } };

        /* If we cannot find an entry which also matches the current submission's
         * password then we should prompt for update */
        const match = candidates.some(and(matchesLoginPassword(password), matchesLoginURL(options)));

        return match
            ? { shouldPrompt: false }
            : {
                  shouldPrompt: true,
                  data: { type: AutosaveMode.UPDATE, candidates: candidates.map(intoLoginItemPreview) },
              };
    });

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.AUTOSAVE_REQUEST,
        withContext(async (ctx, { payload }, sender) => {
            const state = ctx.service.store.getState();

            const { domain, subdomain, port, protocol } = parseUrl(sender.tab?.url);
            const url = intoDomainWithPort({ domain: subdomain ?? domain, port, protocol });

            if (payload.type === AutosaveMode.NEW) {
                const item = itemBuilder('login');
                const content = item.get('content');

                item.get('metadata')
                    .set('name', payload.name)
                    .set('note', c('Info').t`Autosaved on ${url}`);

                content
                    .set('password', payload.password)
                    .set('urls', url ? [url] : [])
                    .set('passkeys', payload.passkey ? [payload.passkey] : []);

                // TODO: migrate to use Rust's email validation
                if (validateEmailAddress(payload.userIdentifier)) content.set('itemEmail', payload.userIdentifier);
                else content.set('itemUsername', payload.userIdentifier);

                return new Promise<boolean>((resolve) =>
                    ctx.service.store.dispatch(
                        itemCreationIntent(
                            {
                                ...item.data,
                                createTime: getEpoch(),
                                extraData: { withAlias: false },
                                optimisticId: uniqueId(),
                                shareId: payload.shareId,
                            },
                            (action) => resolve(itemCreationSuccess.match(action))
                        )
                    )
                );
            }

            if (payload.type === AutosaveMode.UPDATE) {
                const { shareId, itemId } = payload;

                const currentItem = selectItem<'login'>(shareId, itemId)(state);
                if (!currentItem) throw new Error(c('Error').t`Item does not exist`);

                const item = itemBuilder('login', currentItem.data);
                const content = item.get('content');
                const { passkey } = payload;

                item.get('metadata').set('name', payload.name);

                content
                    .set('password', (password) => (passkey ? password : payload.password))
                    .set('urls', (urls) => (url ? Array.from(new Set(urls.concat(url))) : urls))
                    .set('passkeys', (passkeys) => (passkey ? [...passkeys, passkey] : passkeys));

                // TODO: migrate to use Rust's email validation
                const isEmail = validateEmailAddress(payload.userIdentifier);
                const userIdKey = isEmail ? 'itemEmail' : 'itemUsername';
                content.set(userIdKey, (value) => (passkey ? value : payload.userIdentifier));

                return new Promise<boolean>((resolve) =>
                    ctx.service.store.dispatch(
                        itemEditIntent(
                            {
                                ...item.data,
                                lastRevision: currentItem.revision,
                                itemId,
                                shareId,
                            },
                            (action) => resolve(itemEditSuccess.match(action))
                        )
                    )
                );
            }

            return false;
        })
    );

    return { resolve };
};

export type AutoSaveService = ReturnType<typeof createAutoSaveService>;
