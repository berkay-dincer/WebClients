import { c } from 'ttag';

import { Href } from '@proton/atoms';
import type { ModalOwnProps } from '@proton/components';
import { Prompt } from '@proton/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import walletSeedphraseSrc from '@proton/styles/assets/img/wallet/wallet-key.jpg';
import walletPassphraseSrc from '@proton/styles/assets/img/wallet/wallet-lock.jpg';

import { Button, CoreButtonLike } from '../../atoms';

type ContentKind = 'wallet-seedphrase-introduction' | 'wallet-passphrase-introduction';

const getContent = (kind: ContentKind) => {
    const content: Record<ContentKind, { title: string; image: string; text: string }> = {
        ['wallet-seedphrase-introduction']: {
            title: c('Wallet information').t`What’s a wallet seed phrase?`,
            image: walletSeedphraseSrc,
            text: c('Wallet information')
                .t`A wallet seed phrase is a series of 12 or 24 words generated by your wallet. It acts as a master key, allowing you to recover your funds. Keep it safe and never share it, as it grants access to your funds.`,
        },
        ['wallet-passphrase-introduction']: {
            title: c('Wallet information').t`What’s a wallet passphrase?`,
            image: walletPassphraseSrc,
            text: c('Wallet information')
                .t`A wallet passphrase is an extra password you create to add security to your cryptocurrency wallet. It works alongside your seed phrase. Store it securely, as losing it can lock you out of your wallet.`,
        },
    };

    return content[kind];
};

export interface WalletInformationalModalOwnProps {
    kind: ContentKind;
}

export const WalletInformationalModal = ({ kind, ...modalProps }: WalletInformationalModalOwnProps & ModalOwnProps) => {
    const { title, image, text } = getContent(kind);

    return (
        <Prompt
            size="medium"
            buttons={
                <Button onClick={modalProps.onClose} fullWidth size="large" shape="solid" color="norm">{c('Action')
                    .t`Close`}</Button>
            }
            {...modalProps}
        >
            <div className="flex flex-column items-center text-center">
                <img src={image} alt="" className="mb-6" />

                <h1 className="my-4 text-semibold text-3xl">{title ?? c('Wallet Upgrade').t`Upgrade your privacy`}</h1>

                <p className="m-0 color-hint text-center">{text}</p>

                <CoreButtonLike
                    className="my-3"
                    shape="underline"
                    color="norm"
                    as={Href}
                    href={
                        kind === 'wallet-seedphrase-introduction'
                            ? getKnowledgeBaseUrl('/wallet-protection#seed-phrase')
                            : getKnowledgeBaseUrl('/wallet-protection#optional-passphrase')
                    }
                >{c('Action').t`Learn more`}</CoreButtonLike>
            </div>
        </Prompt>
    );
};
