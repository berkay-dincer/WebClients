import { useState } from 'react';
import { Link, Redirect } from 'react-router-dom';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import { useSecurityCheckup } from '@proton/components';
import { getFormattedValue } from '@proton/components/components/v2/phone/helper';
import { BRAND_NAME, SECURITY_CHECKUP_PATHS } from '@proton/shared/lib/constants';

import methodErrorSrc from '../../assets/method-error.svg';
import methodSuccessSrc from '../../assets/method-success.svg';
import SecurityCheckupMain from '../../components/SecurityCheckupMain';
import SecurityCheckupMainIcon from '../../components/SecurityCheckupMainIcon';
import SecurityCheckupMainTitle from '../../components/SecurityCheckupMainTitle';
import { phoneIcon } from '../../methodIcons';
import { CodeInput } from '../../verification/CodeInput';

enum STEPS {
    CODE,
    SUCCESS,
    ERROR,
}

const VerifyPhoneContainer = () => {
    const { securityState } = useSecurityCheckup();
    const { phone } = securityState;

    const formattedPhoneNumber = getFormattedValue(phone?.value || '');

    const [step, setStep] = useState(STEPS.CODE);

    if (step === STEPS.SUCCESS) {
        return (
            <SecurityCheckupMain>
                <SecurityCheckupMainTitle prefix={<SecurityCheckupMainIcon icon={phoneIcon} color="success" />}>
                    {c('l10n_nightly: Security checkup').t`Your recovery phone is set`}
                </SecurityCheckupMainTitle>

                <div className="border rounded flex flex-column gap-2 items-center justify-center p-6">
                    <img src={methodSuccessSrc} alt="" />
                    <div className="text-bold">{formattedPhoneNumber}</div>
                </div>

                <div className="mt-6">
                    {c('l10n_nightly: Security checkup')
                        .t`${BRAND_NAME} will use this phone number to send a reset code by SMS when you reset your password.`}
                </div>

                <ButtonLike className="mt-8" fullWidth as={Link} to={SECURITY_CHECKUP_PATHS.ROOT} color="norm" replace>
                    {c('l10n_nightly: Security checkup').t`Continue to Safety Review`}
                </ButtonLike>
            </SecurityCheckupMain>
        );
    }

    if (step === STEPS.ERROR) {
        return (
            <SecurityCheckupMain className="text-center">
                <div className="flex justify-center">
                    <img src={methodErrorSrc} alt="" />
                </div>

                <SecurityCheckupMainTitle>
                    {c('l10n_nightly: Security checkup').t`There was an error verifying your recovery phone`}
                </SecurityCheckupMainTitle>

                <div>
                    {c('l10n_nightly: Security checkup')
                        .t`We encountered an error while verifying your recovery phone. Please try again later, or contact support if the issue continues.`}
                </div>

                <ButtonLike className="mt-8" fullWidth as={Link} to={SECURITY_CHECKUP_PATHS.ROOT} color="norm">
                    {c('l10n_nightly: Security checkup').t`Back to Safety Review`}
                </ButtonLike>
            </SecurityCheckupMain>
        );
    }

    if (!phone.value) {
        return <Redirect to={SECURITY_CHECKUP_PATHS.SET_PHONE} />;
    }

    if (phone.verified) {
        return <Redirect to={SECURITY_CHECKUP_PATHS.ROOT} />;
    }

    const boldPhoneNumber = <b key="phone-number">{formattedPhoneNumber}</b>;

    return (
        <SecurityCheckupMain>
            <SecurityCheckupMainTitle prefix={<SecurityCheckupMainIcon icon={phoneIcon} color="warning" />}>
                {c('l10n_nightly: Security checkup').t`Verify your recovery phone number`}
            </SecurityCheckupMainTitle>

            <div className="mb-12">
                {c('l10n_nightly: Security checkup')
                    .jt`To make sure the phone number is yours, enter the verification code sent to ${boldPhoneNumber}.`}
            </div>

            <CodeInput
                value={formattedPhoneNumber}
                onSuccess={() => setStep(STEPS.SUCCESS)}
                onError={() => setStep(STEPS.ERROR)}
                method="phone"
            />
        </SecurityCheckupMain>
    );
};

export default VerifyPhoneContainer;
