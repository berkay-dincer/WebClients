import { useEffect, useState } from 'react';
import {
    FeatureCode,
    SectionConfig,
    SettingsPropsShared,
    useFeature,
    useIsDataRecoveryAvailable,
} from '@proton/components';
import { c } from 'ttag';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { UserModel } from '@proton/shared/lib/interfaces';
import { AccountRecoverySection, DataRecoverySection, RecoveryCard } from '@proton/components/containers/recovery';
import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

const ids = {
    account: 'account',
    data: 'data',
};

const recoveryPageConfig: SectionConfig = {
    text: c('Title').t`Recovery`,
    to: '/recovery',
    icon: 'key',
};

export const hasRecoverySettings = (user: UserModel) => user.isPrivate;

export const getRecoveryPage = (showNotification: boolean): SectionConfig => {
    return {
        ...recoveryPageConfig,
        notification: showNotification,
    };
};

const getRecoveryPageWithSubsections = (dataRecoveryMethodAvailable: boolean): SectionConfig => {
    return {
        ...recoveryPageConfig,
        subsections: [
            {
                id: 'checklist',
            },
            {
                text: c('Title').t`Account recovery`,
                id: ids.account,
            },
            dataRecoveryMethodAvailable && {
                text: c('Title').t`Data recovery`,
                id: ids.data,
            },
        ].filter(isTruthy),
    };
};

const AccountRecoverySettings = ({ location, setActiveSection }: SettingsPropsShared) => {
    const [action] = useState(() => {
        return new URLSearchParams(location.search).get('action');
    });

    const { feature: hasVisitedRecoveryPage, update: setVisitedRecoveryPage } = useFeature(
        FeatureCode.VisitedRecoveryPage
    );
    const [isDataRecoveryAvailable] = useIsDataRecoveryAvailable();

    useEffect(() => {
        if (hasVisitedRecoveryPage?.Value === false) {
            void setVisitedRecoveryPage(true);
        }
    }, [hasVisitedRecoveryPage]);

    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getRecoveryPageWithSubsections(isDataRecoveryAvailable)}
            setActiveSection={setActiveSection}
        >
            <RecoveryCard ids={ids} />
            <AccountRecoverySection />
            {isDataRecoveryAvailable && (
                <DataRecoverySection openMnemonicModal={action === 'generate-recovery-phrase'} />
            )}
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default AccountRecoverySettings;
