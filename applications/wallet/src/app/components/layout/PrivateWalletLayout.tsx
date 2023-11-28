import { ReactNode } from 'react';

import { DrawerApp, PrivateAppContainer, PrivateMainArea, TopBanners, useToggle } from '@proton/components';

import WalletHeader from './WalletHeader';
import WalletQuickSettings from './WalletQuickSettings';
import WalletSidebar from './WalletSidebar';

interface Props {
    children: ReactNode;
}

export const PrivateWalletLayout = ({ children }: Props) => {
    const { state: expanded, toggle: toggleExpanded } = useToggle();

    return (
        <PrivateAppContainer
            top={<TopBanners />}
            header={<WalletHeader isHeaderExpanded={expanded} toggleHeaderExpanded={toggleExpanded} />}
            sidebar={<WalletSidebar />}
            drawerApp={<DrawerApp customAppSettings={<WalletQuickSettings />} />}
        >
            <PrivateMainArea hasToolbar className="full-height-content" data-testid="wallet-view:events-area">
                {children}
            </PrivateMainArea>
        </PrivateAppContainer>
    );
};
