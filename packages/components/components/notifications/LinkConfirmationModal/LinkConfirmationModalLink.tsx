import { c } from 'ttag';

import { Href } from '@proton/atoms';
import Copy from '@proton/components/components/button/Copy';
import Checkbox from '@proton/components/components/input/Checkbox';
import Label from '@proton/components/components/label/Label';
import useNotifications from '@proton/components/hooks/useNotifications';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

interface Props {
    link: string;
    isPunnyCoded: boolean;
    value: boolean;
    onToggle: () => void;
    isOutside: boolean;
}

const LinkConfirmationModalLink = ({ link, isPunnyCoded, value, onToggle, isOutside = false }: Props) => {
    const { createNotification } = useNotifications();
    const handleCopy = () => {
        createNotification({
            text: c('Notification').t`Link copied to clipboard`,
        });
    };

    const description = isElectronMail
        ? c('Info').t`You are about to open your default browser and visit:`
        : c('Info').t`You are about to open another browser tab and visit:`;

    return (
        <>
            {`${description}`}
            <span className="text-bold text-break pl-1">{link}</span>
            <Copy
                className="ml-2"
                size="small"
                tooltipText={c('Info').t`Copy the link to clipboard`}
                value={link}
                onCopy={handleCopy}
            />

            {isPunnyCoded && (
                <p className="my-2">
                    {c('Info')
                        .t`This link may be a homograph attack. Please verify this is the link you wish to visit, or don't open it.`}
                    <Href
                        className="ml-1"
                        href={getKnowledgeBaseUrl('/homograph-attacks')}
                        title="What are homograph attacks?"
                    >
                        {c('Info').t`Learn more`}
                    </Href>
                </p>
            )}

            {!isOutside && (
                <Label className="flex">
                    <Checkbox checked={value} onChange={onToggle} className="mr-2" />
                    {c('Label').t`Don't ask again`}
                </Label>
            )}
        </>
    );
};

export default LinkConfirmationModalLink;
