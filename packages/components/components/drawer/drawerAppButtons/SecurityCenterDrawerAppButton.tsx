import { c } from 'ttag';

import DrawerAppButton, { Props } from '@proton/components/components/drawer/drawerAppButtons/DrawerAppButton';
import { useDrawer } from '@proton/components/hooks';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import { Optional } from '@proton/shared/lib/interfaces';

import { SecurityCenterDrawerLogo } from '../drawerIcons';
import SecurityCenterSpotlight from '../views/SecurityCenter/SecurityCenterSpotlight';
import useSecurityCenter from '../views/SecurityCenter/useSecurityCenter';

const SecurityCenterDrawerAppButton = ({
    onClick,
    ...rest
}: Optional<Omit<Props, 'tooltipText' | 'buttonContent'>, 'onClick'>) => {
    const { toggleDrawerApp } = useDrawer();
    const isSecurityCenterEnabled = useSecurityCenter();

    const handleClick = () => {
        onClick?.();
        toggleDrawerApp({ app: DRAWER_NATIVE_APPS.SECURITY_CENTER })();
    };

    if (!isSecurityCenterEnabled) {
        return null;
    }

    return (
        <SecurityCenterSpotlight>
            <DrawerAppButton
                tooltipText={c('Title').t`Security center`}
                data-testid="security-center-drawer-app-button:security-center-icon"
                buttonContent={<SecurityCenterDrawerLogo />}
                onClick={handleClick}
                alt={c('Action').t`Toggle security center app`}
                aria-controls="drawer-app-proton-security-center"
                {...rest}
            />
        </SecurityCenterSpotlight>
    );
};

export default SecurityCenterDrawerAppButton;
