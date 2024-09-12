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

export const IcBrandBrave = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path
                    fillRule="evenodd"
                    d="m13.45 4.358.322-.805s-.41-.448-.909-.956c-.498-.507-1.552-.209-1.552-.209L10.11 1H5.89l-1.2 1.388s-1.055-.298-1.553.21c-.498.507-.908.955-.908.955l.322.805-.41 1.194s1.206 4.655 1.347 5.224c.279 1.12.47 1.552 1.26 2.12.791.566 2.227 1.551 2.461 1.7.234.15.527.404.791.404s.557-.254.791-.403c.235-.15 1.67-1.135 2.461-1.702.791-.567.982-1 1.26-2.12.141-.568 1.348-5.223 1.348-5.223l-.41-1.194ZM8 9.712c.08 0 .595.186 1.008.403.413.218.712.372.808.433.095.06.037.176-.05.239-.087.062-1.258.986-1.372 1.088-.113.102-.28.27-.394.27-.113 0-.28-.168-.394-.27a71.457 71.457 0 0 0-1.372-1.088c-.087-.063-.145-.178-.05-.24.096-.06.396-.214.808-.432.413-.217.928-.403 1.008-.403Zm.006-6.578a2.1 2.1 0 0 1 .58.12c.352.12.732.269.908.269.176 0 1.48-.254 1.48-.254s1.545 1.903 1.545 2.31c0 .406-.194.514-.39.725l-1.158 1.253c-.11.119-.338.299-.204.622.134.324.332.736.112 1.153-.22.418-.597.697-.839.65-.242-.046-.81-.348-1.018-.486-.209-.138-.87-.694-.87-.907 0-.212.683-.594.81-.68.126-.088.702-.423.714-.555.012-.132.008-.17-.163-.496-.17-.326-.476-.76-.425-1.05.051-.29.545-.44.898-.575.352-.136 1.03-.392 1.115-.432.085-.04.063-.078-.194-.102-.256-.025-.985-.124-1.314-.03-.328.093-.89.235-.935.31-.046.075-.086.078-.039.338.047.26.287 1.505.31 1.727.024.221.07.367-.165.422-.234.054-.628.15-.764.15-.135 0-.53-.096-.764-.15-.234-.055-.189-.201-.165-.422.023-.222.264-1.468.31-1.727.047-.26.007-.263-.039-.338-.045-.075-.606-.217-.935-.31-.329-.094-1.057.005-1.314.03-.257.024-.279.062-.194.102.085.04.763.296 1.116.432.352.135.846.286.897.575.051.29-.255.724-.425 1.05-.17.325-.175.364-.163.496.012.132.588.467.714.554.127.087.81.469.81.681 0 .213-.66.77-.87.907-.208.138-.776.44-1.018.487-.241.046-.619-.233-.839-.65-.22-.418-.022-.83.112-1.154.134-.323-.094-.503-.203-.622L3.87 6.304c-.195-.211-.39-.319-.39-.726 0-.406 1.545-2.309 1.545-2.309s1.304.254 1.48.254c.176 0 .557-.15.908-.269a2.1 2.1 0 0 1 .58-.12h.012Z"
                    clipRule="evenodd"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
