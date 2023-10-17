import { type FC, useState } from 'react';
import { useSelector } from 'react-redux';

import { FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { SharedVaultItem } from '@proton/pass/components/Vault/SharedVaultItem';
import { VaultModal, type Props as VaultModalProps } from '@proton/pass/components/Vault/Vault.modal';
import { useActionWithRequest } from '@proton/pass/hooks/useActionWithRequest';
import { validateShareInviteValues } from '@proton/pass/lib/validation/vault-invite';
import { inviteCreationIntent } from '@proton/pass/store/actions';
import { selectVaultWithItemsCount } from '@proton/pass/store/selectors';
import type { InviteFormValues, MaybeNull, VaultShare } from '@proton/pass/types';
import { ShareRole } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import { useInviteContext } from './InviteContextProvider';
import { FORM_ID, VaultInviteForm } from './VaultInviteForm';

type Props = { shareId: string; withVaultCreation?: boolean };

export const VaultInviteCreate: FC<Props> = ({ shareId, withVaultCreation }) => {
    const { close, manageAccess } = useInviteContext();

    const vault = useSelector(selectVaultWithItemsCount(shareId));
    const createInvite = useActionWithRequest({ action: inviteCreationIntent, onSuccess: () => manageAccess(shareId) });

    const [vaultModalProps, setVaultModalProps] = useState<MaybeNull<VaultModalProps>>(null);

    const handleVaultEdit = (vault: VaultShare) => setVaultModalProps({ open: true, payload: { type: 'edit', vault } });

    const form = useFormik<InviteFormValues>({
        initialValues: { step: 'email', email: '', role: ShareRole.READ },
        validateOnChange: true,
        validate: validateShareInviteValues,
        onSubmit: ({ email, role, step }, { setFieldValue }) => {
            switch (step) {
                case 'email':
                    return setFieldValue('step', 'permissions');
                case 'permissions':
                    createInvite.dispatch({ email, role, shareId });
                    break;
            }
        },
    });

    const submitText = vault.shared ? c('Action').t`Send invite` : c('Action').t`Share vault`;

    return (
        <>
            <SidebarModal onClose={close} open>
                <Panel
                    loading={createInvite.loading}
                    header={
                        <PanelHeader
                            actions={[
                                <Button
                                    key="modal-close-button"
                                    className="flex-item-noshrink"
                                    icon
                                    pill
                                    shape="solid"
                                    onClick={close}
                                >
                                    <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
                                </Button>,
                                <Button
                                    key="modal-submit-button"
                                    type="submit"
                                    color="norm"
                                    pill
                                    disabled={createInvite.loading || !form.isValid || !form.dirty}
                                    loading={createInvite.loading}
                                    form={FORM_ID}
                                >
                                    {form.values.step === 'email' ? c('Action').t`Continue` : submitText}
                                </Button>,
                            ]}
                        />
                    }
                >
                    <div
                        className={clsx(
                            'flex flex-justify-space-between flex-align-items-center mt-3 mb-6 gap-3',
                            withVaultCreation && 'border rounded-xl p-3'
                        )}
                    >
                        <SharedVaultItem vault={vault} />
                        {withVaultCreation && (
                            <Button
                                color="weak"
                                pill
                                className="flex-item-noshrink"
                                onClick={() => handleVaultEdit(vault)}
                            >
                                {c('Action').t`Customize`}
                            </Button>
                        )}
                    </div>
                    <FormikProvider value={form}>
                        <VaultInviteForm form={form} />
                    </FormikProvider>
                </Panel>
            </SidebarModal>
            {vaultModalProps !== null && <VaultModal {...vaultModalProps} onClose={() => setVaultModalProps(null)} />}
        </>
    );
};
