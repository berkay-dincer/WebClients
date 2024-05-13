import { PropsWithChildren } from 'react';

import ModalTwo, { ModalOwnProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import clsx from '@proton/utils/clsx';

import './Modal.scss';

interface Props extends ModalOwnProps {
    title?: string;
    subline?: string;
    className?: string;
    key?: string;
}

export const FullscreenModal = ({ title, subline, children, key, ...rest }: PropsWithChildren<Props>) => {
    return (
        <ModalTwo {...rest} key={key} size="full" fullscreen>
            <ModalTwoHeader
                title={title}
                titleClassName="h2 mr-auto"
                subline={subline && <p className="text-center mx-12">{subline}</p>}
                closeButtonProps={{ shape: 'solid', className: 'shrink-0 rounded-full bg-norm' }}
            />

            {/* Content */}
            <div className={clsx('pb-6 px-3 modal-two-content flex items-center justify-center grow')}>
                <div
                    className="w-full max-w-custom max-h-custom overflow-auto p-2"
                    style={{ '--max-w-custom': '26rem', '--max-h-custom': '36rem' }}
                >
                    {children}
                </div>
            </div>
        </ModalTwo>
    );
};
