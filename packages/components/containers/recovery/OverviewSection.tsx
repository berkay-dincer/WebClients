import { useInactiveKeys } from '@proton/account';
import { useAddressesKeys } from '@proton/account/addressKeys/hooks';
import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserKeys } from '@proton/account/userKeys/hooks';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import useKTVerifier from '@proton/components/containers/keyTransparency/useKTVerifier';
import useApi from '@proton/components/hooks/useApi';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import useEventManager from '@proton/components/hooks/useEventManager';
import { FeatureCode, useFeature } from '@proton/features';
import { reactivateKeysProcess } from '@proton/shared/lib/keys';
import { useFlag } from '@proton/unleash';
import noop from '@proton/utils/noop';

import useSearchParamsEffect from '../../hooks/useSearchParamsEffect';
import ReactivateKeysModal from '../keys/reactivateKeys/ReactivateKeysModal';
import RecoverDataCard from './RecoverDataCard';
import RecoverDataConfirmModal from './RecoverDataConfirmModal';
import RecoveryCard from './RecoveryCard';

interface Props {
    ids: {
        account: string;
        data: string;
    };
}

export const OverviewSection = ({ ids }: Props) => {
    const { call, stop, start } = useEventManager();
    const authentication = useAuthentication();
    const api = useApi();
    const [User] = useUser();
    const [Addresses] = useAddresses();
    const [addressesKeys] = useAddressesKeys();
    const [userKeys] = useUserKeys();

    const keyReactivationRequests = useInactiveKeys();

    const { keyTransparencyVerify, keyTransparencyCommit } = useKTVerifier(api, async () => User);

    const [reactivateKeyProps, setReactivateKeyModalOpen, renderReactivateKeys] = useModalState();
    const [confirmProps, setDismissConfirmModalOpen, renderConfirm] = useModalState();

    const { feature: hasDismissedRecoverDataCard } = useFeature(FeatureCode.DismissedRecoverDataCard);
    const canDisplayNewSentinelSettings = useFlag('SentinelRecoverySettings');

    useSearchParamsEffect(
        (params) => {
            if (params.get('action') === 'recover-data' && keyReactivationRequests.length) {
                setReactivateKeyModalOpen(true);
                params.delete('action');
                return params;
            }
        },
        [keyReactivationRequests.length]
    );

    return (
        <>
            {renderReactivateKeys && (
                <ReactivateKeysModal
                    userKeys={userKeys || []}
                    keyReactivationRequests={keyReactivationRequests}
                    onProcess={async (keyReactivationRecords, onReactivation) => {
                        if (!userKeys || !Addresses || !addressesKeys) {
                            throw new Error('Missing keys');
                        }
                        try {
                            stop();
                            await reactivateKeysProcess({
                                api,
                                user: User,
                                userKeys,
                                addresses: Addresses,
                                addressesKeys,
                                keyReactivationRecords,
                                keyPassword: authentication.getPassword(),
                                onReactivation,
                                keyTransparencyVerify,
                            });
                            await keyTransparencyCommit(userKeys).catch(noop);
                            return await call();
                        } finally {
                            start();
                        }
                    }}
                    {...reactivateKeyProps}
                />
            )}
            {renderConfirm && <RecoverDataConfirmModal {...confirmProps} />}
            {!!keyReactivationRequests.length && hasDismissedRecoverDataCard?.Value === false && (
                <RecoverDataCard
                    className="mb-8"
                    onReactivate={() => setReactivateKeyModalOpen(true)}
                    onDismiss={() => setDismissConfirmModalOpen(true)}
                />
            )}
            <RecoveryCard ids={ids} canDisplayNewSentinelSettings={canDisplayNewSentinelSettings} />
        </>
    );
};
