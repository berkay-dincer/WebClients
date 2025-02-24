import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { Member, UserModel } from '@proton/shared/lib/interfaces';
import { getMemberEmailOrName } from '@proton/shared/lib/keys/memberHelper';

import AdministratorList from './AdministratorList';

interface Props extends Omit<ModalProps, 'buttons' | 'title' | 'children'> {
    onResetKeys: () => void;
    disableResetOrganizationKeys: boolean;
    otherAdminsWithKeyAccess: Member[];
    user: UserModel;
}

const ReactivatePasswordlessOrganizationKey = ({
    onResetKeys,
    otherAdminsWithKeyAccess,
    disableResetOrganizationKeys,
    user,
    ...rest
}: Props) => {
    return (
        <ModalTwo open {...rest}>
            <ModalTwoHeader title={c('Title').t`Restore administrator privileges`} {...rest} />
            <ModalTwoContent>
                {(() => {
                    if (otherAdminsWithKeyAccess.length) {
                        return (
                            <div>
                                <div className="mb-4">
                                    {c('passwordless')
                                        .t`Use a data recovery method, contact another administrator, or reset the organization key to restore administrator privileges.`}
                                </div>

                                <AdministratorList
                                    members={otherAdminsWithKeyAccess.map((member) => ({
                                        member,
                                        email: getMemberEmailOrName(member),
                                    }))}
                                    expandByDefault={true}
                                />
                            </div>
                        );
                    }

                    return (
                        <div>{c('passwordless')
                            .t`Use a data recovery method or reset the organization key to restore administrator privileges.`}</div>
                    );
                })()}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose}>{c('Action').t`Close`}</Button>
                <div>
                    <Button
                        color="danger"
                        className="mr-4"
                        onClick={() => {
                            rest.onClose?.();
                            onResetKeys();
                        }}
                    >{c('Action').t`Reset keys`}</Button>
                    {user.isPrivate && (
                        <ButtonLike color="norm" as={SettingsLink} path="/recovery" onClick={rest.onClose}>
                            {c('Action').t`Recover data`}
                        </ButtonLike>
                    )}
                </div>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ReactivatePasswordlessOrganizationKey;
