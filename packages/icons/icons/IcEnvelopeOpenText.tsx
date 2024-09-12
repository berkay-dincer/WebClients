/*
 * This file is auto-generated. Do not modify it manually!
 * Run 'yarn workspace @proton/icons build' to update the icons react components.
 */
import React from 'react';

import type { IconSize } from '../types';

interface IconProps extends React.SVGProps<SVGSVGElement> {
    /** If specified, renders an sr-only element for screenreaders */
    alt?: string;
    /** If specified, renders an inline title element */
    title?: string;
    /**
     * The size of the icon
     * Refer to the sizing taxonomy: https://design-system.protontech.ch/?path=/docs/components-icon--basic#sizing
     */
    size?: IconSize;
}

export const IcEnvelopeOpenText = ({
    alt,
    title,
    size = 4,
    className = '',
    viewBox = '0 0 16 16',
    ...rest
}: IconProps) => {
    return (
        <>
            <svg
                viewBox={viewBox}
                className={`icon-size-${size} ${className}`}
                role="img"
                focusable="false"
                aria-hidden="true"
                {...rest}
            >
                {title ? <title>{title}</title> : null}

                <path d="M5 5.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5Z"></path>
                <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5Z"></path>
                <path
                    fillRule="evenodd"
                    d="M7.467 1.493a2 2 0 0 1 1.066 0c.223.062.416.169.61.302.186.128.399.298.655.503l.877.702H12a1 1 0 0 1 1 1v.25l.575.431c.416.312.704.528.917.808.187.247.327.526.412.824.096.338.096.698.096 1.218v4.59c0 .402 0 .734-.022 1.005-.023.281-.072.54-.196.782a2 2 0 0 1-.874.874c-.243.124-.501.173-.782.196-.27.022-.603.022-1.005.022H3.879c-.402 0-.734 0-1.005-.022-.281-.023-.54-.072-.782-.196a2 2 0 0 1-.874-.874c-.124-.243-.173-.501-.196-.782C1 12.856 1 12.523 1 12.12V7.53c0-.52 0-.88.096-1.218a2.5 2.5 0 0 1 .412-.824c.213-.28.5-.496.917-.808L3 4.25V4a1 1 0 0 1 1-1h1.325l.877-.702c.256-.205.469-.375.655-.503.194-.133.387-.24.61-.302Zm1.11 1.127c.13.09.284.21.497.38H6.926c.213-.17.366-.29.497-.38.147-.101.236-.142.31-.163a1 1 0 0 1 .534 0c.074.02.163.062.31.163ZM13 7.658V5.5c.431.324.585.448.695.593.112.148.196.316.247.495.033.114.047.237.053.458L13 7.658Zm-1 .616V4H4v4.274l3.738 2.3a.5.5 0 0 0 .524 0L12 8.274Zm-9-.616V5.5c-.431.324-.585.448-.695.593a1.5 1.5 0 0 0-.247.495 1.796 1.796 0 0 0-.053.458L3 7.658Zm-1 .559V12.1c0 .428 0 .72.019.944.018.22.05.332.09.41a1 1 0 0 0 .437.437c.078.04.19.072.41.09.225.019.516.019.944.019h8.2c.428 0 .72 0 .944-.019.22-.018.332-.05.41-.09a1 1 0 0 0 .437-.437c.04-.078.072-.19.09-.41.019-.225.019-.516.019-.944V8.217l-5.214 3.209a1.5 1.5 0 0 1-1.572 0L2 8.217Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
