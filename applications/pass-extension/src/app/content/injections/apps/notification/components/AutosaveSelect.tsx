import { type FC } from 'react';

import type { FormikContextType } from 'formik';
import { ListItem } from 'proton-pass-extension/app/content/injections/apps/components/ListItem';
import { ScrollableItemsList } from 'proton-pass-extension/app/content/injections/apps/components/ScrollableItemsList';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import ButtonLike from '@proton/atoms/Button/ButtonLike';
import { type AutosaveFormValues, AutosaveMode, type AutosaveUpdatePayload } from '@proton/pass/types';

type Props = {
    busy: boolean;
    data: AutosaveUpdatePayload;
    form: FormikContextType<AutosaveFormValues>;
};

export const AutosaveSelect: FC<Props> = ({ data, busy, form }) => (
    <>
        <ScrollableItemsList increaseSurface>
            {data.candidates.map(({ itemId, shareId, url, userIdentifier, name }) => (
                <ListItem
                    key={`${shareId}-${itemId}`}
                    className="rounded-none"
                    icon="user"
                    title={name}
                    subTitle={userIdentifier}
                    url={url}
                    action={
                        data?.candidates.length > 1 && (
                            <ButtonLike
                                as="div"
                                pill
                                color="norm"
                                loading={busy}
                                disabled={busy}
                                className="flex-auto"
                                onClick={() =>
                                    form.setValues((values) => ({
                                        ...values,
                                        type: AutosaveMode.UPDATE,
                                        step: 'edit',
                                        itemId,
                                        shareId,
                                        name: name || values.name,
                                        userIdentifier: userIdentifier || values.userIdentifier,
                                    }))
                                }
                            >{c('Label').t`Update`}</ButtonLike>
                        )
                    }
                />
            ))}
        </ScrollableItemsList>

        <div className="flex justify-space-between shrink-0 gap-3 mt-1">
            <Button
                pill
                color="norm"
                shape="underline"
                type="submit"
                className="text-no-decoration hover:text-underline p-0 pt-1"
            >
                {c('Action').t`Create new login`}
            </Button>
            {data?.candidates.length === 1 && (
                <ButtonLike
                    as="div"
                    pill
                    color="norm"
                    loading={busy}
                    disabled={busy}
                    onClick={() =>
                        form.setValues((values) => ({
                            ...values,
                            type: AutosaveMode.UPDATE,
                            step: 'edit',
                            itemId: data.candidates[0].itemId,
                            shareId: data.candidates[0].shareId,
                            name: data.candidates[0].name || values.name,
                            userIdentifier: data.candidates[0].userIdentifier || values.userIdentifier,
                        }))
                    }
                >
                    <span className="text-ellipsis">{c('Action').t`Update this login`}</span>
                </ButtonLike>
            )}
        </div>
    </>
);
