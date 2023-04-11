import { MouseEvent, MutableRefObject, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Label, Tooltip, generateUID } from '@proton/components';
import { Recipient } from '@proton/shared/lib/interfaces/Address';
import clsx from '@proton/utils/clsx';

import { MessageSendInfo } from '../../../hooks/useSendInfo';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { RecipientType } from '../../../models/address';
import { MessageChange } from '../Composer';
import AddressesCCButton from './AddressesCCButton';
import AddressesInput from './AddressesInput';

interface Props {
    message: MessageState;
    messageSendInfo: MessageSendInfo;
    onChange: MessageChange;
    ccExpanded: boolean;
    bccExpanded: boolean;
    toggleExpanded: (type: RecipientType) => (e: MouseEvent<HTMLButtonElement>) => void;
    inputFocusRefs: {
        to: MutableRefObject<() => void>;
        cc: MutableRefObject<() => void>;
        bcc: MutableRefObject<() => void>;
    };
    handleContactModal: (type: RecipientType) => () => Promise<void>;
}

const AddressesEditor = ({
    message,
    messageSendInfo,
    onChange,
    inputFocusRefs,
    handleContactModal,
    ccExpanded,
    bccExpanded,
    toggleExpanded,
}: Props) => {
    const [uid] = useState(generateUID('composer'));
    const expanded = ccExpanded || bccExpanded;

    const toListAnchorRef = useRef<HTMLDivElement>(null);
    const ccListAnchorRef = useRef<HTMLDivElement>(null);
    const bccListAnchorRef = useRef<HTMLDivElement>(null);

    const handleChange = (type: RecipientType) => (value: Partial<Recipient>[]) => {
        onChange({ data: { [type]: value } });
    };

    return (
        <div className="flex flex-column flex-nowrap flex-align-items-start mt-0">
            <div className="flex flex-row w100 relative on-mobile-flex-column">
                <Label htmlFor={`to-${uid}`} className="composer-meta-label text-semibold">
                    {c('Title').t`To`}
                </Label>
                <div
                    className={clsx([
                        'flex flex-nowrap field flex-align-items-center flex-nowrap flex-item-fluid composer-to-editor composer-light-field',
                        expanded ? 'composer-editor-expanded' : 'composer-editor-collapsed',
                    ])}
                    ref={toListAnchorRef}
                >
                    <AddressesInput
                        id={`to-${uid}`}
                        recipients={message.data?.ToList}
                        messageSendInfo={messageSendInfo}
                        onChange={handleChange('ToList')}
                        inputFocusRef={inputFocusRefs.to}
                        placeholder={c('Placeholder').t`Email address`}
                        expanded={expanded}
                        dataTestId="composer:to"
                        classname="composer-editor-to"
                        anchorRef={toListAnchorRef}
                    />
                    <span className="flex-no-min-children flex-nowrap flex-item-noshrink on-mobile-max-w33 on-tiny-mobile-max-w50 flex-align-self-start pt0-5 composer-to-ccbcc-buttons sticky-top">
                        <>
                            {!ccExpanded && (
                                <AddressesCCButton
                                    classNames="ml1 composer-addresses-ccbcc text-cut"
                                    onClick={toggleExpanded('CCList')}
                                    type="CCList"
                                />
                            )}
                            {!bccExpanded && (
                                <AddressesCCButton
                                    classNames={clsx(ccExpanded && 'ml1', 'composer-addresses-ccbcc text-cut')}
                                    onClick={toggleExpanded('BCCList')}
                                    type="BCCList"
                                />
                            )}
                        </>
                        <Tooltip title={c('Action').t`Insert contacts`}>
                            <Button
                                type="button"
                                tabIndex={-1}
                                onClick={handleContactModal('ToList')}
                                color="weak"
                                className="pt0-25 pb0-25 flex-item-noshrink composer-addresses-to-contact-button"
                                shape="ghost"
                                icon
                                data-testid="composer:to-button"
                            >
                                <Icon name="user-plus" size={16} alt={c('Title').t`To`} />
                            </Button>
                        </Tooltip>
                    </span>
                </div>
            </div>
            {expanded && (
                <>
                    {ccExpanded && (
                        <div className="flex flex-row on-mobile-flex-column w100 mb-0" ref={ccListAnchorRef}>
                            <Label
                                htmlFor={`cc-${uid}`}
                                className="composer-meta-label text-semibold"
                                title={c('Label').t`Carbon Copy`}
                            >
                                {c('Title').t`CC`}
                            </Label>
                            <AddressesInput
                                id={`cc-${uid}`}
                                recipients={message.data?.CCList}
                                messageSendInfo={messageSendInfo}
                                onChange={handleChange('CCList')}
                                placeholder={c('Placeholder').t`Email address`}
                                dataTestId="composer:to-cc"
                                inputFocusRef={inputFocusRefs.cc}
                                addContactButton={c('Title').t`CC`}
                                addContactAction={handleContactModal('CCList')}
                                classname="composer-editor-cc"
                                hasLighterFieldDesign
                                anchorRef={ccListAnchorRef}
                            />
                        </div>
                    )}
                    {bccExpanded && (
                        <div className="flex flex-row on-mobile-flex-column w100" ref={bccListAnchorRef}>
                            <Label
                                htmlFor={`bcc-${uid}`}
                                className="composer-meta-label text-semibold"
                                title={c('Label').t`Blind Carbon Copy`}
                            >
                                {c('Title').t`BCC`}
                            </Label>
                            <AddressesInput
                                id={`bcc-${uid}`}
                                recipients={message.data?.BCCList}
                                messageSendInfo={messageSendInfo}
                                onChange={handleChange('BCCList')}
                                placeholder={c('Placeholder').t`Email address`}
                                dataTestId="composer:to-bcc"
                                addContactButton={c('Title').t`BCC`}
                                inputFocusRef={inputFocusRefs.bcc}
                                addContactAction={handleContactModal('BCCList')}
                                classname="composer-editor-bcc"
                                hasLighterFieldDesign
                                anchorRef={bccListAnchorRef}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AddressesEditor;
