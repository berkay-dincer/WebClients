import { type VFC, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { vaultCreationIntent } from '@proton/pass/store';
import { vaultCreate } from '@proton/pass/store/actions/requests';
import { VaultColor, VaultIcon } from '@proton/pass/types/protobuf/vault-v1';
import { uniqueId } from '@proton/pass/utils/string';

import { useRequestStatusEffect } from '../../../shared/hooks/useRequestStatusEffect';
import { ItemCard } from '../../components/Item/ItemCard';
import { useUsageLimits } from '../../hooks/useUsageLimits';
import { VaultForm, type VaultFormConsumerProps, type VaultFormValues } from './Vault.form';
import { validateVaultVaultsWithEffect } from './Vault.validation';

export const FORM_ID = 'vault-create';

export const VaultNew: VFC<VaultFormConsumerProps> = ({ onSubmit, onSuccess, onFailure, onFormValidChange }) => {
    const dispatch = useDispatch();
    const { vaultLimitExceeded } = useUsageLimits();

    const optimisticId = useMemo(() => uniqueId(), []);
    const requestId = useMemo(() => vaultCreate(optimisticId), [optimisticId]);
    useRequestStatusEffect(requestId, { onSuccess, onFailure });

    const form = useFormik<VaultFormValues>({
        initialValues: {
            name: '',
            description: '',
            color: VaultColor.COLOR1,
            icon: VaultIcon.ICON1,
        },
        validateOnChange: true,
        validate: validateVaultVaultsWithEffect((errors) => onFormValidChange?.(Object.keys(errors).length === 0)),
        onSubmit: ({ name, description, color, icon }) => {
            onSubmit?.();
            dispatch(
                vaultCreationIntent({
                    id: optimisticId,
                    content: {
                        name,
                        description,
                        display: {
                            color,
                            icon,
                        },
                    },
                })
            );
        },
    });

    return (
        <>
            {vaultLimitExceeded && (
                <ItemCard className="mb-4">
                    {c('Info')
                        .t`You have reached the limit of vaults you can create. Create an unlimited number of vaults when you upgrade your subscription.`}
                </ItemCard>
            )}
            <FormikProvider value={form}>
                <VaultForm form={form} formId={FORM_ID} />
            </FormikProvider>
        </>
    );
};
