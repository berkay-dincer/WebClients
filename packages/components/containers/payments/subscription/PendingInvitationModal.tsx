import { c } from 'ttag';

import { useGetOrganization } from '@proton/account/organization/hooks';
import { Button } from '@proton/atoms';
import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import useEventManager from '@proton/components/hooks/useEventManager';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { PLANS } from '@proton/payments';
import { CacheType } from '@proton/redux-utilities';
import { acceptInvitation, rejectInvitation } from '@proton/shared/lib/api/user';
import { APPS, BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import type { PendingInvitation } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import PendingInvitationModalErrors from './PendingInvitationModalErrors';

interface Props extends ModalStateProps {
    invite: PendingInvitation;
}

const PendingInvitationModal = ({ invite, ...modalProps }: Props) => {
    const api = useApi();
    const goToSettings = useSettingsLink();
    const protonConfig = useConfig();
    const getOrganization = useGetOrganization();

    const { createNotification } = useNotifications();

    const { call } = useEventManager();
    const [loadingAccept, withLoadingAccept] = useLoading();
    const [loadingReject, withLoadingReject] = useLoading();

    const hasErrors = !invite.Validation.Valid;

    const handleRejectInvitation = async () => {
        await api(rejectInvitation(invite.ID));
        await call();
        createNotification({ text: c('Success').t`Invitation rejected` });
        modalProps.onClose();
    };

    const handleAcceptInvitation = async () => {
        await api(acceptInvitation(invite.ID));
        await call();
        modalProps.onClose();
        createNotification({
            text: c('familyOffer_2023:Family plan').t`You have successfully joined the family group`,
        });

        if (protonConfig.APP_NAME === APPS.PROTONACCOUNT) {
            // Force refresh the organization since it's not present in the event manager
            getOrganization({ cache: CacheType.None }).catch(noop);
            goToSettings('/account-password', APPS.PROTONACCOUNT);
        }
    };

    const inviteEmail = <strong>{`${invite.InviterEmail}`}</strong>;
    const assignedStorage = <strong>{humanSize({ bytes: invite.MaxSpace, fraction: 0 })}</strong>;

    const brandOrAppName = invite.OrganizationPlanName === PLANS.PASS_FAMILY ? PASS_APP_NAME : BRAND_NAME;

    return (
        <ModalTwo {...modalProps} size="large">
            <ModalTwoHeader
                // translator: Title of the modal to accept or reject an invitation to join a family plan, no period at the end of the sentence. Looks like: "You are invited to join Bernie's family"
                title={c('familyOffer_2023:Family plan').t`You are invited to join ${invite.OrganizationName}`}
            />
            <ModalTwoContent>
                <div className="bg-weak p-3 rounded flex gap-2 mb-4">
                    <div>{c('familyOffer_2023:Family plan').jt`Invited by: ${inviteEmail}`}</div>
                    {invite.OrganizationPlanName !== PLANS.PASS_FAMILY && (
                        <div>{c('familyOffer_2023:Family plan').jt`Storage assigned to you: ${assignedStorage}`}</div>
                    )}
                </div>
                {hasErrors ? (
                    <PendingInvitationModalErrors
                        errors={invite.Validation}
                        invite={invite}
                        onClose={modalProps.onClose}
                    />
                ) : (
                    <>
                        <p className="my-2">{c('familyOffer_2023:Family plan')
                            .jt`You're invited to link your ${BRAND_NAME} Account to this family plan and together enjoy all ${brandOrAppName} premium features.`}</p>
                        <p className="my-2">{c('familyOffer_2023:Family plan')
                            .t`The subscription will be billed to the primary admin of this plan.`}</p>
                        <p className="my-2">{c('familyOffer_2023:Family plan')
                            .t`If you accept the invitation, we'll switch you from your current plan and credit your account with any remaining balance.`}</p>
                    </>
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button
                    loading={loadingReject}
                    disabled={loadingAccept}
                    onClick={() => withLoadingReject(handleRejectInvitation())}
                >{c('familyOffer_2023:Action').t`Decline invitation`}</Button>
                {hasErrors ? (
                    <Button color="norm" onClick={() => modalProps.onClose()}>{c('familyOffer_2023:Action')
                        .t`Got it`}</Button>
                ) : (
                    <Button
                        disabled={loadingReject}
                        loading={loadingAccept}
                        color="norm"
                        onClick={() => withLoadingAccept(handleAcceptInvitation())}
                    >{c('familyOffer_2023:Action').t`Switch plans`}</Button>
                )}
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default PendingInvitationModal;
