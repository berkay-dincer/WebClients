import { ChangeEventHandler, MouseEventHandler, ReactNode, forwardRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, InputFieldTwo } from '@proton/components';

interface Props {
    onSubmit: MouseEventHandler<HTMLButtonElement>;
    onChange: ChangeEventHandler<HTMLInputElement>;
    value: string;
    showSearchIcon?: boolean;
    suffix?: ReactNode;
    unstyled?: boolean;
}

const SearchField = (
    { onSubmit, onChange, value, showSearchIcon = true, suffix, unstyled }: Props,
    ref: React.Ref<HTMLInputElement>
) => (
    <div className="relative flex-item-fluid">
        <InputFieldTwo
            id="search-keyword"
            unstyled={unstyled}
            title={c('Label').t`Keyword`}
            prefix={
                showSearchIcon && (
                    <Button onClick={onSubmit} shape="ghost" color="weak" size="small" icon>
                        <Icon name="magnifier" alt={c('Action').t`Search events`} />
                    </Button>
                )
            }
            dense
            placeholder={c('Placeholder').t`Search events`}
            value={value}
            autoFocus
            onChange={onChange}
            data-shorcut-target="searchbox-field"
            suffix={suffix}
            ref={ref}
        />
    </div>
);

export default forwardRef(SearchField);
