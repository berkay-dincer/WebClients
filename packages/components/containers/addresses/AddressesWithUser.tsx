import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { Href } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import OrderableTable from '@proton/components/components/orderableTable/OrderableTable';
import OrderableTableBody from '@proton/components/components/orderableTable/OrderableTableBody';
import OrderableTableHeader from '@proton/components/components/orderableTable/OrderableTableHeader';
import OrderableTableRow from '@proton/components/components/orderableTable/OrderableTableRow';
import MailUpsellButton from '@proton/components/components/upsell/MailUpsellButton';
import NewUpsellModal from '@proton/components/components/upsell/modal/NewUpsellModal';
import UpsellModal from '@proton/components/components/upsell/modal/UpsellModal';
import useOneDollarConfig from '@proton/components/components/upsell/useOneDollarPromo';
import useUpsellConfig from '@proton/components/components/upsell/useUpsellConfig';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import { usePostSubscriptionTelemetry } from '@proton/components/containers/payments/subscription/postSubscription/usePostSubscriptionTelemetry';
import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import useNotifications from '@proton/components/hooks/useNotifications';
import { orderAddress } from '@proton/shared/lib/api/addresses';
import { TelemetryMailPostSubscriptionEvents } from '@proton/shared/lib/api/telemetry';
import {
    ADDRESS_TYPE,
    APP_UPSELL_REF_PATH,
    BRAND_NAME,
    MAIL_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { getUpsellRef, useNewUpsellModalVariant } from '@proton/shared/lib/helpers/upsell';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Address, CachedOrganizationKey, Member, UserModel } from '@proton/shared/lib/interfaces';
import { getIsNonDefault, sortAddresses } from '@proton/shared/lib/mail/addresses';
import addressesImg from '@proton/styles/assets/img/illustrations/new-upsells-img/addresses.svg';
import move from '@proton/utils/move';

import AddressActions from './AddressActions';
import AddressStatus from './AddressStatus';
import { getPermissions, getStatus } from './helper';

interface Props {
    user: UserModel;
    member?: Member;
    organizationKey?: CachedOrganizationKey;
    hasDescription?: boolean;
    allowAddressDeletion: boolean;
}

const AddressesUser = ({ user, organizationKey, member, hasDescription = true, allowAddressDeletion }: Props) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const [savingIndex, setSavingIndex] = useState<number | undefined>();
    const { call } = useEventManager();
    const [addresses, loadingAddresses] = useAddresses();
    const [list, setAddresses] = useState<Address[]>(() => sortAddresses(addresses || []));
    const sendTelemetryEvent = usePostSubscriptionTelemetry();

    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.UNLIMITED_ADDRESSES,
        isSettings: true,
    });

    const oneDollarConfig = useOneDollarConfig();
    const upsellConfig = useUpsellConfig({ upsellRef, ...oneDollarConfig });

    const displayNewUpsellModalsVariant = useNewUpsellModalVariant();

    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

    useEffect(() => {
        if (addresses) {
            setAddresses(sortAddresses(addresses));
        }
    }, [addresses]);

    const handleSortEnd = useCallback(
        async ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => {
            try {
                const newList = move(list, oldIndex, newIndex);
                const { isExternal, isDisabled } = getStatus(newList[0], 0);

                if (isDeepEqual(list, newList)) {
                    return;
                }

                if (newIndex === 0 && (isDisabled || isExternal)) {
                    const errorMessage = (() => {
                        if (isDisabled) {
                            return c('Notification').t`A disabled address cannot be default`;
                        }
                        if (isExternal) {
                            return c('Notification').t`An external address cannot be default`;
                        }
                    })();
                    if (errorMessage) {
                        createNotification({
                            type: 'error',
                            text: errorMessage,
                        });
                    }
                    setAddresses(sortAddresses(addresses));
                    return;
                }

                setAddresses(newList);
                setSavingIndex(newIndex);

                await api(orderAddress(newList.map(({ ID }) => ID)));
                await call();

                setSavingIndex(undefined);

                if (
                    list.length &&
                    newList.length &&
                    list[0].Type === ADDRESS_TYPE.TYPE_PREMIUM &&
                    newList[0].Type !== ADDRESS_TYPE.TYPE_PREMIUM
                ) {
                    void sendTelemetryEvent({
                        event: TelemetryMailPostSubscriptionEvents.replaced_default_short_domain_address,
                        dimensions: {
                            isForCustomDomain: newList[0].Type === ADDRESS_TYPE.TYPE_CUSTOM_DOMAIN ? 'true' : 'false',
                        },
                    });
                }
            } catch (e: any) {
                setSavingIndex(undefined);
                setAddresses(sortAddresses(addresses));
            }
        },
        [list, addresses]
    );

    const setDefaultAddress = useCallback(
        (addressOldIndex: number) => {
            return async () => {
                await handleSortEnd({ oldIndex: addressOldIndex, newIndex: 0 });
            };
        },
        [list, addresses]
    );

    if (!loadingAddresses && !addresses?.length) {
        return <Alert className="mb-4">{c('Info').t`No addresses exist`}</Alert>;
    }

    const modal = displayNewUpsellModalsVariant ? (
        <NewUpsellModal
            titleModal={c('Title').t`An address for each role`}
            description={c('Description')
                .t`Keep different parts of your life separate and your inbox organized with additional addresses.`}
            modalProps={upsellModalProps}
            illustration={addressesImg}
            sourceEvent="BUTTON_MORE_ADDRESSES"
            {...upsellConfig}
        />
    ) : (
        <UpsellModal
            title={c('Title').t`Increase your privacy with more addresses`}
            description={c('Description')
                .t`Separate different aspects of your life with multiple email addresses and unlock more premium features when you upgrade.`}
            modalProps={upsellModalProps}
            sourceEvent="BUTTON_MORE_ADDRESSES"
            features={['more-storage', 'more-email-addresses', 'unlimited-folders-and-labels', 'custom-email-domains']}
            {...upsellConfig}
        />
    );

    return (
        <>
            {hasDescription && (
                <SettingsParagraph className="mt-2">
                    <span>
                        {c('Info').t`Use the different types of email addresses and aliases offered by ${BRAND_NAME}.`}
                    </span>
                    <br />
                    <Href href={getKnowledgeBaseUrl('/addresses-and-aliases')}>{c('Link').t`Learn more`}</Href>
                </SettingsParagraph>
            )}

            {!user.hasPaidMail && (
                <MailUpsellButton
                    onClick={() => handleUpsellModalDisplay(true)}
                    text={c('Action').t`Get more addresses`}
                />
            )}

            <OrderableTable
                onSortEnd={handleSortEnd}
                className="simple-table--has-actions mt-4"
                helperClassname="simple-table--has-actions"
            >
                <OrderableTableHeader
                    cells={[
                        c('Header for addresses table').t`Address`,
                        c('Header for addresses table').t`Status`,
                        c('Header for addresses table').t`Actions`,
                    ]}
                />
                <OrderableTableBody colSpan={3} loading={loadingAddresses}>
                    {list &&
                        list.map((address, i) => {
                            const addressStatuses = getStatus(address, i);
                            return (
                                <OrderableTableRow
                                    disableSort={getIsNonDefault(address)}
                                    key={i}
                                    index={i}
                                    cells={[
                                        <div key={0} className="text-ellipsis" title={address.Email}>
                                            {address.Email}
                                        </div>,
                                        <AddressStatus key={1} {...addressStatuses} />,
                                        <AddressActions
                                            key={2}
                                            address={address}
                                            member={member}
                                            user={user}
                                            onSetDefault={setDefaultAddress(i)}
                                            savingIndex={savingIndex}
                                            addressIndex={i}
                                            permissions={getPermissions({
                                                addressIndex: i,
                                                member,
                                                address,
                                                addresses: list,
                                                user,
                                                organizationKey,
                                            })}
                                            allowAddressDeletion={allowAddressDeletion}
                                        />,
                                    ]}
                                />
                            );
                        })}
                </OrderableTableBody>
            </OrderableTable>

            {renderUpsellModal && modal}
        </>
    );
};

export default AddressesUser;
