import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import useNotifications from '@proton/components/hooks/useNotifications';
import useToggle from '@proton/components/hooks/useToggle';
import { useLoading } from '@proton/hooks';
import { updateHideEmbeddedImages } from '@proton/shared/lib/api/mailSettings';
import { SHOW_IMAGES } from '@proton/shared/lib/mail/mailSettings';

interface Props {
    id: string;
    hideEmbeddedImages: number;
    onChange: (value: number) => void;
}

const EmbeddedToggle = ({ id, hideEmbeddedImages, onChange }: Props) => {
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const { call } = useEventManager();
    const api = useApi();
    const { state, toggle } = useToggle(hideEmbeddedImages === SHOW_IMAGES.SHOW);

    const handleChange = async (checked: boolean) => {
        const bit = checked ? SHOW_IMAGES.SHOW : SHOW_IMAGES.HIDE;
        await api(updateHideEmbeddedImages(bit));
        await call();
        toggle();
        onChange(bit);
        createNotification({ text: c('Success').t`Preference saved` });
    };
    return (
        <Toggle
            id={id}
            checked={state}
            onChange={({ target }) => withLoading(handleChange(target.checked))}
            loading={loading}
        />
    );
};

export default EmbeddedToggle;
